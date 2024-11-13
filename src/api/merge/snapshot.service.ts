import { Injectable, Logger } from "@nestjs/common";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { LOGS_MAX_BLOCK_RANGE } from "../../shared/constants";
import { SingleLogEvent, TransferAbiEvent } from "../../shared/models/Types";
import { Address, parseEventLogs } from "viem";
import { erc20Abi } from "../../abis/abi";
import { WhitelistDbService } from "../../database/whitelist-db/whitelist-db.service";

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(
    private evmConnector: EvmConnectorService,
    private readonly whitelistDbService: WhitelistDbService,
  ) {}
  /**
   * Takes a snapshot by synchronizing all Transfer events up to the specified block height
   * and computing the balances of all token holders.
   * @param blockHeight The block height at which to take the snapshot.
   */
  public async takeSnapshot(address: Address, blockHeight: number): Promise<void> {
    try {
      this.logger.log(`Starting snapshot at block ${blockHeight}`);

      // Synchronize Transfer events and compute balances
      const holders = await this.syncAllTransferEvents(address, BigInt(blockHeight));

      // Save the holders to the whitelist database
      await this.saveHoldersToWhitelist(address, holders);

      this.logger.log(`Computed ${holders.length} token holders.`);

      this.logger.log(`Snapshot at block ${blockHeight} saved successfully.`);
    } catch (error) {
      this.logger.error(`Error taking snapshot: ${error.message}`, error.stack);
    }
  }

  /**
   * Synchronizes all Transfer events up to the specified block number and computes balances.
   * @param blocknumber The target block number for the snapshot.
   * @returns An array of holder addresses and their balances.
   */
  private async syncAllTransferEvents(
    address: Address,
    blocknumber: bigint,
  ): Promise<{ address: string; balance: string }[]> {
    const balances: { [address: string]: bigint } = {};

    let lowestFromBlock: bigint = 22305715n; //12299790n;

    let toBlock =
      lowestFromBlock + LOGS_MAX_BLOCK_RANGE < blocknumber ? lowestFromBlock + LOGS_MAX_BLOCK_RANGE : blocknumber;

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
      toBlock =
        lowestFromBlock + LOGS_MAX_BLOCK_RANGE < blocknumber ? lowestFromBlock + LOGS_MAX_BLOCK_RANGE : blocknumber;
    }
    // After processing all logs, filter out holders with a positive balance
    const holders = Object.entries(balances)
      .filter(([, balance]) => balance > 0)
      .map(([address, balance]) => ({ address, balance: balance.toString() }));

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
        }

        // Update the balance of the 'to' address
        if (to !== "0x0000000000000000000000000000000000000000") {
          if (balances[to]) {
            balances[to] += BigInt(value);
          } else {
            balances[to] = BigInt(value);
          }
        }
        console.log(balances);
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
