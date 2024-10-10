import { Logger, Module } from "@nestjs/common";
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

        return await service.initialize();
      },
    },
  ],
  exports: [EvmConnectorService],
})
export class BlockchainConnectorsModule {}
