import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { RewardsConvertedToUsdcEventDocument } from "../schemas/RewardsConvertedToUsdcEvent.schema";
import { RewardsConvertedToUsdcEventDto } from "../db-models";

@Injectable()
export class RewardsConvertedToUsdcDbService {
  constructor(
    @InjectModel(RewardsConvertedToUsdcEventDocument.name)
    private rewardsConvertedToUsdcEventModel: Model<RewardsConvertedToUsdcEventDocument>,
    private readonly logger: Logger,
  ) {}

  public async saveRewardsInUsdcEvent(value: RewardsConvertedToUsdcEventDto): Promise<boolean> {
    this.logger.debug(`Saving rewards in USDC event: ${value._id}`);

    try {
      const result = new this.rewardsConvertedToUsdcEventModel(value);

      return !!(await result.save());
    } catch (e) {
      // Check if the error is a duplicate key error (11000 is the MongoDB error code for duplicate key error)
      if (e.code === 11000) {
        this.logger.warn("Duplicate key error. Ignoring.");
        return true;
      } else {
        this.logger.error(`Failed to save  rewards in USDC event.. Error: ${JSON.stringify(e, null, 2)}`);

        // Re-throw the error if it's not a duplicate key error
        throw e;
      }
    }
  }

  /**
   * Calculates the sum of rewards in USDC in a given Arrakis (lp management) vault within a specified time range.
   *
   * @param {Address} arrakisVaultAddress - The address of the Arrakis vault.
   * @param {number} startTimestamp - The start timestamp (in milliseconds) of the period for which to sum fees.
   * @param {number} endTimestamp - The end timestamp (in milliseconds) of the period for which to sum fees.
   * @returns {Promise<bigint | null>} The sum of fees collected in USDC, or null if no fees were collected.
   */
  public async getRewardsInUsdcSum(
    arrakisVaultAddress: string,
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<bigint | null> {
    const startDate = new Date(startTimestamp);
    const endDate = new Date(endTimestamp);

    const matchStage = {
      $match: {
        "metadata.vaultAddress": arrakisVaultAddress.toLowerCase(),
        timestamp: { $gte: startDate, $lte: endDate },
      },
    };

    // using toDecimal for summing up
    const groupStage = {
      $group: {
        _id: null,
        totalFeeInUsdc: { $sum: { $toDecimal: "$metadata.feeInUsdc" } },
      },
    };

    const result = await this.rewardsConvertedToUsdcEventModel.aggregate([matchStage, groupStage]).exec();

    if (result.length > 0) {
      // Convert the decimal results to string
      const totalFeeInUsdcString = result[0].totalFeeInUsdc.toString();

      // Convert string representations of decimal numbers to bigint.
      return BigInt(totalFeeInUsdcString.split(".")[0]);
    } else {
      return null;
    }
  }

  public async checkIfEntryExists(eventId: string): Promise<boolean> {
    try {
      const exists = await this.rewardsConvertedToUsdcEventModel.exists({ _id: eventId.toLowerCase() });
      return !!exists;
    } catch (error) {
      this.logger.error(`Error checking if entry exists for ID ${eventId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
