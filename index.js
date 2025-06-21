import express from 'express';
import { syncLastNHours } from './src/sync-controller.js';

const app = express();
app.get('/sync', async (req, res) => {
    try {
        const hours = Number(req.query.hours ?? 1);
        const result = await syncLastNHours(hours);
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: err.message });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sync API running on :${PORT}`));
