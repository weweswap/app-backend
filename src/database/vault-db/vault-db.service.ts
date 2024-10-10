import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { VaultHistoricalDataDocument, VaultHistoricalDocument } from "../schemas/VaultHistoricalData.schema";
import { VaultHistoricalDataDto } from "../../shared/class/VaultHistoricalDataDto";
import { Address } from "viem";
import { HistoricTvlDatapoint } from "../../dto/HistoricTvlDto";
import { HistoricPriceDatapoint } from "../../dto/HistoricPriceDto";

@Injectable()
export class VaultDbService {
  constructor(
    @InjectModel(VaultHistoricalDocument.name) private vaultsDataModel: Model<VaultHistoricalDocument>,
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
    this.logger.debug(`Saving vault historical hourly data: ${entry.metadata.vaultAddress}`);

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

  //TODO: can be refactored into one helper method with getTvlPointsOfVaultToken
  public async getPricePointsOfToken0(
    vaultAddress: Address,
    timeFrameStartDate: Date,
  ): Promise<HistoricPriceDatapoint[]> {
    try {
      const priceData = await this.vaultsDataModel
        .aggregate([
          {
            $match: {
              "metadata.vaultAddress": vaultAddress.toLowerCase(),
              timestamp: { $gte: timeFrameStartDate },
            },
          },
          {
            $project: {
              _id: 0,
              timestamp: 1,
              token0Price: "$metadata.token0Price",
            },
          },
        ])
        .exec();

      if (priceData.length === 0) {
        this.logger.warn("Price Data is empty", this.getPricePointsOfToken0.name);
        return [];
      }

      return priceData.map(({ timestamp, token0Price }) => {
        const date = new Date(timestamp);
        const unixTimestamp = Math.floor(date.getTime() / 1000);
        return new HistoricPriceDatapoint(unixTimestamp, token0Price);
      });
    } catch (error) {
      this.logger.error("Error fetching Price points", this.getPricePointsOfToken0.name, error);
      throw error;
    }
  }

  public async getTvlPointsOfVaultToken(
    vaultAddress: Address,
    timeFrameStartDate: Date,
  ): Promise<HistoricTvlDatapoint[]> {
    try {
      const tvlData = await this.vaultsDataModel
        .aggregate([
          {
            $match: {
              "metadata.vaultAddress": vaultAddress.toLowerCase(),
              timestamp: { $gte: timeFrameStartDate },
            },
          },
          {
            $project: {
              _id: 0,
              timestamp: 1,
              tvl: "$metadata.tvlUsd",
            },
          },
        ])
        .exec();

      if (tvlData.length === 0) {
        this.logger.warn("TVL Data is empty", this.getTvlPointsOfVaultToken.name);
        return [];
      }

      return tvlData.map(({ timestamp, tvl }) => {
        const date = new Date(timestamp);
        const unixTimestamp = Math.floor(date.getTime() / 1000);
        return new HistoricTvlDatapoint(unixTimestamp, tvl);
      });
    } catch (error) {
      this.logger.error("Error fetching TVL points", this.getTvlPointsOfVaultToken.name, error);
      throw error;
    }
  }
}
