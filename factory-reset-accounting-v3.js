import 'dotenv/config';
import { login, executeKw } from './src/odoo-client.js';

const factoryResetJournal = async () => {
    try {
        const uid = await login();
        console.log('🟢 UID:', uid);

        const BANK_JOURNAL_ID = Number(process.env.BANK_JOURNAL_ID);
        if (!BANK_JOURNAL_ID) {
            throw new Error('❌ Debes definir BANK_JOURNAL_ID en tu .env');
        }

        // 1. Borrar todos los account.move
        const moveIds = await executeKw(uid, 'account.move', 'search', [[['journal_id', '=', BANK_JOURNAL_ID]]]);
        if (moveIds.length) {
            await executeKw(uid, 'account.move', 'button_draft', [moveIds]);
            await executeKw(uid, 'account.move', 'unlink', [moveIds]);
            console.log(`✅ ${moveIds.length} asientos contables eliminados.`);
        }

        // 2. Borrar todos los extractos bancarios (statements) de ese diario
        const stmtIds = await executeKw(
            uid,
            'account.bank.statement',
            'search',
            [[['journal_id', '=', BANK_JOURNAL_ID]]]
        );
        if (stmtIds.length) {
            // 2.1. Líneas de extracto
            const lineIds = await executeKw(
                uid,
                'account.bank.statement.line',
                'search',
                [[['statement_id', 'in', stmtIds]]]
            );
            if (lineIds.length) {
                await executeKw(uid, 'account.bank.statement.line', 'unlink', [lineIds]);
            }
            // 2.2. Statements
            await executeKw(uid, 'account.bank.statement', 'unlink', [stmtIds]);
            console.log(`✅ ${stmtIds.length} extracto(s) bancario(s) eliminados.`);
        }

        // 3. Reiniciar la secuencia de asientos contables
        const seqMove = await executeKw(
            uid,
            'ir.sequence',
            'search',
            [[['code', '=', 'account.move']]]
        );
        if (seqMove.length) {
            await executeKw(uid, 'ir.sequence', 'write', [[seqMove[0]], { number_next: 1 }]);
            console.log('🔢 Secuencia de account.move reiniciada a 1.');
        }

        // 4. Reiniciar la secuencia de extractos bancarios
        const seqStmt = await executeKw(
            uid,
            'ir.sequence',
            'search',
            [[['code', '=', 'account.bank.statement']]]
        );
        if (seqStmt.length) {
            await executeKw(uid, 'ir.sequence', 'write', [[seqStmt[0]], { number_next: 1 }]);
            console.log('🔢 Secuencia de account.bank.statement reiniciada a 1.');
        }

        // 5. Limpiar los campos de “último extracto” y saldos en el diario
        await executeKw(
            uid,
            'account.journal',
            'write',
            [[BANK_JOURNAL_ID], {
                bank_balance_start: 0.0,
                bank_balance_end: 0.0,
                last_statement_id: false,
            }]
        );
        console.log('🧹 Campos del diario Bank reseteados (saldos y último extracto).');

        console.log('🎉 Diario Bank restablecido a fábrica (sin borrar el registro).');
    } catch (err) {
        console.error('🔴 Error en el reset del diario:', err);
        process.exit(1);
    }
};

factoryResetJournal();
