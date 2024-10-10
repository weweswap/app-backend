import { Injectable, Logger } from "@nestjs/common";
import { EventsAggregatorService } from "./events-aggregator/events-aggregator.service";
import { VaultAggregatorService } from "./vault-aggregator/vault-aggregator.service";

@Injectable()
export class AggregatorsService {
  constructor(
    private eventsAggregatorService: EventsAggregatorService,
    private vaultAggregatorService: VaultAggregatorService,
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
  }
}
