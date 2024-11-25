import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model } from "mongoose";
import { LPPositionDocument } from "../schemas/LPPosition.schema";

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
   * Updates the lastRewardTimestamp of an LP Position.
   */
  async updateLastRewardTimestamp(depositId: string, newTimestamp: Date, session?: ClientSession): Promise<void> {
    try {
      await this.lpPositionModel
        .updateOne({ depositId }, { lastRewardTimestamp: newTimestamp })
        .session(session ?? null)
        .exec();
    } catch (error) {
      this.logger.error(
        `Failed to update lastRewardTimestamp for LP Position ${depositId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
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
