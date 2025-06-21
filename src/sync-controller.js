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

    // Creamos las líneas en lote
    const lines = payments.map(p => toBankStatementLine(p, cfg.bankJournalId));
    const lineIds = await executeKw(uid,
        'account.bank.statement.line', 'create', [lines]);

    // Opcional: pedir a Odoo que intente reconciliar en lote
    // await executeKw(uid,
    //     'account.bank.statement.line', 'process_reconciliation', [lineIds]);

    return { imported: lineIds.length };
};
