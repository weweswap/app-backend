import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { MergeChartDatapoint } from "../../dto/MergeChartDto";
import { PriceDbService } from "../../database/price-db/price-db.service";
import { WEWE_COINGECKO_NAME } from "../../shared/constants";
import { getStartDateFromNow } from "../../utils/utils";
import { TimeFrame } from "../../dto/HistoricDataQueryParamsDto";
import { WeweConfigService } from "../../config/wewe-data-aggregator-config.service";

@Injectable()
export class MergeService {
  private readonly logger = new Logger(MergeService.name);

  constructor(
    private readonly priceDbService: PriceDbService,
    private readonly configService: WeweConfigService,
  ) {}

  public async getMergeChart(coinId: string, timeFrame: TimeFrame): Promise<MergeChartDatapoint[]> {
    if (!this.configService.mergeCoinNames.includes(coinId)) {
      throw new NotFoundException("Coin Id not found");
    }

    const startDate = getStartDateFromNow(timeFrame);
    const wewePricePoints = await this.priceDbService.getPricePointsOfToken(WEWE_COINGECKO_NAME, startDate);
    const mergeCoinPricePoints = await this.priceDbService.getPricePointsOfToken(coinId, startDate);

    // Create a map for merge coin prices indexed by timestamp for quick lookup
    const mergeCoinPriceMap: Map<number, number> = new Map();
    mergeCoinPricePoints.forEach((point) => {
      mergeCoinPriceMap.set(point.timestamp, point.price);
    });

    // Merge the data based on timestamps
    const mergedChartData: MergeChartDatapoint[] = wewePricePoints
      .map((wewePoint) => {
        const mergeCoinPrice = mergeCoinPriceMap.get(wewePoint.timestamp);

        // Handle cases where there might not be a corresponding merge coin price
        if (mergeCoinPrice === undefined) {
          // Log and skip the datapoint
          this.logger.error(`No ${coinId} price found for timestamp ${wewePoint.timestamp}`);
          return null;
        }

        return new MergeChartDatapoint(wewePoint.timestamp, wewePoint.price, mergeCoinPrice);
      })
      .filter((datapoint) => datapoint !== null) as MergeChartDatapoint[];

    return mergedChartData;
  }
}
