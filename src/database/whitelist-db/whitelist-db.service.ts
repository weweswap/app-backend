import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Whitelist, WhitelistDocument } from "../schemas/WhitelistData.schema";

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
}
