// src/database/schemas/Lock.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type LockDocument = Lock & Document;

@Schema({ timestamps: true })
export class Lock {
  @Prop({ required: true, unique: true })
  jobName: string;

  @Prop({ required: true })
  lockedAt: Date;
}

export const LockSchema = SchemaFactory.createForClass(Lock);

// Add a TTL index to automatically remove stale locks after a specified duration (e.g., 1 hour)
LockSchema.index({ lockedAt: 1 }, { expireAfterSeconds: 3600 });
