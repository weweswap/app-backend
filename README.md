# Vault Aggregation and APR Calculation Service

## Swagger Documentation can be found at enpoint /docs
Current link: https://app-backend-production-676d.up.railway.app/docs

## Overview

This service is designed to handle two primary tasks:

1. **Data Aggregation**: 
   - Listens to "RewardsConvertedToUsdc" events and stores them in the database. The events are emitted by the fee manager contract.
   - Aggregates vault data daily and stores historical vault information (TVL). Based on on-chain information of the vault contracts.

2. **API Endpoint**:
   - Provides an API endpoint with vault information like address, apr, accumulated fees per day and accumulated incentives per day.

## Features

### 1. Rewards Collection and Aggregation

- **Event Listener**: The service listens for `RewardsConvertedToUsdc` events from the fee manager contract and stores it in the database for future APR calculations.
  
- **Daily Aggregation**: The service runs a daily job that fetches and stores historical vault data, like TVL Token0 and Token1 price.

### 2. Vault Information API

- The APR is calculated with the collected rewards in USDC and the average TVL over the last 7 days. (If the vault is younger than 7 days, timestamp from `startingBlock` env property is taken as `startTimestamp`)
- The fees per day is the accumulated USDC on the day of the request (data taken only from database).
- The incentives per day is calculated using the `rate` parameter fetched from the fee manager contract multiplied with the fees per day.
- The result is exposed via an API endpoint for external consumption.

## Project Structure

```
src/
├── aggregators/
│   ├── vault-aggregator/         # Handles daily vault data aggregation
│   └── events-aggregator/        # Handles listening to "RewardsConvertedToUsdc" events
├── api/
│   └── vaults/                   # API module for vault-related data, including APR calculations
├── blockchain-connectors/        # Manages blockchain connectivity
├── contract-connectors/          # Services for interacting with contracts (eg. Arrakis, ERC-20 and Fee Manager)
├── database/                     # MongoDB schemas and database interaction services
├── price-oracles/                # Price-Oracle service (Coingecko API)
├── config/                       # Configuration settings for the service
├── shared/                       # Shared models, types, classes and enums and utility functions
└── utils/                        # Various utility functions
```

### Key Files

- **`src/aggregators/vault-aggregator/vault-aggregator.service.ts`**:
  - Aggregates vault historical data on a daily schedule and schedules for a daily job.

- **`src/aggregators/events-aggregator/events-aggregator.service.ts`**:
  - Aggregates historical `RewardsConvertedToUsdc` events from startingBlock, then schedules an hourly sync job.

- **`src/api/vault/vault.service.ts`**:
  - Provides vault data to the controller request.

- **`src/database/`**:
  - Contains the MongoDB database schema for vault data (`RewardsConvertedToUsdc.schema.ts`, `VaultHistoricalData.schema.ts`).
  
- **`src/blockchain-connectors/`**:
  - Provides interaction with blockchain (EVM-based) connectors.

## Setup and Installation

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   - Configure the necessary environment variables in a `.env` file. You’ll need:
     - Database connection URI (MongoDB)
     - Blockchain provider URLs (for EVM connectors)
     - Any other relevant config variables such as vault addresses.

4. **Run the Application**:
   ```bash
   npm run start
   ```

5. **Running Tests**:
   - Tests are included in the project, and you can run them with:
     ```bash
     npm run test
     ```

## Usage

### Vault Aggregation

The vault aggregation logic starts automatically:
- **Event Listening**: The service listens for new `RewardsConvertedToUsdc` events and stores them in the database.
- **Daily Vault Info**: A scheduled job runs once a day to collect and store vault data.

### API

The vault information is exposed via an API:

## Further improvements
- Split up data-aggregator & api, if api requests are growing
- Share common contract calls between data-aggregator & api
  - /contract-connectors & /api/lp/lp-data-provider have lot of overlap