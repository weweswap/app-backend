import { Injectable, Logger } from "@nestjs/common";
import { OperationsAggregatorService } from "./operations-aggregator/operations-aggregator.service";
import { VaultAggregatorService } from "./vault-aggregator/vault-aggregator.service";
import { PriceAggregatorService } from "./price-aggregator/price-aggregator.service";

@Injectable()
export class AggregatorsService {
  constructor(
    private operationsAggregatorService: OperationsAggregatorService,
    private vaultAggregatorService: VaultAggregatorService,
    private priceAggregatorService: PriceAggregatorService,
    private logger: Logger,
  ) {}

  public startAllAggregators(): void {
    this.operationsAggregatorService.aggregateOperations().catch((e) => {
      this.logger.error("operationsAggregatorService.aggregateOperations failed..");
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
