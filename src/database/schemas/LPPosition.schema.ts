import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
  collection: "lpPositions",
  timestamps: true, // Automatically manages createdAt and updatedAt fields
})
export class LPPositionDocument extends Document {
  @Prop({
    type: String,
    required: true,
    lowercase: true,
    index: true,
  })
  userAddress: string;

  @Prop({
    type: String,
    required: true,
    lowercase: true,
    index: true,
  })
  vaultAddress: string;

  @Prop({
    type: Number,
    required: true,
  })
  usdcValue: number;

  @Prop({
    type: Date,
    required: true,
  })
  depositTimestamp: Date;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  depositId: string; // Unique identifier for the deposit, e.g., eventId

  @Prop({
    type: Date,
    required: true,
    default: () => new Date(),
  })
  lastRewardTimestamp: Date; // Tracks the last CHAOS points reward time
}

export const LPPositionSchema = SchemaFactory.createForClass(LPPositionDocument);

// Compound index to ensure uniqueness per user, vault, and depositId
LPPositionSchema.index({ userAddress: 1, vaultAddress: 1, depositId: 1 }, { unique: true });

// Index for lastRewardTimestamp to optimize querying
LPPositionSchema.index({ lastRewardTimestamp: 1 });
