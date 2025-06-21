# odoo-mp-sync

## API Reference

### 1. Trigger Synchronization

```http
GET /sync?hours=<number>
```

* **Description:** Imports bank statement lines created in the last *N* hours from Mercado Pago into Odoo.
* **Query Parameters:**

  * `hours` (optional, integer): Number of past hours to include. Defaults to `1`.

#### Responses

* **200 OK**

  ```json
  {
    "ok": true,
    "imported": 5
  }
  ```
* **500 Internal Server Error**

  ```json
  {
    "ok": false,
    "error": "<error_message>"
  }
  ```

### 2. List Recent Transactions

```http
GET /api/transactions
```

* **Description:** Retrieves the 10 most recent transactions from Mercado Pago.
* **Query Parameters:** None

#### Responses

* **200 OK**

  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1111111114,
        "status": "approved",
        "transaction_amount": 1000,
        "date_created": "2025-06-17T02:07:35.975-04:00",
        "payer_email": "test@test.com"
      },
      ...
    ]
  }
  ```
* **500 Internal Server Error**

  ```json
  {
    "success": false,
    "error": "<error_message>"
  }
  ```

## Internal Modules

* **`mp-client.js`**: Mercado Pago client wrapper for fetching payments
* **`odoo-client.js`**: Generic JSON-RPC client for Odoo (`login`, `execute_kw`)
* **`mapper.js`**: Transforms Mercado Pago payment objects to Odoo bank statement lines
* **`sync-controller.js`**: Coordinates the sync flow (`fetchPayments` → `login` → `create lines` → `reconcile`)

## Error Handling

* All endpoints return a JSON object with a boolean flag (`ok` or `success`) and either the requested data or an error message.
* Check HTTP status codes (200 vs. 500) for success vs. failures.
