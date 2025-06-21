# odoo-mp-sync

## Overview

`odoo-mp-sync` is a lightweight Node.js application that:

* Fetches approved payments from Mercado Pago
* Transforms them into bank statement lines
* Pushes them to Odoo via JSON-RPC
* Exposes HTTP endpoints for manual synchronization and transaction retrieval

## Quick API Reference

| HTTP Method | URL                                         | Description                                                         |
|-------------|---------------------------------------------|---------------------------------------------------------------------|
| GET         | `http://localhost:3000/sync`                | Trigger synchronization for the last 1 hour (default behavior)      |
| GET         | `http://localhost:3000/sync?hours=<number>` | Import bank statement lines from the last N hours (defaults to 1)   |
| GET         | `http://localhost:3000/api/transactions`    | Retrieve the 10 most recent Mercado Pago transactions               |

## Features

* **Automatic synchronization** of the last *N* hours of payments
* **RESTful endpoints** for triggering sync and listing recent transactions
* **Configurable** via environment variables
* **Modular architecture** with clear separation of concerns

## Prerequisites

* **Node.js** v22.15.0 or higher
* A **Mercado Pago** account with an access token (SDK v2.8.0)
* An **Odoo** instance with External API access (JSON-RPC enabled)
* Odoo user with a password set (required for online instances)

## Installation

```bash
# Clone repository
git clone https://github.com/germanfica/odoo-mp-sync.git
cd odoo-mp-sync

# Install dependencies
npm install
```

## Configuration

Create a file named `.env` at the project root based on the example below:

```env
# Mercado Pago
MP_ACCESS_TOKEN="APP_USR-XXXXXXXXXXXXXXXXXX"

# Odoo JSON-RPC endpoint
ODOO_URL="https://your-odoo-domain.com"
ODOO_DB="your_database_name"
ODOO_USER="your_username"
ODOO_PASS="your_password"

# Accounting settings
BANK_JOURNAL_ID=1    # Numeric ID of the bank journal in Odoo

# Server settings
PORT=3000
```

> **Note:** All values in `.env` are treated as strings. Convert to proper types in code as needed.

## Usage

```bash
# Start the application
npm run dev

# The service will listen on http://localhost:3000
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m "Add feature"`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

Please follow the existing code style and include tests for new functionality.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
