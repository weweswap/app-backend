import { Injectable, Logger } from "@nestjs/common";
import { Address } from "viem";
import { LpPositionDbService } from "../../../database/lp-positions-db/lp-positions-db.service";
import { UserDbService } from "../../../database/user-db/user-db.service";
import { ArrakisContractsService } from "../../../contract-connectors/arrakis-contracts/arrakis-contracts.service";
import { LPPositionDocument } from "../../../database/schemas/LPPosition.schema";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

@Injectable()
export class ChaosPointsHelperService {
  private readonly CHAOS_PER_USDC_PER_HOUR = 10;

  constructor(
    private readonly logger: Logger,
    private readonly lpPositionDbService: LpPositionDbService,
    private readonly userDbService: UserDbService,
    private readonly arrakisConstractService: ArrakisContractsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * Calculates and updates CHAOS points for all active LP positions.
   */
  async updateChaosPointsHourly(): Promise<void> {
    try {
      const activePositions = await this.lpPositionDbService.getAllActiveLPPositions();
      const currentTime = new Date();

      for (const position of activePositions) {
        const { userAddress, usdcValue, lastRewardTimestamp, depositId, shareAmount, vaultAddress } = position;
        const currentVaultSharePrice = await this.arrakisConstractService.getCurrentVaultTokenPrice(
          vaultAddress as Address,
          currentTime.getTime(),
        );
        const vaultTokenDecimals = await this.arrakisConstractService.getVaultTokenDecimals(vaultAddress as Address);

        // Calculate the number of full hours elapsed since last reward
        const elapsedMs = currentTime.getTime() - lastRewardTimestamp.getTime();
        const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));

        if (elapsedHours <= 0) {
          // Less than an hour has passed; no points to award yet
          continue;
        }

        // Calculate CHAOS points
        const chaosPoints = usdcValue * this.CHAOS_PER_USDC_PER_HOUR * elapsedHours;
        const newUsdcValue = (+shareAmount / 10 ** vaultTokenDecimals) * currentVaultSharePrice;
        const newDate = new Date(lastRewardTimestamp.getTime() + elapsedMs);

        // Atomically update lastRewardTimestamp and retrieve the updated document
        await this.lpPositionDbService.updateLastRewardTimestamp(depositId, newDate, newUsdcValue);

        // Update user CHAOS points
        await this.userDbService.updateLpPoints(userAddress, chaosPoints);
        this.logger.debug(
          `Awarded ${chaosPoints} CHAOS points to user ${userAddress} for LP position ${depositId} (${elapsedHours} hours).`,
        );
        this.logger.log(`Successfully processed LP position ${depositId} for user ${userAddress}.`);
      }

      this.logger.log("Successfully updated CHAOS points hourly.");
    } catch (error) {
      this.logger.error(`Failed to update CHAOS points hourly: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculates and awards CHAOS points for a specific LP position based on the elapsed time.
   * @param position The LP position to process.
   * @param endTime The time until which points should be calculated (e.g., withdrawal time).
   */
  async calculateAndAwardHistoricChaosPoints(position: LPPositionDocument, endTime: Date): Promise<void> {
    const { userAddress, usdcValue, lastRewardTimestamp, depositId } = position;

    // Calculate elapsed time in hours
    const elapsedMs = endTime.getTime() - lastRewardTimestamp.getTime();
    const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));

    if (elapsedHours <= 0) {
      this.logger.debug(
        `No CHAOS points to award for LP position ${depositId}: less than an hour elapsed since last reward.`,
      );
      return;
    }

    // Calculate CHAOS points
    const chaosPoints = usdcValue * this.CHAOS_PER_USDC_PER_HOUR * elapsedHours;

    try {
      // Update user CHAOS points
      await this.userDbService.updateLpPoints(userAddress, chaosPoints);
      this.logger.debug(
        `Awarded ${chaosPoints} CHAOS points to user ${userAddress} for LP position ${depositId} (${elapsedHours} hours).`,
      );

      // Update the lastRewardTimestamp
      const newLastRewardTimestamp = new Date(lastRewardTimestamp.getTime() + elapsedHours * 60 * 60 * 1000);
      await this.lpPositionDbService.updateLastRewardTimestamp(depositId, newLastRewardTimestamp);

      this.logger.log(
        `Successfully processed historic CHAOS points for LP position ${depositId} for user ${userAddress}.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process catch-up CHAOS points for LP position ${depositId} for user ${userAddress}: ${error.message}`,
        error.stack,
      );
    }
  }
}
