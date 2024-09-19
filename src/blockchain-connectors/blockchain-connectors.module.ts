import { Logger, Module } from "@nestjs/common";
import { BrokkrDataAggregatorConfigModule } from "../config/brokkr-data-aggregator-config.module";
import { BrokkrDataAggregatorConfigService } from "../config/brokkr-data-aggregator-config.service";
import { Erc20Service } from "./erc-20/erc-20.service";
import { EvmConnectorService } from "./evm-connector/evm-connector.service";

@Module({
  imports: [BrokkrDataAggregatorConfigModule],
  providers: [
    Logger,
    {
      provide: EvmConnectorService,
      inject: [Logger, BrokkrDataAggregatorConfigService],
      useFactory: async (logger: Logger, config: BrokkrDataAggregatorConfigService) => {
        const service = new EvmConnectorService(logger, config);

        if (!config.isTest()) {
          return await service.initialize();
        }
      },
    },
    Erc20Service,
  ],
  exports: [EvmConnectorService, Erc20Service],
})
export class BlockchainConnectorsModule {}
