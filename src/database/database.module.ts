import { Logger, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { VaultDbService } from "./vault-db/vault-db.service";
import { CollectVaultFeeEventDocument, CollectVaultFeeEventSchema } from "./schemas/CollectedVaultFeeEvent.schema";
import { VaultHistoricalDocument, VaultsHistoricalDocumentSchema } from "./schemas/VaultHistoricalData.schema";
import { WeweConfigModule } from "../config/wewe-data-aggregator-config.module";

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
    WeweConfigModule,
  ],
  providers: [Logger, VaultDbService],
  exports: [VaultDbService],
})
export class DatabaseModule {}
