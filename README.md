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

## Importing Whitelist Data

To manage multiple whitelists for different projects, follow the steps below to import your JSON files into MongoDB. This process needs to be done **only once** for each whitelist file, as the data will be stored and accessible in the database thereafter.

### 1. Prepare Your JSON Files

- **Location**: Place all your whitelist JSON files in the `/src/static` directory.

src/
├── static/
│   ├── fomo.json
│   ├── projectA.json
│   ├── projectB.json
│   └── … other JSON files
└── … other directories

- **Structure**: Ensure each JSON file follows the structure below:

```json
[
  {
    "value": [
      "0xAddress1",
      "384992472620497583"
    ],
    "proof": [
      "0xfc13c899b6516cf2dac5e27ecb0752e46e0ee419ad13d8b6c556d94ee8752ae2",
      "0x3b86523d566ffbd123f49de172f6b82cb9df34900acd7a2f8f4d2a913d24c0f9",
      // ... more proof entries
    ]
  },
  // ... more entries
]

2. Note on the /src/static Directory

	•	The /src/static directory is included in .gitignore due to the large size of JSON files. This means these files will not be tracked by Git and must be managed manually or through another method (e.g., deployment scripts).

3. Running the Import Script

The import process is designed to read all JSON files within the /src/static directory and populate the MongoDB database accordingly.

a. Ensure Your MongoDB Connection

	•	Verify that your MongoDB connection URI is correctly set in your .env file. Example:

MONGODB_URI=mongodb://localhost:27017/yourdbname



b. Execute the Import Command

	•	Run the following command to start the import process:

npm run import

Note: Ensure that the import script is defined in your package.json. If not, you can add it as follows:

// package.json
{
  "scripts": {
    // ... other scripts
    "import": "ts-node src/import.ts" // Adjust the path and command as needed
  }
}


	•	Example Output:

[ImportService] Reading data directory: /path/to/src/static
[ImportService] Reading data from /path/to/src/static/fomo.json...
[ImportService] Starting import of 1000 records from fomo.json...
[ImportService] Import from fomo.json completed. Inserted: 1000, Modified: 0
[ImportService] Reading data from /path/to/src/static/projectA.json...
[ImportService] Starting import of 1500 records from projectA.json...
[ImportService] Import from projectA.json completed. Inserted: 1500, Modified: 0
[ImportService] All data imports completed.



c. Verify the Import

	•	After running the import script, verify that the data has been successfully inserted into MongoDB.
	•	Using MongoDB Compass or the Mongo Shell:

// Example using Mongo shell
use yourdbname

db.whitelists.find({ project: "fomo" }).limit(5).pretty()

Expected Document Structure:

{
  "_id": ObjectId("..."),
  "address": "0x7bcd8185b7f4171017397993345726e15457b1ee",
  "proof": [
    "0xfc13c899b6516cf2dac5e27ecb0752e46e0ee419ad13d8b6c556d94ee8752ae2",
    "0x3b86523d566ffbd123f49de172f6b82cb9df34900acd7a2f8f4d2a913d24c0f9",
    // ... more proof entries
  ],
  "project": "fomo"
}



4. Managing Future Whitelist Files

For future projects, simply add the new JSON files to the /src/static directory and run the import script again. Since each project is identified by the filename (e.g., projectB.json), the import script will handle them appropriately.

Example:

	1.	Add projectC.json to /src/static.
	2.	Run the import script:

npm run import


	3.	Verify the import in MongoDB.

5. Import Script Overview

Here’s a brief overview of how the import script works:

	•	File Location: The import script reads all .json files located in /src/static.
	•	Project Identification: Each JSON file’s name (e.g., fomo.json) is used as the project identifier in the database.
	•	Data Mapping: For each entry in the JSON file:
	•	value[0] is mapped to the address field.
	•	proof array is mapped to the proof field.
	•	The filename (without extension) is mapped to the project field.
	•	Database Operation: Utilizes bulk write operations to efficiently insert or update records in MongoDB.

## Further improvements
- Split up data-aggregator & api, if api requests are growing
- Share common contract calls between data-aggregator & api
  - /contract-connectors & /api/lp/lp-data-provider have lot of overlap