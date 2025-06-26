import { login, executeKw } from './src/odoo-client.js';

const factoryResetAccounting = async () => {
    try {
        const uid = await login();
        console.log('🟢 UID:', uid);

        // 1. Borrar todos los account.move
        const moveIds = await executeKw(uid, 'account.move', 'search', [[]]);
        if (moveIds.length) {
            await executeKw(uid, 'account.move', 'button_draft', [moveIds]);
            await executeKw(uid, 'account.move', 'unlink', [moveIds]);
            console.log(`✅ ${moveIds.length} asientos contables eliminados.`);
        } else {
            console.log('📭 No hay asientos contables para eliminar.');
        }

        // 2. Borrar todos los extractos bancarios (statements)
        const stmtIds = await executeKw(uid, 'account.bank.statement', 'search', [[]]);
        if (stmtIds.length) {
            // 2.1. Buscar todas las líneas de esos statements
            const lineIds = await executeKw(
                uid,
                'account.bank.statement.line',
                'search',
                [[['statement_id', 'in', stmtIds]]]
            );
            // 2.2. Borrar las líneas
            if (lineIds.length) {
                await executeKw(uid, 'account.bank.statement.line', 'unlink', [lineIds]);
            }
            // 2.3. Borrar los statements
            await executeKw(uid, 'account.bank.statement', 'unlink', [stmtIds]);
            console.log(`✅ ${stmtIds.length} extracto(s) bancario(s) eliminados.`);
        } else {
            console.log('📭 No hay extractos bancarios para eliminar.');
        }

        // 3. Resetear secuencia de asientos contables
        const seqMove = await executeKw(
            uid,
            'ir.sequence',
            'search',
            [[['code', '=', 'account.move']]]
        );
        if (seqMove.length) {
            await executeKw(uid, 'ir.sequence', 'write', [[seqMove[0]], { number_next: 1 }]);
            console.log('🔢 Secuencia de account.move reiniciada a 1.');
        } else {
            console.warn('⚠️ No se encontró secuencia para account.move.');
        }

        // 4. Resetear secuencia de extractos bancarios
        const seqStmt = await executeKw(
            uid,
            'ir.sequence',
            'search',
            [[['code', '=', 'account.bank.statement']]]
        );
        if (seqStmt.length) {
            await executeKw(uid, 'ir.sequence', 'write', [[seqStmt[0]], { number_next: 1 }]);
            console.log('🔢 Secuencia de account.bank.statement reiniciada a 1.');
        } else {
            console.warn('⚠️ No se encontró secuencia para account.bank.statement.');
        }

        console.log('🎉 ¡Contabilidad restablecida completamente de fábrica!');
    } catch (err) {
        console.error('🔴 Error en el reset de contabilidad:', err);
        process.exit(1);
    }
};

factoryResetAccounting();
