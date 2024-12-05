import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
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

  private readonly MAX_RETRIES = 5;
  private readonly BASE_DELAY_MS = 1000; // 1 second

  constructor(
    private readonly evmConnector: EvmConnectorService,
    private readonly whitelistDbService: WhitelistDbService,
    private readonly importService: ImportService,
    private progressMetadataDb: ProgressMetadataDbService,
  ) {}

  /**
   * Takes a snapshot by synchronizing all Transfer events up to the specified block height
   * and computing the balances of all token holders.
   *
   * @param address - The token contract address.
   * @param blockHeight - The block height at which to take the snapshot.
   * @returns An array of holder addresses and their balances.
   *
   * @throws {BadRequestException} If the provided address is invalid.
   * @throws {InternalServerErrorException} If any internal process fails.
   */
  public async takeSnapshot(address: Address, blockHeight: number): Promise<{ address: string; balance: string }[]> {
    this.logger.log(`Initiating snapshot for address ${address} at block height ${blockHeight}`);

    try {
      // Retrieve the last processed block
      const lastProcessedBlock = await this.progressMetadataDb.getLastBlockNumber(
        address.toLowerCase() as Address,
        AggregationType.TOKEN_HOLDER_SNAPSHOT,
      );
      const fromBlock = lastProcessedBlock !== undefined ? BigInt(lastProcessedBlock) + 1n : 0n;

      // Synchronize Transfer events and compute balances
      const holders = await this.syncAllTransferEvents(address, fromBlock, BigInt(blockHeight));

      // Save the computed holders to the whitelist database
      await this.saveHoldersToWhitelist(address.toLowerCase(), holders);

      // Update the last processed block in the metadata database
      await this.progressMetadataDb.saveProgressMetadata(
        new ProgressMetadataDto(address.toLowerCase(), blockHeight, AggregationType.TOKEN_HOLDER_SNAPSHOT),
      );

      this.logger.log(`Snapshot successfully saved for token ${address} at block ${blockHeight}.`);
      this.logger.log(`Total token holders: ${holders.length}`);
      return holders;
    } catch (error) {
      this.logger.error(`Error taking snapshot for address ${address}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to take snapshot.");
    }
  }

  /**
   * Synchronizes all Transfer events from a starting block up to the specified block number and computes balances.
   *
   * @param address - The token contract address.
   * @param fromBlock - The starting block number.
   * @param blocknumber - The target block number for the snapshot.
   * @returns An array of holder addresses and their balances.
   *
   * @throws {InternalServerErrorException} If fetching logs fails after maximum retries.
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
      throw new InternalServerErrorException("Failed to fetch existing holders.");
    }
    if (fromBlock > blocknumber) {
      this.logger.log(`No new blocks to process for token ${address} since last snapshot.`);
      const holders = Object.entries(balances)
        .filter(([, balance]) => balance > 0)
        .map(([address, balance]) => ({ address: address.toLowerCase(), balance: balance.toString() }));
      return holders;
    }

    let lowestFromBlock: bigint = fromBlock;
    const maxBlockRange = BigInt(LOGS_MAX_BLOCK_RANGE);
    let toBlock = lowestFromBlock + maxBlockRange < blocknumber ? lowestFromBlock + maxBlockRange : blocknumber;

    // Loop through block ranges and fetch logs
    while (lowestFromBlock < blocknumber && toBlock <= blocknumber) {
      this.logger.log(`Fetching events from ${lowestFromBlock} to ${toBlock}. Recent block: ${blocknumber}`);
      let attempt = 0;
      let success = false;
      let logs: SingleLogEvent[] = [];

      while (attempt < this.MAX_RETRIES && !success) {
        try {
          logs = (
            await this.evmConnector.client.getLogs({
              events: [TransferAbiEvent],
              fromBlock: lowestFromBlock,
              toBlock: toBlock,
              address: address,
              strict: true,
            })
          ).sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));

          this.logger.log(`Fetched ${logs.length} Transfer events from block ${lowestFromBlock} to ${toBlock}`);
          success = true;
        } catch (error) {
          attempt++;
          this.logger.warn(
            `Attempt ${attempt} failed to fetch logs from ${lowestFromBlock} to ${toBlock}: ${error.message}`,
          );

          if (attempt < this.MAX_RETRIES) {
            const delayTime = this.BASE_DELAY_MS * 2 ** (attempt - 1); // Exponential backoff
            this.logger.log(`Retrying in ${delayTime} ms...`);
            await this.delay(delayTime);
          } else {
            this.logger.error(
              `Failed to fetch logs after ${this.MAX_RETRIES} attempts for blocks ${lowestFromBlock} to ${toBlock}`,
              error.stack,
            );
            throw new Error(`Failed to fetch logs for blocks ${lowestFromBlock} to ${toBlock}: ${error.message}`);
          }
        }
      }

      // Process the fetched logs and update balances
      await this.processLogs(logs, balances);

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

    this.logger.log(`Total holders after synchronization: ${holders.length}`);
    return holders;
  }

  /**
   * Processes a batch of Transfer event logs and updates the balances accordingly.
   *
   * @param logs - The array of Transfer event logs.
   * @param balances - The balances object to be updated.
   *
   * @throws {InternalServerErrorException} If parsing logs fails.
   */
  private async processLogs(logs: SingleLogEvent[], balances: { [address: string]: bigint }): Promise<void> {
    if (logs.length === 0) {
      return;
    }

    let parsedLogs: any[];
    try {
      parsedLogs = parseEventLogs({
        abi: erc20Abi,
        logs: logs,
        eventName: TransferAbiEvent.name,
      });
    } catch (error) {
      this.logger.error(`Error parsing event logs: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to parse event logs.");
    }

    for (const parsedLog of parsedLogs) {
      try {
        const { from, to, value } = parsedLog.args;

        // Update the balance of the 'from' address
        if (from !== "0x0000000000000000000000000000000000000000") {
          const fromAddress = from.toLowerCase();
          if (balances[fromAddress]) {
            balances[fromAddress] -= BigInt(value);
          } else {
            balances[fromAddress] = 0n - BigInt(value);
          }

          // Remove address if balance drops to zero
          if (balances[fromAddress] === 0n) {
            delete balances[fromAddress];
          }
        }

        // Update the balance of the 'to' address
        if (to !== "0x0000000000000000000000000000000000000000") {
          const toAddress = to.toLowerCase();
          if (balances[toAddress]) {
            balances[toAddress] += BigInt(value);
          } else {
            balances[toAddress] = BigInt(value);
          }
        }
      } catch (error) {
        this.logger.error(`Error parsing log: ${error.message}. Log data: ${JSON.stringify(parsedLog)}`);
      }
    }
  }

  /**
   * Saves the computed holders to the whitelist database.
   *
   * @param mergeProjectAddress - The address of the merge project.
   * @param holders - The array of holder addresses and their balances.
   *
   * @throws {InternalServerErrorException} If bulk upsert fails.
   */
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
      throw new InternalServerErrorException("Failed to save holders to whitelist.");
    }
  }

  /**
   * Generates a Merkle Root for a specific merge project based on the provided holders.
   *
   * @param mergeProjectAddress - The address of the merge project.
   * @param holders - The array of holder addresses and their balances.
   * @returns The generated Merkle root hash.
   *
   * @throws {InternalServerErrorException} If processing holders fails.
   */
  public async generateMerkleRoot(
    mergeProjectAddress: string,
    holders: { address: string; balance: string }[],
  ): Promise<string> {
    if (holders.length === 0) {
      this.logger.warn("No holders provided for Merkle Root generation.");
      return "";
    }

    try {
      this.logger.log(`Generating Merkle Root for merge project: ${mergeProjectAddress}`);
      const merkleRoot = await this.importService.processHolders(
        holders.map((holder) => [holder.address, holder.balance] as [string, string]),
        mergeProjectAddress,
      );
      this.logger.log(`Merkle Root generated: ${merkleRoot}`);
      return merkleRoot;
    } catch (error) {
      this.logger.error(`Error generating Merkle Root: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to generate Merkle Root.");
    }
  }

  /**
   * Introduces a delay for a specified duration.
   *
   * @param ms - The number of milliseconds to delay.
   * @returns A promise that resolves after the specified delay.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
