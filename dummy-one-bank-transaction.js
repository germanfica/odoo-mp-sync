import { login, executeKw } from './src/odoo-client.js';
import { cfg } from './src/config.js';

const fullFactoryResetWithTransactions = async () => {
  const uid = await login();
  console.log('🟢 UID:', uid);

  // 1. Borrar solo los moves de tu diario Bank
  const moveIds = await executeKw(
    uid, 'account.move', 'search',
    [[['journal_id', '=', cfg.bankJournalId]]]
  );
  if (moveIds.length) {
    await executeKw(uid, 'account.move', 'button_draft', [moveIds]);
    await executeKw(uid, 'account.move', 'unlink', [moveIds]);
    console.log(`✅ ${moveIds.length} moves eliminados.`);
  }

  // 2. Borrar statements y líneas (si existen)
  const stmtIds = await executeKw(
    uid, 'account.bank.statement', 'search',
    [[['journal_id', '=', cfg.bankJournalId]]]
  );
  if (stmtIds.length) {
    const lineIds = await executeKw(
      uid, 'account.bank.statement.line', 'search',
      [[['statement_id', 'in', stmtIds]]]
    );
    if (lineIds.length) {
      await executeKw(uid, 'account.bank.statement.line', 'unlink', [lineIds]);
    }
    await executeKw(uid, 'account.bank.statement', 'unlink', [stmtIds]);
    console.log(`✅ ${stmtIds.length} statements eliminados.`);
  }

  // 3. Resetear secuencias (moves y statements)
  const seqs = await executeKw(uid, 'ir.sequence', 'search_read', [
    [['code', 'in', ['account.move', 'account.bank.statement']]],
  ], { fields: ['id','code'] });
  for (const seq of seqs) {
    await executeKw(uid, 'ir.sequence', 'write', [[seq.id], { number_next: 1 }]);
    console.log(`🔢 Secuencia ${seq.code} reiniciada a 1.`);
  }

  // 4. Ahora, CREA las Bank Transactions para que selectedMoveLine exista
  //    (iguala el comportamiento del botón “1 Bank Transaction”).
  const newMoveIds = await executeKw(
    uid, 'account.move', 'search',
    [[['journal_id', '=', cfg.bankJournalId]]]
  );
  if (!newMoveIds.length) {
    console.log('⚠️ No hay moves nuevos para crear Bank Transactions. Creando dummy move...');
    // Opcional: si no hay ningún move, crea uno de 0 para que haya algo.
    const dummyMoveId = await executeKw(uid, 'account.move', 'create', [{
      journal_id: cfg.bankJournalId,
      date: new Date().toISOString().slice(0,10),
      line_ids: [
        [0,0,{ account_id: cfg.bankAccountId, debit: 0, credit: 0 }]
      ]
    }]);
    newMoveIds.push(dummyMoveId);
    console.log('🆕 Dummy move creado', dummyMoveId);
  }
  for (const m of newMoveIds) {
    await executeKw(uid, 'account.move', 'action_bank_transaction', [[m]]);
    console.log(`🟢 Bank transaction creada para move ${m}`);
  }

  console.log('🎉 Reset completo y Bank Transactions generadas.');
};

fullFactoryResetWithTransactions().catch(err => {
  console.error('🔴 Error:', err);
  process.exit(1);
});
