import { Injectable, Logger } from "@nestjs/common";
import { UserDbService } from "../user-db/user-db.service";
import { Connection } from "mongoose";
import { InjectConnection } from "@nestjs/mongoose";
import { LpPositionDbService } from "../lp-positions-db/lp-positions-db.service";

@Injectable()
export class ChaosPointsHelperService {
  private readonly CHAOS_PER_USDC_PER_HOUR = 10;

  constructor(
    private readonly logger: Logger,
    private readonly lpPositionDbService: LpPositionDbService,
    private readonly userDbService: UserDbService,
    @InjectConnection() private readonly connection: Connection, // Inject Mongoose connection
  ) {}

  /**
   * Calculates and updates CHAOS points for all active LP positions.
   */
  async updateChaosPointsHourly(): Promise<void> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const activePositions = await this.lpPositionDbService.getAllActiveLPPositions(session);

      const currentTime = new Date();

      for (const position of activePositions) {
        const { userAddress, usdcValue, lastRewardTimestamp, depositId } = position;

        // Calculate the number of full hours elapsed since last reward
        const elapsedMs = currentTime.getTime() - lastRewardTimestamp.getTime();
        const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
        console.log(elapsedHours);

        if (elapsedHours <= 0) {
          // Less than an hour has passed; no points to award yet
          continue;
        }

        // Calculate CHAOS points
        const chaosPoints = usdcValue * this.CHAOS_PER_USDC_PER_HOUR * elapsedHours;
        console.log(chaosPoints);

        // Update user CHAOS points
        await this.userDbService.updateLpPoints(userAddress, chaosPoints, session);

        this.logger.debug(
          `Awarded ${chaosPoints} CHAOS points to user ${userAddress} for LP position ${depositId} (${elapsedHours} hours).`,
        );

        // Update the lastRewardTimestamp
        const newLastRewardTimestamp = new Date(lastRewardTimestamp.getTime() + elapsedHours * 60 * 60 * 1000);
        await this.lpPositionDbService.updateLastRewardTimestamp(depositId, newLastRewardTimestamp, session);
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Failed to update CHAOS points hourly: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }
}
