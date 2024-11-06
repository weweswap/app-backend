import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as fs from "fs";
import * as path from "path";
import { Whitelist, WhitelistDocument } from "./schemas/WhitelistData.schema";

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(@InjectModel(Whitelist.name) private whitelistModel: Model<WhitelistDocument>) {}

  /**
   * Imports data from a single JSON file.
   * @param filename - The name of the JSON file to import.
   */
  async importDataFromFile(filename: string): Promise<void> {
    const filePath = path.join(__dirname, "..", "static", filename);
    this.logger.log(`Reading data from ${filePath}...`);

    if (!fs.existsSync(filePath)) {
      this.logger.error(`File not found: ${filePath}`);
      throw new Error(`File not found: ${filePath}`);
    }

    const rawData = fs.readFileSync(filePath, "utf-8");
    let data: { value: [string, string]; proof: string[] }[];

    try {
      data = JSON.parse(rawData);
    } catch (error) {
      this.logger.error(`Error parsing JSON from file ${filename}:`, error);
      throw new Error(`Error parsing JSON from file ${filename}`);
    }

    this.logger.log(`Starting import of ${data.length} records from ${filename}...`);

    const projectName = path.parse(filename).name;

    const bulkOps = data.map((item) => ({
      updateOne: {
        filter: {
          address: item.value[0].toLowerCase(),
          amount: item.value[1],
          mergeProject: projectName.toLowerCase(),
        },
        update: { $set: { proof: item.proof, amount: item.value[1], mergeProject: projectName.toLowerCase() } },
        upsert: true,
      },
    }));

    try {
      const result = await this.whitelistModel.bulkWrite(bulkOps, { ordered: false });
      this.logger.log(
        `Import from ${filename} completed. Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
      );
    } catch (error) {
      this.logger.error(`Error during import from ${filename}:`, error);
    }
  }

  /**
   * Imports data from all JSON files in the data directory.
   */
  async importAllData(): Promise<void> {
    const dataDir = path.join(__dirname, "..", "static");
    this.logger.log(`Reading data directory: ${dataDir}`);

    if (!fs.existsSync(dataDir)) {
      this.logger.error(`Data directory not found: ${dataDir}`);
      throw new Error(`Data directory not found: ${dataDir}`);
    }

    const files = fs.readdirSync(dataDir).filter((file) => file.endsWith(".json"));

    if (files.length === 0) {
      this.logger.warn(`No JSON files found in directory: ${dataDir}`);
      return;
    }

    for (const file of files) {
      await this.importDataFromFile(file);
    }

    this.logger.log("All data imports completed.");
  }
}
