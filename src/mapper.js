export const toBankStatementLine = (payment, journalId) => ({
    date: payment.date_created.slice(0, 10),          // 'YYYY-MM-DD'
    amount: payment.transaction_amount,               // números positivos = ingreso
    payment_ref: payment.id.toString(),               // guardamos ID MP
    partner_name: payment.payer.email,                // opcional
    name: payment.description || payment.statement_descriptor || 'Pago MP',
    journal_id: journalId
});
