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
   * Updates the usdcValue of an LP Position (for partial withdrawals).
   * @param depositId Unique identifier of the deposit.
   * @param newUsdcValue New USDC value after withdrawal.
   */
  async updateLPPositionUsdcValue(depositId: string, newUsdcValue: number, session?: ClientSession): Promise<void> {
    try {
      await this.lpPositionModel
        .updateOne({ depositId }, { usdcValue: newUsdcValue })
        .session(session ?? null)
        .exec();
    } catch (error) {
      this.logger.error(`Failed to update LP Position ${depositId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Updates the lastRewardTimestamp of an LP Position with retry logic.
   *
   * @param depositId - Unique identifier of the deposit.
   * @param newTimestamp - New timestamp to set.
   * @param session - MongoDB client session.
   */
  async updateLastRewardTimestampWithRetry(
    depositId: string,
    newTimestamp: Date,
    session: ClientSession,
    maxRetries: number = 5,
    retryDelay: number = 100, // in milliseconds
  ): Promise<void> {
    let attempt = 0;
    let currentDelay = retryDelay;

    while (attempt < maxRetries) {
      try {
        await this.lpPositionModel
          .updateOne({ depositId }, { $set: { lastRewardTimestamp: newTimestamp } }, { session })
          .exec();
        this.logger.log(`Successfully updated lastRewardTimestamp for LP Position ${depositId}`);
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
            `Transient error updating lastRewardTimestamp for LP Position ${depositId}. Retry attempt ${attempt} after ${currentDelay}ms.`,
          );
          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          currentDelay *= 2; // Exponential backoff
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
}
