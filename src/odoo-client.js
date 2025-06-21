import fetch from 'node-fetch';
import { cfg } from './config.js';

const jsonRpc = async (service, method, params) => {
    const body = {
        jsonrpc: '2.0',
        method: 'call',
        params: { service, method, args: params },
        id: Date.now()
    };
    const res = await fetch(`${cfg.odoo.url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const { result, error } = await res.json();
    if (error) throw new Error(error.data.message);
    return result;
};

// Autenticación → devuelve uid
export const login = () =>
    jsonRpc('common', 'login', [cfg.odoo.db, cfg.odoo.user, cfg.odoo.pass]);

// Llamadas ORM
export const executeKw = (uid, model, method, args, kwargs = {}) =>
    jsonRpc('object', 'execute_kw',
        [cfg.odoo.db, uid, cfg.odoo.pass, model, method, args, kwargs]);
