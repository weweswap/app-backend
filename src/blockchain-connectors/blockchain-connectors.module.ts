import { Logger, Module } from "@nestjs/common";
import { EvmConnectorService } from "./evm-connector/evm-connector.service";
import { WeweConfigModule } from "../config/wewe-data-aggregator-config.module";
import { WeweConfigService } from "../config/wewe-data-aggregator-config.service";
import { EvmWriteService } from "./evm-write/evm-write.service";

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
    {
      provide: EvmWriteService,
      inject: [WeweConfigService],
      useFactory: async (config: WeweConfigService) => {
        const service = new EvmWriteService(config);

        return await service.initialize();
      },
    },
  ],
  exports: [EvmConnectorService, EvmWriteService],
})
export class BlockchainConnectorsModule {}
