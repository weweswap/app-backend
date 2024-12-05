import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { OperationType } from "../../shared/enum/OperationType";

@Schema({
  _id: false,
})
export class LpOperationMetadata extends Document {
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
  userAddress: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  amount0: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  amount1: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  shareAmount: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  usdcValue: string;

  @Prop({
    type: Number,
    isRequired: true,
  })
  blockNumber: number;

  @Prop({
    type: Number,
    enum: OperationType,
    isRequired: true,
  })
  operationType: OperationType;
}

export const LpOperationMetadataSchema = SchemaFactory.createForClass(LpOperationMetadata);

@Schema({
  collection: "lpOperation",
  autoCreate: true,
  autoIndex: true,
})
export class LpOperationDocument extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  _id: string; // eventId

  @Prop({
    type: Date,
    isRequired: true,
  })
  timestamp: Date; // The primary date field for time series data

  @Prop({
    type: LpOperationMetadataSchema,
    isRequired: true,
  })
  metadata: LpOperationMetadata;
}

export const LpOperationSchema = SchemaFactory.createForClass(LpOperationDocument);
LpOperationSchema.index({ timestamp: 1, "metadata.userAddress": 1, "metadata.vaultAddress": 1 }, { unique: true });

export class LpOperationDto {
  constructor(
    public _id: string,
    public timestamp: Date,
    public metadata: LpOperationMetadataDto,
  ) {}
}

export class LpOperationMetadataDto {
  constructor(
    public vaultAddress: string,
    public userAddress: string,
    public amount0: string,
    public amount1: string,
    public shareAmount: string,
    public usdcValue: string,
    public blockNumber: number,
    public operationType: OperationType,
  ) {}
}
