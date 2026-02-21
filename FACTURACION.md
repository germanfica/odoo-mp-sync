# Facturación

Flujo que me conviene automatizar en mi API:

1. **Importar extractos** (crea o lee tu tabla auxiliar para evitar duplicados).
2. **Crear el pago** en Odoo y asociarlo a la factura correspondiente (usando `invoice.payment_reference` o tu propio campo).
3. **Reconciliación 1-a-1** vía RPC, enlazando la línea de extracto con la línea bancaria del pago.

### Detalle de cada paso

#### PASO 1: Importar extractos sin duplicados

* Lee tu Excel/CSV o tabla externa.
* Para cada fila, calcula un identificador único (por ejemplo `journal_id + date + amount + payment_ref`).
* Si ya lo procesaste, ignóralo; si no, créalo en `account.bank.statement.line` y márcalo como “procesado” en tu tabla.

#### PASO 2: Crear el `account.payment` sólo una vez y ligado a la factura

* **Busca factura** por `invoice.payment_reference` igual al ID de Mercado Pago (o al código que guardaste).
* **Comprueba** si ya existe un `account.payment` con `communication = "MP <id>"`:

  ```js
  const existing = await executeKw(uid,
    'account.payment','search_read',
    [[ ['communication','=',`MP ${mpId}`] ]],
    { fields:['id'] }
  );
  ```
* Si no existe, **créalo** y **postéalo**, incluyendo el enlace a la factura:

  ```js
  const data = {
    payment_type:      'inbound',
    partner_type:      'customer',
    partner_id:        invoice.partner_id[0],
    amount:            amount,
    journal_id:        cfg.bankJournalId,
    payment_method_id: cfg.inboundPaymentMethodId,
    communication:     `MP ${mpId}`,
    invoice_ids:       [[6, 0, [ invoiceId ]]],  // liga la factura
  };
  const payId = await executeKw(uid,'account.payment','create',[data]);
  await executeKw(uid,'account.payment','action_post',[[payId]]);
  ```

#### PASO 3: Reconciliación 1-a-1 vía RPC

1. **Importaste** la línea de extracto y obtuviste su `statement_line_id`.
2. Publica el statement si es necesario:

   ```js
   await executeKw(uid,'account.bank.statement','button_post',[[statementId]]);
   ```
3. **Localiza** la línea de diario (`move.line`) de esa declaración:

   ```js
   const stmtML = await executeKw(uid,'account.move.line','search_read',
     [[ ['bank_statement_line_id','=', stmtLineId] ]],
     { fields:['id'] }
   );
   ```
4. **Localiza** la línea del pago en la cuenta bancaria (liquidity):

   ```js
   const payML = await executeKw(uid,'account.move.line','search_read',
     [[
       ['move_id','=', paymentMoveId],
       ['account_id','=', bankLiquidityAccountId]
     ]],
     { fields:['id'] }
   );
   ```
5. **Reconcílialos** explícitamente:

   ```js
   await executeKw(uid,'account.move.line','reconcile',[
     [ stmtML[0].id, payML[0].id ]
   ]);
   ```

---

### ¿Y si no tienes `payment_reference` en la factura?

* **Sin referencia**, no puedes saber automáticamente a qué factura pertenece el extracto.
* Opciones de **fallback** (menos seguro):

  * Buscar factura por importe + partner + fecha aproximada.
  * Notificar en un “pendientes de reconciliar” para intervención manual.

Lo ideal es que **antes** de la conciliación tú metas ese `payment_reference` (el código del PSP) en la factura. Con él en la mano, tu API:

1. Detecta la factura correcta.
2. Crea el pago ligado a esa factura.
3. Luego importa el extracto y hace el reconcile 1-a-1.

### ¿Y si no tienes la factura?

Si no dispones de la factura ni del `payment_reference`, el paso 2 no puede completarse automáticamente. Estas son tus opciones de **fallback**:

* **Crear un pago en borrador sin faturar**: genera el `account.payment` con los mismos datos de partner y monto, pero sin `invoice_ids`. Así queda registrado y podrás reconciliar la parte bancaria después.
* **Mantenerlo en una cola de pendientes**: guarda en tu BD externa o en un modelo Odoo auxiliar (`x_pending_payments`) el detalle del extracto y el pago generado; notifica a un usuario para que asocie la factura manualmente.
* **Conciliar manualmente**: importa la línea de extracto, deja la factura sin pagar, y crea un ticket en una vista de conciliación pendiente para que el equipo financiero aplique la factura correcta.
* **Emparejar por importe + partner + fecha**: como último recurso, busca facturas con el mismo partner y monto en un rango de fechas cercano, presenta candidatos y pide confirmación antes de crear el pago y conciliar.
* **Crear la factura automáticamente**: como última opción puedes generar vía API una nueva `account.move` de tipo `out_invoice` usando los datos del extracto (partner, monto, fecha), crearla en borrador o publicarla según reglas, y luego continuar con los pasos 2 y 3 para pago y reconciliación.

Con estos pasos, tu sistema nunca se queda bloqueado: siempre registrás el pago y el extracto, y manejas los casos sin factura mediante workflows de revisión.
