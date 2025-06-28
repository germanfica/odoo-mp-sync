import { login, executeKw } from './src/odoo-client.js';

const checkBrokenViews = async () => {
    try {
        const uid = await login();
        console.log('🟢 UID:', uid);

        const viewIds = await executeKw(uid, 'ir.ui.view', 'search', [[]]);
        const brokenViews = [];

        for (const viewId of viewIds) {
            try {
                await executeKw(uid, 'ir.ui.view', 'read', [[viewId], ['arch']]);
            } catch (error) {
                console.log(error);
                brokenViews.push(viewId);
            }
        }

        if (brokenViews.length) {
            console.warn(`⚠️ Se encontraron ${brokenViews.length} vistas rotas:`, brokenViews);

            const viewDetails = await executeKw(uid, 'ir.ui.view', 'read', [brokenViews, ['name', 'model', 'type']]);

            console.log('❌ Detalles de vistas rotas:');
            viewDetails.forEach(view => {
                console.log(`🔹 [ID: ${view.id}] ${view.name} (${view.model}) - Tipo: ${view.type}`);
            });
        } else {
            console.log('✅ No se encontraron vistas rotas.');
        }
    } catch (err) {
        console.error('🔴 Error al verificar vistas rotas:', err);
        process.exit(1);
    }
};

checkBrokenViews();
