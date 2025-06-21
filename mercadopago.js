import express from 'express';
import dotenv from 'dotenv';
import { MercadoPagoConfig, Payment } from 'mercadopago';

dotenv.config();

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/transactions', async (req, res) => {
    try {
        const response = await payment.search({
            sort: 'date_created:desc',
            limit: 10,
        });

        const transactions = response.results.map(({ id, status, transaction_amount, date_created, payer }) => ({
            id,
            status,
            transaction_amount,
            date_created,
            payer_email: payer?.email,
        }));

        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Mercado Pago API listening at http://localhost:${PORT}`);
});
