import { Injectable, Logger } from "@nestjs/common";
import { DateTime } from "luxon";
import { MAX_CONSECUTIVE_RETRY, ONE_HOUR_IN_MILLISECONDS, TEN_SECONDS_IN_MILLISECONDS } from "../../shared/constants";
import { MergeCoinConfig } from "../../shared/class/WeweDataAggregatorConfig";
import { constructTimestamps } from "../../utils/aggregation-utils";
import { scheduleToTheNextFullHour } from "../../utils/utils";
import { WeweConfigService } from "../../config/wewe-data-aggregator-config.service";
import { CoingeckoService } from "../../price-oracles/coingecko/coingecko.service";
import { PriceDbService } from "../../database/price-db/price-db.service";
import { PriceHistoricalDataDto, PriceHistoricalMetadataDto } from "../../shared/class/PriceHistoricalDataDto";

@Injectable()
export class PriceAggregatorService {
  private readonly logger = new Logger(PriceAggregatorService.name);

  // counter responsible for adding up consecutive failures until we hit max limit
  private consecutiveFailCount = 0;

  constructor(
    private priceDbService: PriceDbService,
    private configService: WeweConfigService,
    private coingeckoService: CoingeckoService,
  ) {}

  public async startAggregating(): Promise<void> {
    if (this.configService.mergeCoinNames.length > 0) {
      this.startHourlyPriceHistoricalAggregation();
    }
  }

  private async startHourlyPriceHistoricalAggregation(): Promise<void> {
    // start aggregation for each coin
    try {
      // concurrently sync all coin data
      await Promise.all(this.configService.mergeCoinConfigs.map(async (coin) => this.aggregatePriceData(coin)));

      // reset consecutiveFailCount if aggregation succeeded
      this.consecutiveFailCount = 0;

      // if all coins are synced, schedule next sync at next full hour
      scheduleToTheNextFullHour(() => this.startAggregating());
    } catch (e) {
      this.consecutiveFailCount++;

      // if aggregation failed more than <MAX_CONSECUTIVE_RETRY> times in a row, throw an error because something is very wrong
      if (this.consecutiveFailCount > MAX_CONSECUTIVE_RETRY) {
        throw e;
      }

      this.logger.error(`Aggregation failed with error ${JSON.stringify(e, null, 2)}. Retrying in 10 seconds..`);

      // catch error and retry aggregation in 10 seconds
      setTimeout(() => this.startAggregating(), TEN_SECONDS_IN_MILLISECONDS);
    }
  }

  private async aggregatePriceData(coinConfig: MergeCoinConfig): Promise<void> {
    // retrieve last time when aggregation happened
    let lastTimestampAggregated: number | bigint | undefined =
      await this.priceDbService.getMostRecentPriceDataTimestamp(coinConfig.memeCoingeckoName);

    if (lastTimestampAggregated == undefined) {
      // if there is no last timestamp, derive the first timestamp from the starting block
      lastTimestampAggregated = coinConfig.chartStartTimestamp;
    }

    this.logger.debug(`${coinConfig.memeCoingeckoName} - lastTimestampAggregated: ${lastTimestampAggregated}`);

    // calculate next hour from the last aggregation timestamp e.g.
    const startingHourToAggregateFrom: number = DateTime.fromMillis(Number(lastTimestampAggregated))
      .plus({ hour: 1 })
      .startOf("hour")
      .toMillis();

    const now: DateTime = DateTime.local();

    const hourlyTimestampsToProcess = constructTimestamps(
      startingHourToAggregateFrom,
      now.toMillis(),
      ONE_HOUR_IN_MILLISECONDS,
    );

    for (const timestamp of hourlyTimestampsToProcess) {
      const price = await this.coingeckoService.getTokenUsdPrice(coinConfig.memeCoingeckoName, timestamp);

      // save into DB
      await this.priceDbService.savePriceData(
        new PriceHistoricalDataDto(
          new Date(timestamp),
          new PriceHistoricalMetadataDto(coinConfig.memeCoingeckoName, +price),
        ),
      );

      this.logger.log(`Saved price ${coinConfig.memeCoingeckoName} data for ${DateTime.fromMillis(timestamp).toISO()}`);
    }
  }
}
