import 'dotenv/config';
import { login, executeKw } from './src/odoo-client.js';
import { cfg } from './src/config.js';

const populateBankJournal = async (count = 3) => {
    const uid = await login();
    console.log('🟢 UID:', uid);

    // 1. Leer el default_account_id de tu journal Bank
    const [journal] = await executeKw(
        uid,
        'account.journal',
        'read',
        [[cfg.bankJournalId]],
        { fields: ['default_account_id'] }
    );
    const bankAccountId = journal.default_account_id[0];
    console.log('🟢 Cuenta bancaria:', bankAccountId);

    // 2. Crear moves de ejemplo
    const createdMoves = [];
    for (let i = 0; i < count; i++) {
        const moveId = await executeKw(uid, 'account.move', 'create', [{
            journal_id: cfg.bankJournalId,
            date: (new Date()).toISOString().slice(0, 10),
            line_ids: [
                // Débito a la cuenta bancaria
                [0, 0, { account_id: bankAccountId, debit: 100 + i, credit: 0 }],
                // Crédito a la misma cuenta (balance cero) – puedes usar otra cuenta si quieres
                [0, 0, { account_id: bankAccountId, debit: 0, credit: 100 + i }],
            ],
        }]);
        console.log(`🆕 Move #${i + 1} creado:`, moveId);
        createdMoves.push(moveId);
    }

    // 3. Crear las bank transactions
    for (const m of createdMoves) {
        try {
            await executeKw(uid, 'account.move', 'action_bank_transaction', [[m]]);
            console.log(`✅ Bank transaction para move ${m}`);
        } catch (err) {
            console.warn(`⚠️ No se pudo hacer bank_transaction en move ${m}:`, err.message);
        }
    }

    console.log(`🎉 Se poblaron ${createdMoves.length} movimientos en el diario Bank.`);
};

populateBankJournal(5).catch(err => {
    console.error('🔴 Error poblando:', err);
    process.exit(1);
});
