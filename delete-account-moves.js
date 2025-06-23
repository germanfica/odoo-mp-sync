import { login, executeKw } from './src/odoo-client.js';
import { cfg } from './src/config.js';

/**
 * Deletes all accounting entries (account.move) for the configured bank journal in Odoo.
 * For each move:
 * 1. Resets to draft (if posted)
 * 2. Unlinks (deletes) the move
 */
const deleteJournalEntriesByJournal = async () => {
    try {
        const uid = await login();
        console.log('🟢 Logged in with UID:', uid);

        // Search for all moves in the specified bank journal
        const moveIds = await executeKw(
            uid,
            'account.move',
            'search',
            [[['journal_id', '=', cfg.bankJournalId]]]
        );

        if (!moveIds.length) {
            console.log(`📭 No accounting entries found for journal ${cfg.bankJournalId}`);
            return;
        }

        console.log(`Found ${moveIds.length} entries:`, moveIds);

        // Iterate and delete each move
        for (const id of moveIds) {
            try {
                // Reset to draft if posted
                await executeKw(uid, 'account.move', 'button_draft', [[id]]);
                console.log(`🔄 Entry ${id} reset to draft`);
            } catch (err) {
                console.warn(`⚠️ Could not reset entry ${id}:`, err.message);
            }

            try {
                // Unlink (delete) the move
                await executeKw(uid, 'account.move', 'unlink', [[id]]);
                console.log(`✅ Entry ${id} deleted`);
            } catch (err) {
                console.error(`❌ Failed to delete entry ${id}:`, err.message);
            }
        }

        console.log('🎉 All accounting entries for the bank journal have been deleted.');
    } catch (err) {
        console.error('🔴 Error deleting accounting entries:', err.message);
        process.exit(1);
    }
};

// Execute the script
deleteJournalEntriesByJournal();
