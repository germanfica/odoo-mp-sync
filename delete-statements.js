import { login, executeKw } from './src/odoo-client.js';
import { cfg } from './src/config.js';

/**
 * Deletes all bank statements for the configured journal in Odoo.
 * For each statement:
 * 1. Resets it to draft (if published)
 * 2. Unlinks (deletes) it
 */
const deleteAllBankStatements = async () => {
    try {
        const uid = await login();
        console.log('🟢 Logged in, UID:', uid);

        // 1. Search for all statements in the configured bank journal
        const statementIds = await executeKw(
            uid,
            'account.bank.statement',
            'search',
            [[['journal_id', '=', cfg.bankJournalId]]]
        );

        if (!statementIds.length) {
            console.log('📭 No bank statements found for journal', cfg.bankJournalId);
            return;
        }

        console.log(`Found ${statementIds.length} statement(s):`, statementIds);

        // 2. Iterate and delete each statement
        for (const id of statementIds) {
            try {
                // Reset to draft if published
                await executeKw(uid, 'account.bank.statement', 'button_reset_to_draft', [[id]]);
                console.log(`🔄 Statement ${id} reset to draft`);
            } catch (err) {
                console.warn(`⚠️  Could not reset statement ${id}:`, err.message);
            }

            try {
                // Unlink (delete) the statement
                await executeKw(uid, 'account.bank.statement', 'unlink', [[id]]);
                console.log(`✅ Statement ${id} deleted`);
            } catch (err) {
                console.error(`❌ Failed to delete statement ${id}:`, err.message);
            }
        }

        console.log('🎉 All done!');
    } catch (err) {
        console.error('🔴 Error deleting bank statements:', err.message);
        process.exit(1);
    }
};

// Execute when running this script
deleteAllBankStatements();
