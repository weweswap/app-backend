# Vault Aggregation and APR Calculation Service

## Overview

This service is designed to handle two primary tasks:

1. **Vault Aggregation**: 
   - Listens to "LogCollectedFees" events and stores them in the database.
   - Aggregates vault data daily and stores historical vault information (TVL).

2. **APR Calculation**:
   - Provides an API endpoint to calculate and serve the APR (Annual Percentage Rate) based on collected vault fees and liquidity provider (LP) data.

## Features

### 1. Vault Fee Collection and Aggregation

- **Event Listener**: The service listens for `LogCollectedFees` events from Arrakis vault contracts, collects the necessary data, and stores it in the database for future APR calculations.
  
- **Daily Aggregation**: The service runs a daily job that fetches and stores historical vault data, like TVL Token0 and Token1 price.

### 2. APR Calculation API

- The APR is calculated with the generated fees and the average TVL over the last 7 days. (If the vault is younger than 7 days, timestamp from `startingBlock` env property is taken as `startTimestamp`)
- The APR calculation takes into account both collected and uncollected fees within the time frame.
- The result is exposed via an API endpoint for external consumption.

## Project Structure

```
src/
├── aggregators/
│   ├── vault-aggregator/         # Handles daily vault data aggregation
│   └── operations-aggregator/    # Handles listening to "LogCollectedFees" events
├── api/
│   └── lp/                       # API module for LP-related data, including APR calculations
├── blockchain-connectors/        # Manages blockchain connectivity and provides ERC20 service
├── contract-connectors/          # Services for interacting with contracts (eg. Arrakis)
├── database/                     # MongoDB schemas and database interaction services
├── price-oracles/                # Price-Oracle service (Coingecko API)
├── config/                       # Configuration settings for the service
├── shared/                       # Shared models, types, classes and enums and utility functions
└── utils/                        # Various utility functions
```

### Key Files

- **`src/aggregators/vault-aggregator/vault-aggregator.service.ts`**:
  - Aggregates vault historical data on a daily schedule and schedules for a daily job.

- **`src/aggregators/operations-aggregator/operations-aggregator.service.ts`**:
  - Aggregates historical `LogCollectedFees` events from startingBlock, then schedules an hourly sync job.

- **`src/api/lp/lp.service.ts`**:
  - Handles APR calculation by interacting with price providers and data providers.

- **`src/database/`**:
  - Contains the MongoDB database schema for vault data (`CollectedVaultFeeEvent.schema.ts`, `VaultHistoricalData.schema.ts`).
  
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
- **Event Listening**: The service listens for new `LogCollectedFees` events and stores them in the database.
- **Daily Vault Info**: A scheduled job runs once a day to collect and store vault data.

### APR Calculation

The APR calculation is exposed via an API:
- Use the API to retrieve the current APR based on the fees and vault data for a specific liquidity pool (LP).