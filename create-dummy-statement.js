import 'dotenv/config';
import { login, executeKw } from './src/odoo-client.js';

// (al final de tu factoryResetAccounting, o en otro script aparte)
const createDummyStatement = async () => {
    const uid = await login();
    // 1. Crear un extracto
    const stmtId = await executeKw(uid, 'account.bank.statement', 'create', [{
        name: 'Opening Statement',
        journal_id: Number(process.env.BANK_JOURNAL_ID) /* ID de tu diario Bank */,
        date: (new Date()).toISOString().slice(0, 10),
    }]);
    console.log('✅ Created statement', stmtId);

    // 2. Crear una línea (mínima) para ese extracto
    const lineId = await executeKw(uid, 'account.bank.statement.line', 'create', [{
        statement_id: stmtId,
        date: (new Date()).toISOString().slice(0, 10),
        name: 'Opening balance',
        amount: 0.0,
    }]);
    console.log('✅ Created statement line', lineId);
};

createDummyStatement();
