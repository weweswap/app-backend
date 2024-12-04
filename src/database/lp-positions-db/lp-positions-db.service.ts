import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model } from "mongoose";
import { LPPositionDocument } from "../schemas/LPPosition.schema";
import { MongoServerError } from "mongodb";

@Injectable()
export class LpPositionDbService {
  private readonly logger = new Logger(LpPositionDbService.name);

  constructor(
    @InjectModel(LPPositionDocument.name)
    private lpPositionModel: Model<LPPositionDocument>,
  ) {}

  /**
   * Creates a new LP Position.
   * @param positionData Data for the new LP position.
   */
  async createLPPosition(positionData: Partial<LPPositionDocument>, session?: ClientSession): Promise<boolean> {
    try {
      const newPosition = new this.lpPositionModel(positionData);
      if (session) {
        return !!(await newPosition.save({ session }));
      }
      return !!(await newPosition.save());
    } catch (e) {
      // Check if the error is a duplicate key error (11000 is the MongoDB error code for duplicate key error)
      if (e.code === 11000) {
        this.logger.warn("Duplicate key error. Ignoring.");
        return true;
      } else {
        this.logger.error(`Failed to save lp operation.. Error: ${JSON.stringify(e, null, 2)}`);

        // Re-throw the error if it's not a duplicate key error
        throw e;
      }
    }
  }

  /**
   * Finds active LP Positions for a user and vault, sorted by depositTimestamp (FIFO).
   * @param userAddress Address of the user.
   * @param vaultAddress Address of the vault.
   */
  async findActiveLPPositions(
    userAddress: string,
    vaultAddress: string,
    session?: ClientSession,
  ): Promise<LPPositionDocument[]> {
    try {
      return await this.lpPositionModel
        .find({ userAddress, vaultAddress })
        .sort({ depositTimestamp: 1 }) // FIFO
        .session(session ?? null)
        .exec();
    } catch (error) {
      this.logger.error(`Failed to find active LP Positions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Deletes an LP Position by its ID.
   * @param depositId Unique identifier of the deposit.
   */
  async deleteLPPosition(depositId: string, session?: ClientSession): Promise<void> {
    try {
      await this.lpPositionModel
        .deleteOne({ depositId })
        .session(session ?? null)
        .exec();
    } catch (error) {
      this.logger.error(`Failed to delete LP Position ${depositId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Updates the usdcValue and share amount of an LP Position (for partial withdrawals).
   * @param depositId Unique identifier of the deposit.
   * @param newShareAmount New share amount.
   * @param newUsdcValue New USDC value after withdrawal.
   */
  async updateLPPositionShares(
    depositId: string,
    newShareAmount: bigint,
    newUsdcValue: number,
    session?: ClientSession,
  ): Promise<void> {
    try {
      await this.lpPositionModel
        .updateOne({ depositId }, { shareAmount: newShareAmount, usdcValue: newUsdcValue })
        .session(session ?? null)
        .exec();
    } catch (error) {
      this.logger.error(`Failed to update LP Position ${depositId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Updates the lastRewardTimestamp of an LP Position.
   *
   * @param depositId - Unique identifier of the deposit.
   * @param newTimestamp - New timestamp to set.
   */
  async updateLastRewardTimestamp(depositId: string, newTimestamp: Date, newUsdcValue?: number): Promise<void> {
    const filter = { depositId };
    const update: any = { $set: { lastRewardTimestamp: newTimestamp } };
    if (newUsdcValue !== undefined) {
      update.$set.usdcValue = newUsdcValue;
    }
    const options = {};

    let attempt = 0;
    const maxRetries = 5;
    let retryDelay = 100; // Initial delay in milliseconds

    while (attempt < maxRetries) {
      try {
        await this.lpPositionModel.updateOne(filter, update, options).exec();
        this.logger.log(`Successfully updated lastRewardTimestamp for LP Position ${depositId}.`);
        return; // Success
      } catch (error) {
        if (
          error instanceof MongoServerError &&
          (error.hasErrorLabel("TransientTransactionError") ||
            error.code === 112 || // Write conflict
            error.code === 251) // UnknownTransactionCommitResult
        ) {
          attempt++;
          this.logger.warn(
            `Transient error updating lastRewardTimestamp for LP Position ${depositId}. Retry attempt ${attempt} after ${retryDelay}ms.`,
          );
          await this.delay(retryDelay);
          retryDelay *= 2; // Exponential backoff
        } else {
          this.logger.error(
            `Non-transient error updating lastRewardTimestamp for LP Position ${depositId}: ${error.message}`,
            error.stack,
          );
          throw error; // Rethrow non-transient errors
        }
      }
    }

    throw new Error(`Failed to update lastRewardTimestamp for LP Position ${depositId} after ${maxRetries} attempts.`);
  }

  /**
   * Retrieves all active LP Positions.
   */
  async getAllActiveLPPositions(session?: ClientSession): Promise<LPPositionDocument[]> {
    try {
      return await this.lpPositionModel
        .find({})
        .session(session ?? null)
        .exec();
    } catch (error) {
      this.logger.error(`Failed to retrieve all active LP Positions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Utility method to delay execution.
   *
   * @param ms - Milliseconds to delay.
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Atomically updates the lastRewardTimestamp and returns the updated document if successful.
   * Returns null if the position was already processed.
   *
   * @param depositId - Unique identifier of the deposit.
   * @param elapsedHours - Number of hours to add to lastRewardTimestamp.
   * @param session - MongoDB session for transaction.
   * @returns {Promise<LPPositionDocument | null>} - The updated document or null.
   */
  async updateLastRewardTimestampTransactional(
    depositId: string,
    elapsedHours: number,
    session: ClientSession,
    newUsdcValue?: number,
  ): Promise<LPPositionDocument | null> {
    const filter = { depositId };
    const update: any = {
      $set: {
        lastRewardTimestamp: new Date(new Date().getTime() + elapsedHours * 60 * 60 * 1000),
      },
    };
    if (newUsdcValue !== undefined) {
      update.$set.usdcValue = newUsdcValue;
    }

    try {
      const updatedDoc = await this.lpPositionModel
        .findOneAndUpdate(filter, update, {
          new: true,
          session,
        })
        .exec();

      if (!updatedDoc) {
        this.logger.warn(`LP Position ${depositId} not found for updating.`);
        return null;
      }

      return updatedDoc;
    } catch (error) {
      this.logger.error(
        `Failed to update lastRewardTimestamp for LP Position ${depositId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
