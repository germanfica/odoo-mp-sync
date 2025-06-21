import { fetchPayments } from './mp-client.js';
import { login, executeKw } from './odoo-client.js';
import { toBankStatementLine } from './mapper.js';
import { cfg } from './config.js';

export const syncLastNHours = async (hours = 1) => {
    const to = new Date();
    const from = new Date(Date.now() - hours * 3600 * 1000);

    const payments = await fetchPayments(from, to);

    if (!payments.length) return { imported: 0 };

    const uid = await login();

    // Paso 1: obtener refs a importar
    const refsToImport = payments.map(p => p.id.toString());

    // Paso 2: buscar extractos ya existentes en Odoo
    const existingLines = await executeKw(
        uid,
        'account.bank.statement.line',
        'search_read',
        [
            [
                ['journal_id', '=', cfg.bankJournalId],
                ['payment_ref', 'in', refsToImport]
            ]
        ],
        { fields: ['payment_ref'] }
    );
    const existingRefs = new Set(existingLines.map(line => line.payment_ref));

    // Paso 3: filtrar pagos nuevos
    const newPayments = payments.filter(p => !existingRefs.has(p.id.toString()));
    if (!newPayments.length) return { imported: 0, skipped: refsToImport.length };

    // Paso 4: mapear y crear sólo las líneas nuevas
    const newLines = newPayments.map(p => toBankStatementLine(p, cfg.bankJournalId));
    const createdIds = await executeKw(
        uid,
        'account.bank.statement.line',
        'create',
        [newLines]
    );

    return {
        imported: createdIds.length,
        skipped: refsToImport.length - newPayments.length
    };
};
