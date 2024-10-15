import { Injectable, Logger } from "@nestjs/common";
import { EventsAggregatorService } from "./events-aggregator/events-aggregator.service";
import { VaultAggregatorService } from "./vault-aggregator/vault-aggregator.service";
import { PriceAggregatorService } from "./price-aggregator/price-aggregator.service";

@Injectable()
export class AggregatorsService {
  private readonly logger = new Logger(AggregatorsService.name);

  constructor(
    private eventsAggregatorService: EventsAggregatorService,
    private vaultAggregatorService: VaultAggregatorService,
    private priceAggregatorService: PriceAggregatorService,
    private logger: Logger,
  ) {}

  public startAllAggregators(): void {
    this.eventsAggregatorService.aggregateEvents().catch((e) => {
      this.logger.error("eventsAggregatorService.aggregateEvents failed..");
      throw e;
    });
    this.vaultAggregatorService.startAggregating().catch((e) => {
      this.logger.error("vaultAggregatorService.startAggregating failed..");
      throw e;
    });
    this.priceAggregatorService.startAggregating().catch((e) => {
      this.logger.error("priceAggregatorService.startAggregating failed..");
      throw e;
    });
  }
}
