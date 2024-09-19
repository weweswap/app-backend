import { Logger, Module } from "@nestjs/common";
import { BrokkrDataAggregatorConfigModule } from "../config/brokkr-data-aggregator-config.module";
import { MongooseModule } from "@nestjs/mongoose";
import { VaultDbService } from "./vault-db/vault-db.service";
import { CollectVaultFeeEventDocument, CollectVaultFeeEventSchema } from "./schemas/CollectedVaultFeeEvent.schema";
import { VaultHistoricalDocument, VaultsHistoricalDocumentSchema } from "./schemas/VaultHistoricalData.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CollectVaultFeeEventDocument.name,
        schema: CollectVaultFeeEventSchema,
      },
      {
        name: VaultHistoricalDocument.name,
        schema: VaultsHistoricalDocumentSchema,
      },
    ]),
    BrokkrDataAggregatorConfigModule,
  ],
  providers: [Logger, VaultDbService],
  exports: [VaultDbService],
})
export class DatabaseModule {}
