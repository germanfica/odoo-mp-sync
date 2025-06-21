import 'dotenv/config';

export const cfg = {
    mpToken: process.env.MP_ACCESS_TOKEN,
    odoo: {
        url: process.env.ODOO_URL,
        db: process.env.ODOO_DB,
        user: process.env.ODOO_USER,
        pass: process.env.ODOO_PASS
    },
    bankJournalId: Number(process.env.BANK_JOURNAL_ID)
};
