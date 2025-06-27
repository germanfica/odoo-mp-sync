// fetch-bank-reconciliation-lines.js
import { login, executeKw } from './src/odoo-client.js';
import { cfg } from './src/config.js';

const fetchReconciliationLines = async () => {
    try {
        // 1) Autenticación
        const uid = await login();
        console.log(`🟢 UID: ${uid}`);

        // 2) Parámetros de filtro (ajústalos según tu caso)
        const journalId = cfg.bankJournalId;      // <-- Reemplaza por tu journal_id
        const partnerId = null;   // <-- Pon un número si quieres filtrar por partner
        const dateTo = null;      // <-- 'YYYY-MM-DD' si quieres filtrar por fecha máxima

        // 3) Construye el dominio con move_id.state en lugar de state
        const domain = [
            ['journal_id', '=', journalId],
            ['move_id.state', '=', 'posted'],   // cambio clave aquí
            ['reconciled', '=', false],         // líneas sin conciliar
        ];
        if (partnerId) {
            domain.push(['partner_id', '=', partnerId]);
        }
        if (dateTo) {
            domain.push(['date', '<=', dateTo]);
        }

        // 4) Campos que queremos recuperar
        const fields = [
            'id',
            'name',
            'date',
            'debit',
            'credit',
            'amount_residual',
            'amount_residual_currency',
            'currency_id',
            'company_currency_id',
            'partner_id',
        ];

        // 5) Llamada search_read
        const lines = await executeKw(
            uid,
            'account.move.line',
            'search_read',
            [domain, fields]
        );

        // 6) Mostrar resultados
        if (lines.length === 0) {
            console.log('📭 No se encontraron líneas candidatas a conciliación.');
        } else {
            console.log(`🔎 Se encontraron ${lines.length} línea(s):\n`);
            lines.forEach(line => {
                const cur = Array.isArray(line.currency_id) ? line.currency_id[1] : line.currency_id;
                const part = Array.isArray(line.partner_id) ? line.partner_id[1] : line.partner_id;
                console.log(
                    `• ID ${line.id} | Fecha: ${line.date} | Cuenta: ${line.name} | ` +
                    `Partner: ${part} | Residual: ${line.amount_residual} ${cur}`
                );
            });
        }
    } catch (err) {
        console.error('🔴 Error al obtener líneas de conciliación:', err);
        process.exit(1);
    }
};

// Ejecutar
fetchReconciliationLines();
