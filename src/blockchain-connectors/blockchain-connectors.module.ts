import { Logger, Module } from "@nestjs/common";
import { Erc20Service } from "./erc-20/erc-20.service";
import { EvmConnectorService } from "./evm-connector/evm-connector.service";
import { WeweConfigModule } from "../config/wewe-data-aggregator-config.module";
import { WeweConfigService } from "../config/wewe-data-aggregator-config.service";

@Module({
  imports: [WeweConfigModule],
  providers: [
    Logger,
    {
      provide: EvmConnectorService,
      inject: [Logger, WeweConfigService],
      useFactory: async (logger: Logger, config: WeweConfigService) => {
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
