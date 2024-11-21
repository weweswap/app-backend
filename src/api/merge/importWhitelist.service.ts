import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import { isAddress, parseUnits } from "viem"; // Updated import
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { WhitelistDbService } from "../../database/whitelist-db/whitelist-db.service";

type WhitelistEntry = [address: string, amount: string];
type WhitelistBulkEntry = {
  address: string;
  amount: string;
  mergeProject: string;
  proof?: string[];
};

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private readonly whitelistDbService: WhitelistDbService) {}

  /**
   * Processes a CSV file, generates Merkle proofs, and stores data into MongoDB.
   * @param csvPath - The path to the CSV file.
   * @param mergeProject - The project name derived from the filename.
   * @param decimals - The number of decimals to use for amount conversion.
   * @returns The Merkle root hash.
   */
  async processCsv(csvPath: string, mergeProject: string, decimals: number = 18): Promise<string> {
    this.logger.log(`Starting CSV processing for file: ${csvPath}`);

    // Parse CSV
    const whitelist = this.parseCsv(csvPath, decimals);

    this.logger.log(`Parsed ${whitelist.length} valid whitelist entries.`);

    // Process holders: generate Merkle Tree, proofs, bulk upsert
    const merkleRoot = await this.processHolders(whitelist, mergeProject);

    // Delete the CSV file after processing
    fs.unlink(csvPath, (err) => {
      if (err) {
        this.logger.warn(`Failed to delete file ${csvPath}: ${err.message}`);
      } else {
        this.logger.log(`Deleted file ${csvPath}`);
      }
    });

    this.logger.log(`CSV processing completed for file: ${csvPath}`);
    return merkleRoot;
  }

  /**
   * Parses a CSV file into an array of WhitelistEntry.
   * @param csvPath - The path to the CSV file.
   * @param decimals - The number of decimals to use for amount conversion.
   * @returns An array of [address, amount] tuples.
   */
  private parseCsv(csvPath: string, decimals: number): WhitelistEntry[] {
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n").filter(Boolean);

    // Remove header if present
    if (lines[0].includes("HolderAddress")) {
      lines.shift();
    }

    const whitelist: WhitelistEntry[] = [];

    this.logger.log(`Parsing CSV lines...`);

    for (let i = 0; i < lines.length; i++) {
      try {
        const row = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
        if (!row || row.length < 2) {
          this.logger.warn(`Invalid row format at line ${i + 2}: ${lines[i]}`);
          continue;
        }

        const address = row[0].replace(/"/g, "").toLowerCase();

        // Validate Ethereum address
        if (!isAddress(address)) {
          this.logger.warn(`Invalid address at line ${i + 2}: ${address}`);
          continue;
        }

        const amount = row[1].replace(/,/g, "").replace(/"/g, "");

        if (!amount || Number.isNaN(Number(amount))) {
          this.logger.warn(`Invalid amount at line ${i + 2}: ${amount}`);
          continue;
        }

        //TODO: use ERC20 service for decimals
        // Parse amount to wei using viem's parseUnits
        const amountAsBigInt = BigInt(parseUnits(amount, decimals));

        // Example condition: adjust as per your logic
        if (amountAsBigInt > BigInt(parseUnits("140", decimals))) {
          whitelist.push([address, amountAsBigInt.toString()]);
        }
      } catch (error) {
        this.logger.error(`Error processing line ${i + 2}: ${error.message}`);
      }
    }

    return whitelist;
  }

  /**
   * Processes a list of holders, generates Merkle Tree and proofs, and updates the whitelist DB.
   * @param holders - Array of holder addresses and balances.
   * @param mergeProject - The project identifier.
   * @param decimals - The number of decimals to use for amount conversion.
   * @returns The Merkle root hash.
   */
  async processHolders(holders: WhitelistEntry[], mergeProject: string): Promise<string> {
    if (holders.length === 0) {
      this.logger.warn("No holders to process.");
      return "";
    }

    // Generate Merkle Tree
    let merkleTree: StandardMerkleTree<WhitelistEntry>;
    let rootHash: string;
    try {
      merkleTree = StandardMerkleTree.of(holders, ["address", "uint256"]);
      rootHash = merkleTree.root;
      this.logger.log(`Generated Merkle Root: ${rootHash}`);
    } catch (error) {
      this.logger.error(`Error generating Merkle Tree: ${error.message}`);
      throw error;
    }

    // Prepare data with proofs
    const dataWithProofs: WhitelistBulkEntry[] = holders.map(([address, amount], index) => {
      const proof = merkleTree.getProof(index);
      return {
        address,
        amount,
        mergeProject,
        proof,
      };
    });

    // Bulk upsert using WhitelistDbService
    this.logger.log(`Bulk upserting ${dataWithProofs.length} entries into MongoDB...`);
    try {
      const bulkWriteResult = await this.whitelistDbService.bulkUpsertEntries(dataWithProofs);
      this.logger.log(
        `Bulk upsert completed. Inserted: ${bulkWriteResult.upsertedCount}, Modified: ${bulkWriteResult.modifiedCount}`,
      );
    } catch (error) {
      this.logger.error(`Error during bulk upsert: ${error.message}`);
      throw error;
    }

    return rootHash;
  }
}
