// src/database/lock-db/lock-db.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Lock, LockDocument } from "../schemas/Lock.schema";
import { MongoServerError } from "mongodb";

@Injectable()
export class LockDbService {
  private readonly logger = new Logger(LockDbService.name);

  constructor(@InjectModel(Lock.name) private lockModel: Model<LockDocument>) {}

  /**
   * Attempts to acquire a lock for a given job.
   * @param jobName - Unique name of the job.
   * @returns {Promise<boolean>} - True if the lock was acquired, false otherwise.
   */
  async acquireLock(jobName: string): Promise<boolean> {
    try {
      const lock = new this.lockModel({
        jobName,
        lockedAt: new Date(),
      });
      await lock.save();
      this.logger.debug(`Lock acquired for job: ${jobName}`);
      return true;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        // Duplicate key error implies the lock is already held
        this.logger.warn(`Failed to acquire lock for job: ${jobName}. Lock already held.`);
        return false;
      }
      this.logger.error(`Error acquiring lock for job: ${jobName} - ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Releases the lock for a given job.
   * @param jobName - Unique name of the job.
   */
  async releaseLock(jobName: string): Promise<void> {
    try {
      await this.lockModel.deleteOne({ jobName }).exec();
      this.logger.debug(`Lock released for job: ${jobName}`);
    } catch (error) {
      this.logger.error(`Error releasing lock for job: ${jobName} - ${error.message}`, error.stack);
      throw error;
    }
  }
}
