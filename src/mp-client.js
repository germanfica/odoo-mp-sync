import { MercadoPagoConfig, Payment } from 'mercadopago';
import { cfg } from './config.js';

const client = new MercadoPagoConfig({ accessToken: cfg.mpToken });
const payment = new Payment(client);

/**
 * Fetches approved payments from Mercado Pago between the given dates.
 * @param {Date} from - Start date
 * @param {Date} to - End date
 * @returns {Promise<Array>} - Array of approved payments
 */
export const fetchPayments = async (from, to) => {
    const response = await payment.search({
        query: {
            status: 'approved',
            range: 'date_created',
            begin_date: from.toISOString(),
            end_date: to.toISOString()
        },
        sort: 'date_created:desc',
        limit: 1000
    });

    return response.results; // Array de pagos
};
