import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
  _id: false,
})
export class CollectVaultFeeEventMetadata extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  vaultAddress: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  fee0: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  fee1: string;

  @Prop({
    type: Number,
    isRequired: true,
  })
  blockNumber: number;

  @Prop({
    type: String,
    isRequired: true,
  })
  txHash: string;
}

export const CollectVaultFeeEventMetadataSchema = SchemaFactory.createForClass(CollectVaultFeeEventMetadata);

@Schema({
  collection: "collectedVaultFeeEvents",
  autoCreate: true,
  autoIndex: true,
})
export class CollectVaultFeeEventDocument extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  _id: string;

  @Prop({
    type: Date,
    isRequired: true,
  })
  timestamp: Date;

  @Prop({
    type: CollectVaultFeeEventMetadataSchema,
    isRequired: true,
  })
  metadata: CollectVaultFeeEventMetadata;
}

export const CollectVaultFeeEventSchema = SchemaFactory.createForClass(CollectVaultFeeEventDocument);
CollectVaultFeeEventSchema.index({ timestamp: 1, "metadata.vaultAddress": 1 }, { unique: true });
