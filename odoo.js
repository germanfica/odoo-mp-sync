import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const {
    ODOO_URL,
    ODOO_DB,
    ODOO_USER,
    ODOO_PASS,
} = process.env;

const jsonRpcRequest = async (method, params) => {
    const url = `${ODOO_URL}/jsonrpc`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            id: Date.now(),
            params,
        }),
    });

    const data = await response.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    return data.result;
};

const loginToOdoo = async () => {
    const params = {
        service: 'common',
        method: 'login',
        args: [ODOO_DB, ODOO_USER, ODOO_PASS],
    };

    const uid = await jsonRpcRequest('call', params);
    console.log('🟢 Login successful. UID:', uid);
    return uid;
};

const run = async () => {
    try {
        await loginToOdoo();
    } catch (err) {
        console.error('🔴 Error:', err.message);
    }
};

run();
