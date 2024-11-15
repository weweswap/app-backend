import { Injectable, Logger } from "@nestjs/common";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { LOGS_MAX_BLOCK_RANGE } from "../../shared/constants";
import { SingleLogEvent, TransferAbiEvent } from "../../shared/models/Types";
import { Address, parseEventLogs } from "viem";
import { erc20Abi } from "../../abis/abi";
import { WhitelistDbService } from "../../database/whitelist-db/whitelist-db.service";
import { ImportService } from "./importWhitelist.service";
import { ProgressMetadataDbService } from "../../database/progress-metadata/progress-metadata-db.service";
import { AggregationType } from "../../shared/enum/AggregationType";
import { ProgressMetadataDto } from "../../database/db-models";

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(
    private readonly evmConnector: EvmConnectorService,
    private readonly whitelistDbService: WhitelistDbService,
    private readonly importService: ImportService,
    private progressMetadataDb: ProgressMetadataDbService,
  ) {}
  /**
   * Takes a snapshot by synchronizing all Transfer events up to the specified block height
   * and computing the balances of all token holders.
   * @param blockHeight The block height at which to take the snapshot.
   */
  public async takeSnapshot(address: Address, blockHeight: number): Promise<string> {
    try {
      this.logger.log(`Starting snapshot at block ${blockHeight}`);

      // Retrieve the last processed block
      const lastProcessedBlock = await this.progressMetadataDb.getLastBlockNumber(
        address.toLowerCase() as Address,
        AggregationType.TOKEN_HOLDER_SNAPSHOT,
      );
      const fromBlock = lastProcessedBlock !== undefined ? BigInt(lastProcessedBlock) + 1n : 22309301n;

      if (fromBlock > BigInt(blockHeight)) {
        this.logger.log(`No new blocks to process for token ${address} since last snapshot.`);
        return "";
      }

      // Synchronize Transfer events and compute balances
      const holders = await this.syncAllTransferEvents(address, fromBlock, BigInt(blockHeight));

      this.logger.log(`Computed ${holders.length} token holders.`);

      // Generate Merkle Tree, proofs, and bulk upsert to whitelist DB
      const merkleRoot = await this.importService.processHolders(
        holders.map((holder) => [holder.address, holder.balance] as [string, string]),
        address.toLowerCase(),
      );

      // Update the last processed block
      await this.progressMetadataDb.saveProgressMetadata(
        new ProgressMetadataDto(address.toLowerCase(), blockHeight, AggregationType.TOKEN_HOLDER_SNAPSHOT),
      );

      this.logger.log(`Snapshot at block ${blockHeight} saved successfully.`);
      this.logger.log(`Generated Merkle Root: ${merkleRoot}`);

      return merkleRoot;
    } catch (error) {
      this.logger.error(`Error taking snapshot: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Synchronizes all Transfer events from a starting block up to the specified block number and computes balances.
   * @param address - The token contract address.
   * @param fromBlock - The starting block number.
   * @param blocknumber - The target block number for the snapshot.
   * @returns An array of holder addresses and their balances.
   */
  private async syncAllTransferEvents(
    address: Address,
    fromBlock: bigint,
    blocknumber: bigint,
  ): Promise<{ address: string; balance: string }[]> {
    const balances: { [address: string]: bigint } = {};

    // Fetch existing balances from the database
    this.logger.log(`Fetching existing balances from database for mergeProject: ${address.toLowerCase()}...`);
    try {
      const existingHolders = await this.whitelistDbService.getAllHoldersForMergeProject(address.toLowerCase());
      existingHolders.forEach((holder) => {
        balances[holder.address.toLowerCase()] = BigInt(holder.amount);
      });
      this.logger.log(`Fetched ${existingHolders.length} existing holders from database.`);
    } catch (error) {
      this.logger.error(`Error fetching existing holders from database: ${error.message}`, error.stack);
      throw error;
    }
    this.logger.debug(`Initialized balances: ${JSON.stringify(balances)}`);

    let lowestFromBlock: bigint = fromBlock;
    const maxBlockRange = BigInt(LOGS_MAX_BLOCK_RANGE);
    let toBlock = lowestFromBlock + maxBlockRange < blocknumber ? lowestFromBlock + maxBlockRange : blocknumber;

    // Loop through block ranges and fetch logs
    while (lowestFromBlock < blocknumber && toBlock <= blocknumber) {
      this.logger.log(`Fetching events from ${lowestFromBlock} to ${toBlock}. Recent block: ${blocknumber}`);

      try {
        const logs = (
          await this.evmConnector.client.getLogs({
            events: [TransferAbiEvent],
            fromBlock: lowestFromBlock,
            toBlock: toBlock,
            address: address,
            strict: true,
          })
        ).sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));
        this.logger.log(`Fetched ${logs.length} Transfer events from block ${lowestFromBlock} to ${toBlock}`);

        // Process the fetched logs and update balances
        await this.processLogs(logs, balances);
      } catch (error) {
        this.logger.error(`Error fetching logs from ${lowestFromBlock} to ${toBlock}: ${error.message}`, error.stack);
      }
      // check if we've finished
      if (toBlock == blocknumber) {
        break;
      }

      // Update block range for the next iteration
      lowestFromBlock = toBlock + 1n;
      toBlock = lowestFromBlock + maxBlockRange < blocknumber ? lowestFromBlock + maxBlockRange : blocknumber;
    }
    // After processing all logs, filter out holders with a positive balance
    const holders = Object.entries(balances)
      .filter(([, balance]) => balance > 0)
      .map(([address, balance]) => ({ address: address.toLowerCase(), balance: balance.toString() }));

    return holders;
  }

  /**
   * Processes a batch of Transfer event logs and updates the balances accordingly.
   * @param logs The array of Transfer event logs.
   * @param balances The balances object to be updated.
   */
  private async processLogs(logs: SingleLogEvent[], balances: { [address: string]: bigint }): Promise<void> {
    if (logs.length === 0) {
      return;
    }

    const parsedLogs = parseEventLogs({ abi: erc20Abi, logs: logs, eventName: TransferAbiEvent.name });
    for (const parsedLog of parsedLogs) {
      try {
        const { from, to, value } = parsedLog.args;

        // Update the balance of the 'from' address
        if (from !== "0x0000000000000000000000000000000000000000") {
          if (balances[from]) {
            balances[from] -= BigInt(value);
          } else {
            balances[from] = 0n - BigInt(value);
          }

          // Remove address if balance drops to zero
          if (balances[from] === 0n) {
            delete balances[from];
          }
        }

        // Update the balance of the 'to' address
        if (to !== "0x0000000000000000000000000000000000000000") {
          if (balances[to]) {
            balances[to] += BigInt(value);
          } else {
            balances[to] = BigInt(value);
          }
        }
      } catch (error) {
        this.logger.error(`Error parsing log: ${error.message}. Log data: ${JSON.stringify(parsedLog)}`);
        // Optionally, continue processing other logs or handle specific cases
      }
    }
  }

  private async saveHoldersToWhitelist(
    mergeProjectAddress: string,
    holders: { address: string; balance: string }[],
  ): Promise<void> {
    if (holders.length === 0) {
      this.logger.warn("No holders to save to the whitelist.");
      return;
    }

    // Transform holders into WhitelistBulkEntry objects
    const whitelistEntries = holders.map((holder) => ({
      address: holder.address.toLowerCase(),
      amount: holder.balance,
      mergeProject: mergeProjectAddress.toLowerCase(),
    }));

    try {
      this.logger.log(`Bulk upserting ${whitelistEntries.length} whitelist entries...`);
      const bulkWriteResult = await this.whitelistDbService.bulkUpsertEntries(whitelistEntries);
      this.logger.log(
        `Bulk upsert completed. Inserted: ${bulkWriteResult.upsertedCount}, Modified: ${bulkWriteResult.modifiedCount}`,
      );
    } catch (error) {
      this.logger.error(`Error during bulk upsert to whitelist: ${error.message}`, error.stack);
      throw error;
    }
  }
}
