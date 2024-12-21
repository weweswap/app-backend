
# WEWESwap Backend

This repository contains a NestJS backend for the WEWESwap protocol. It retrieves, aggregates, and stores on-chain data from Arrakis and Merge contracts, calculates APR, manages vault snapshots, processes CHAOS rewards, and exposes RESTful endpoints for both internal and external consumption. A high-level overview:

- **Blockchain Connectors**: Interfaces for evm-connector (read) and evm-write (write) interactions via viem.
- **Contract Connectors**: Clients for Arrakis, Merge, ERC-20, and Fee Manager smart contracts.
- **Database**: MongoDB-based services for storing historical data, LP positions, merges, progress metadata, etc.
- **Aggregators**: Cron-like services that periodically fetch and aggregate data (on-chain events, price feeds, vault states).
- **API Modules**: REST endpoints for:
  - Fetching vault info, TVL, price data
  - Uploading whitelists, computing merges, snapshot services
  - Aggregator for deposit/withdraw “zap” routes
  - Chaos points, leaderboards
  - Proxy calls to Coingecko
- **Authorization**: A middleware-based API key check for protected endpoints.

## Project Structure

```
src
├── api
│   ├── chaos        # Chaos points and leaderboard
│   ├── coingecko-proxy
│   ├── merge        # Merge coin logic & whitelists
│   ├── vaults       # Vault data
│   └── zap          # Zap in/out aggregator endpoints
├── aggregators      # Services for data aggregation (events, vaults, prices)
├── auth             # API key middleware
├── blockchain-connectors
├── config           # Configuration modules/classes
├── contract-connectors
├── database         # All Mongo schemas, services (vault, merges, user, etc.)
├── dto             # Data Transfer Objects
├── price-oracles   # Coingecko calls
├── shared          # Enums, types, constants
├── utils           # Utility functions for time, config, caching
├── app.module.ts
├── main.ts         # App entry point
└── ...
```

## Key Highlights

1. **config/wewe-data-aggregator-config.service.ts**
   - Loads and validates environment variables (like Node RPC URL, MongoDB URL, Coingecko API key, etc.).
   - Provides them to the rest of the modules.

2. **database/database.module.ts**
   - Sets up Mongoose connection to MongoDB.
   - Registers services for storing historical data, merges, LP positions, etc.

3. **aggregators**
   - **EventsAggregatorService**: Subscribes to logs from FeeManager, Merge, Arrakis Vault events and stores relevant data.
   - **VaultAggregatorService**: Periodically fetches historical TVL/price data from Arrakis vaults.
   - **PriceAggregatorService**: Periodically fetches token prices from Coingecko and stores them.

4. **api/merge**
   - Upload CSV for whitelists, do Merkle root generation, snapshot user balances, etc.

5. **api/chaos**
   - Exposes endpoints for user CHAOS points: get single user’s CHAOS info, top 10 leaderboard.

6. **Swagger**
   - Exposed at GET `/docs` (configured in main.ts), includes endpoints and DTO definitions.

## Getting Started

### Prerequisites

- Node.js v16+
- npm or yarn
- MongoDB instance running (see .env / environment variables)

### Installation

1. Clone the repository:

```sh
git clone https://github.com/your-org/weweswap-backend.git
cd weweswap-backend
```

2. Install dependencies:

```sh
npm install
# or
yarn
```

3. Set up environment variables:
   - See Environment Variables below for details.

4. Start your local MongoDB (or provide the correct mongoConfig.url in .env).

### Running the App

- **Development:**

```sh
npm run start
```

- **Production:**

```sh
npm run build
npm run start:prod
```

### Testing

```sh
npm run test
```

Multiple test suites (`*.spec.ts`) are included for services and modules.

## Usage

- **Swagger docs at GET `/docs`.**
- Example endpoints:
  - **Vault Info:** GET `/api/<vaultAddress>`
  - **Chaos Leaderboard:** GET `/api/chaos/leaderboard`
  - **Merge:** GET `/api/merge/:coinId`
  - **Zap:** POST `/api/zap-in`

### Secure (API-key protected) endpoints:

- `/api/merge/whitelist/csv`: Upload CSV whitelists
- `/api/merge/snapshot/:address`: Token snapshots
- `/api/merge/merkleroot/:address`: Generate Merkle root

Set the header `X-API-KEY: <internalApiKey>` for protected routes.

## Environment Variables

Key variables include:

- **PRIVATE_KEY:** Private key for evm-write service or admin writes.
- **NODE_URL_RPC:** Ethereum RPC endpoint (e.g., Infura or Alchemy).
- **MONGO_CONFIG:** JSON string for DB config, e.g., `{"url":"mongodb://localhost:27017","dbName":"weweswap"}`
- **COINGECKO_API_KEY:** For Coingecko Pro usage.
- **ARRAKIS_VAULTS:** JSON array describing Arrakis vaults.
- **MERGE_COINS:** JSON array for merge charts.
- **MERGE_CONTRACTS:** JSON array for merge contract configs.
- **INTERNAL_API_KEY:** For securing specific endpoints.

## Additional Notes

- **Logging:** Controlled by `LOG_LEVEL` env variable.
- **Testing:** Uses Jest (`*.spec.ts`). Run `npm run test`.
- **Deployment:** Ensure API rate limits are handled securely.

Enjoy your development with **WEWESwap Backend**!
