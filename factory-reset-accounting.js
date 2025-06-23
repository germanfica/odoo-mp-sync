import { login, executeKw } from './src/odoo-client.js';

/**
 * Deletes all accounting entries (account.move) in Odoo.
 * For each move:
 * 1. Resets to draft (if posted)
 * 2. Unlinks (deletes) the move
 */
const deleteAllJournalEntries = async () => {
    try {
        const uid = await login();
        console.log('🟢 Logged in with UID:', uid);

        // 1. Search for all journal entry IDs
        const moveIds = await executeKw(
            uid,
            'account.move',
            'search',
            [[
                // Optionally filter by state or journal: [] for all entries
                // ['state', 'in', ['draft', 'posted']]
            ]]
        );

        if (!moveIds.length) {
            console.log('📭 No accounting entries found.');
            return;
        }

        console.log(`Found ${moveIds.length} accounting entrie(s):`, moveIds);

        // 2. Iterate and delete each move
        for (const id of moveIds) {
            try {
                // Reset to draft if posted
                await executeKw(uid, 'account.move', 'button_draft', [[id]]);
                console.log(`🔄 Entry ${id} reset to draft`);
            } catch (err) {
                console.warn(`⚠️  Could not reset entry ${id}:`, err.message);
            }

            try {
                // Unlink (delete) the move
                await executeKw(uid, 'account.move', 'unlink', [[id]]);
                console.log(`✅ Entry ${id} deleted`);
            } catch (err) {
                console.error(`❌ Failed to delete entry ${id}:`, err.message);
            }
        }

        console.log('🎉 All accounting entries have been processed.');
    } catch (err) {
        console.error('🔴 Error deleting accounting entries:', err.message);
        process.exit(1);
    }
};

// Execute the script
deleteAllJournalEntries();
