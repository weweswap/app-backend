import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { HistoricPriceDatapoint } from "../../dto/HistoricPriceDto";
import { PriceHistoricalDataDocument, PriceHistoricalDocument } from "../schemas/PriceHistoricalData.schema";
import { PriceHistoricalDataDto } from "../../shared/class/PriceHistoricalDataDto";

@Injectable()
export class PriceDbService {
  constructor(
    @InjectModel(PriceHistoricalDocument.name) private priceDataModel: Model<PriceHistoricalDocument>,
    private readonly logger: Logger,
  ) {}

  public async getMostRecentPriceDataTimestamp(coinId: string): Promise<number | undefined> {
    const priceHistoricalData: PriceHistoricalDataDocument[] | undefined = await this.priceDataModel
      .find({
        "metadata.coinId": coinId.toLowerCase(),
      })
      .sort({
        timestamp: -1,
      })
      .limit(1)
      .exec();

    if (priceHistoricalData && priceHistoricalData.length > 0) {
      return priceHistoricalData[0].timestamp.getTime();
    } else {
      return undefined;
    }
  }

  public async savePriceData(entry: PriceHistoricalDataDto): Promise<boolean> {
    this.logger.debug(`Saving price historical hourly data: ${entry.metadata.coinId}`);

    try {
      const createdPriceHistoricalData = new this.priceDataModel(entry);

      return !!(await createdPriceHistoricalData.save());
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

  public async getPricePointsOfToken(coinId: string, timeFrameStartDate: Date): Promise<HistoricPriceDatapoint[]> {
    try {
      const priceData = await this.priceDataModel
        .aggregate([
          {
            $match: {
              "metadata.coinId": coinId.toLowerCase(),
              timestamp: { $gte: timeFrameStartDate },
            },
          },
          {
            $project: {
              _id: 0,
              timestamp: 1,
              price: "$metadata.price",
            },
          },
        ])
        .exec();

      if (priceData.length === 0) {
        this.logger.warn("Price Data is empty", this.getPricePointsOfToken.name);
        return [];
      }

      return priceData.map(({ timestamp, price }) => {
        const date = new Date(timestamp);
        const unixTimestamp = Math.floor(date.getTime() / 1000);
        return new HistoricPriceDatapoint(unixTimestamp, price);
      });
    } catch (error) {
      this.logger.error("Error fetching Price points", this.getPricePointsOfToken.name, error);
      throw error;
    }
  }
}
