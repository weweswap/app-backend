import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
  _id: false,
})
export class RewardsConvertedToUsdcEventMetadata extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  vaultAddress: string;

  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  feeManagerAddress: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  feeInUsdc: string;

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

export const RewardsConvertedToUsdcEventMetadataSchema = SchemaFactory.createForClass(
  RewardsConvertedToUsdcEventMetadata,
);

@Schema({
  collection: "rewardsConvertedToUsdcEvents",
  autoCreate: true,
  autoIndex: true,
})
export class RewardsConvertedToUsdcEventDocument extends Document {
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
    type: RewardsConvertedToUsdcEventMetadataSchema,
    isRequired: true,
  })
  metadata: RewardsConvertedToUsdcEventMetadata;
}

export const RewardsConvertedToUsdcEventSchema = SchemaFactory.createForClass(RewardsConvertedToUsdcEventDocument);
RewardsConvertedToUsdcEventSchema.index({ timestamp: 1, "metadata.vaultAddress": 1 }, { unique: true });
