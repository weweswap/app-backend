// src/database/whitelist-db/whitelist-db.service.ts
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Whitelist, WhitelistDocument } from "../schemas/WhitelistData.schema";

type WhitelistBulkEntry = {
  address: string;
  amount: string;
  mergeProject: string;
  proof?: string[];
};

@Injectable()
export class WhitelistDbService {
  private readonly logger = new Logger(WhitelistDbService.name);

  constructor(@InjectModel(Whitelist.name) private whitelistModel: Model<WhitelistDocument>) {}

  /**
   * Retrieves whitelist information for a given project and user address.
   *
   * @param projectAddress - The address of the project (mergeProject).
   * @param userAddress - The address of the user.
   * @returns The whitelist document if found.
   * @throws NotFoundException if no matching whitelist entry is found.
   */
  public async getWhitelistInfo(projectAddress: string, userAddress: string): Promise<Whitelist> {
    this.logger.debug(`Fetching whitelist info for projectAddress: ${projectAddress}, userAddress: ${userAddress}`);

    try {
      const whitelistEntry = await this.whitelistModel
        .findOne({
          mergeProject: projectAddress.toLowerCase(),
          address: userAddress.toLowerCase(),
        })
        .exec();

      if (!whitelistEntry) {
        this.logger.warn(
          `Whitelist entry not found for projectAddress: ${projectAddress}, userAddress: ${userAddress}`,
        );
        throw new NotFoundException(`Whitelist entry not found for the provided project and user addresses.`);
      }

      this.logger.debug(`Whitelist entry found: ${JSON.stringify(whitelistEntry)}`);

      return whitelistEntry;
    } catch (error) {
      this.logger.error(
        `Error fetching whitelist info for projectAddress: ${projectAddress}, userAddress: ${userAddress}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Retrieves all whitelist entries for a specific mergeProject.
   *
   * @param mergeProject - The project name to retrieve entries for.
   * @returns An array of whitelist entries.
   */
  public async getWhitelistEntries(mergeProject: string): Promise<WhitelistBulkEntry[]> {
    this.logger.log(`Retrieving whitelist entries for mergeProject: ${mergeProject}...`);
    try {
      const entries = await this.whitelistModel.find({ mergeProject: mergeProject.toLowerCase() }).exec();

      return entries.map((entry) => ({
        address: entry.address,
        amount: entry.amount,
        mergeProject: entry.mergeProject,
        proof: entry.proof,
      }));
    } catch (error) {
      this.logger.error(
        `Error retrieving whitelist entries for mergeProject ${mergeProject}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Deletes all whitelist entries associated with a specific mergeProject.
   *
   * @param mergeProject - The project name to delete entries for.
   * @returns The result of the delete operation.
   */
  public async deleteByMergeProject(mergeProject: string): Promise<{ deletedCount?: number }> {
    this.logger.log(`Deleting existing entries for mergeProject: ${mergeProject}...`);
    try {
      const deleteResult = await this.whitelistModel.deleteMany({ mergeProject }).exec();
      this.logger.log(`Deleted ${deleteResult.deletedCount} entries for mergeProject: ${mergeProject}`);
      return { deletedCount: deleteResult.deletedCount };
    } catch (error) {
      this.logger.error(`Error deleting entries for mergeProject ${mergeProject}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Bulk upserts whitelist entries.
   *
   * @param entries - An array of whitelist entries to upsert.
   * @returns The result of the bulk write operation.
   */
  public async bulkUpsertEntries(entries: WhitelistBulkEntry[]): Promise<any> {
    this.logger.log(`Preparing bulk upsert for ${entries.length} entries...`);
    try {
      const bulkOps = entries.map((entry) => ({
        updateOne: {
          filter: {
            address: entry.address.toLowerCase(),
            mergeProject: entry.mergeProject.toLowerCase(),
          },
          update: { $set: entry },
          upsert: true,
        },
      }));

      const bulkWriteResult = await this.whitelistModel.bulkWrite(bulkOps, { ordered: false });
      this.logger.log(
        `Bulk upsert completed. Inserted: ${bulkWriteResult.upsertedCount}, Modified: ${bulkWriteResult.modifiedCount}`,
      );
      return bulkWriteResult;
    } catch (error) {
      this.logger.error(`Error during bulk upsert: ${error.message}`, error.stack);
      throw error;
    }
  }
}
