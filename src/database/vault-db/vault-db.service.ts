import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CollectVaultFeeEventDocument } from "../schemas/CollectedVaultFeeEvent.schema";
import { CollectedVaultFeeEventDto } from "../db-models";
import { VaultFees } from "../../shared/types/common";
import { VaultHistoricalDataDocument, VaultHistoricalDocument } from "../schemas/VaultHistoricalData.schema";
import { VaultHistoricalDataDto } from "../../shared/class/VaultHistoricalDataDto";

@Injectable()
export class VaultDbService {
  constructor(
    @InjectModel(VaultHistoricalDocument.name) private vaultsDataModel: Model<VaultHistoricalDocument>,
    @InjectModel(CollectVaultFeeEventDocument.name)
    private collectVaultFeeEventModel: Model<CollectVaultFeeEventDocument>,
    private readonly logger: Logger,
  ) {}

  public async getMostRecentVaultsDataTimestamp(vaultAddress: string): Promise<number | undefined> {
    const vaultHistoricalData: VaultHistoricalDataDocument[] | undefined = await this.vaultsDataModel
      .find({
        "metadata.vaultAddress": vaultAddress.toLowerCase(),
      })
      .sort({
        timestamp: -1,
      })
      .limit(1)
      .exec();

    if (vaultHistoricalData && vaultHistoricalData.length > 0) {
      return vaultHistoricalData[0].timestamp.getTime();
    } else {
      return undefined;
    }
  }

  public async getMostRecentCollectedFeeBlockNumber(vaultAddress: string): Promise<bigint | undefined> {
    const vaultHistoricalData: CollectVaultFeeEventDocument[] | undefined = await this.collectVaultFeeEventModel
      .find({
        "metadata.vaultAddress": vaultAddress.toLowerCase(),
      })
      .sort({
        timestamp: -1,
      })
      .limit(1)
      .exec();

    if (vaultHistoricalData && vaultHistoricalData.length > 0) {
      return BigInt(vaultHistoricalData[0].metadata.blockNumber);
    } else {
      return undefined;
    }
  }

  public async saveCollectedFeeEvent(value: CollectedVaultFeeEventDto): Promise<boolean> {
    this.logger.debug(`Saving collected fee event: ${value._id}`);

    try {
      const result = new this.collectVaultFeeEventModel(value);

      return !!(await result.save());
    } catch (e) {
      // Check if the error is a duplicate key error (11000 is the MongoDB error code for duplicate key error)
      if (e.code === 11000) {
        this.logger.warn("Duplicate key error. Ignoring.");
        return true;
      } else {
        this.logger.error(`Failed to save vault collected fee event.. Error: ${JSON.stringify(e, null, 2)}`);

        // Re-throw the error if it's not a duplicate key error
        throw e;
      }
    }
  }

  /**
   * Calculates the sum of fees collected in a given Arrakis (lp management) vault within a specified time range.
   *
   * @param {Address} arrakisVaultAddress - The address of the Arrakis vault.
   * @param {number} startTimestamp - The start timestamp (in milliseconds) of the period for which to sum fees.
   * @param {number} endTimestamp - The end timestamp (in milliseconds) of the period for which to sum fees.
   * @returns {Promise<VaultFees | null>} The sum of fees collected as `VaultFees` object, or null if no fees were collected.
   */
  public async getCollectedFeeSum(
    arrakisVaultAddress: string,
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<VaultFees | null> {
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
        totalFee0: { $sum: { $toDecimal: "$metadata.fee0" } },
        totalFee1: { $sum: { $toDecimal: "$metadata.fee1" } },
      },
    };

    const result = await this.collectVaultFeeEventModel.aggregate([matchStage, groupStage]).exec();

    if (result.length > 0) {
      // Convert the decimal results to string
      const totalFee0String = result[0].totalFee0.toString();
      const totalFee1String = result[0].totalFee1.toString();

      // Convert string representations of decimal numbers to bigint.
      const totalFee0BigInt = BigInt(totalFee0String.split(".")[0]);
      const totalFee1BigInt = BigInt(totalFee1String.split(".")[0]);

      return {
        fee0: totalFee0BigInt,
        fee1: totalFee1BigInt,
      };
    } else {
      return null;
    }
  }

  /**
   * Calculates the average Total Value Locked (TVL) in an Arrakis (lp management) vault within a specified time range.
   *
   * @param {Address} vaultAddress - The address of the Arrakis (lp management) vault.
   * @param {number} startTimestamp - The start timestamp (in milliseconds) of the period for which to calculate the average TVL.
   * @param {number} endTimestamp - The end timestamp (in milliseconds) of the period for which to calculate the average TVL.
   * @returns {Promise<number>} The average TVL as a number.
   */
  public async getAverageTvl(vaultAddress: string, startTimestamp: number, endTimestamp: number): Promise<number> {
    const startDate = new Date(startTimestamp);
    const endDate = new Date(endTimestamp);

    const pipeline = [
      {
        $match: {
          "metadata.vaultAddress": vaultAddress.toLowerCase(),
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalTvl: { $avg: "$metadata.tvlUsd" },
        },
      },
    ];

    const result = await this.vaultsDataModel.aggregate(pipeline).exec();

    if (result.length > 0) {
      return result[0].totalTvl;
    } else {
      return 0;
    }
  }

  public async saveVaultData(entry: VaultHistoricalDataDto): Promise<boolean> {
    this.logger.debug(`Saving vault historical daily data: ${entry.metadata.vaultAddress}`);

    try {
      const createdVaultHistoricalData = new this.vaultsDataModel(entry);

      return !!(await createdVaultHistoricalData.save());
    } catch (e) {
      // Check if the error is a duplicate key error (11000 is the MongoDB error code for duplicate key error)
      if (e.code === 11000) {
        this.logger.warn("Duplicate key error. Ignoring.");
        return true;
      } else {
        this.logger.error(`Failed to save vault historical operation.. Error: ${JSON.stringify(e, null, 2)}`);

        // Re-throw the error if it's not a duplicate key error
        throw e;
      }
    }
  }
}
