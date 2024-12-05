import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { UserDbService } from "../../database/user-db/user-db.service";
import { ChaosLeaderboardEntry, ChaosLeaderboardResponseDto } from "../../dto/ChaosLeaderboardResponseDto";
import { ChaosInfoResponseDto } from "../../dto/ChaosInfoResponseDto";
import { Address } from "viem";

@Injectable()
export class ChaosService {
  private readonly logger = new Logger(ChaosService.name);

  constructor(private readonly userDbService: UserDbService) {}

  /**
   * Retrieves ChaosInfo for a single user by their address.
   *
   * @param {string} address - The address of the user.
   * @returns {Promise<ChaosInfoResponseDto>} The mapped ChaosInfoResponseDto of the user.
   * @throws {NotFoundException} If the user is not found.
   */
  async getChaosInfoByAddress(address: string): Promise<ChaosInfoResponseDto> {
    try {
      const user = await this.userDbService.getUserPoints(address);
      if (!user) {
        throw new NotFoundException(`User with address ${address} not found.`);
      }

      // Compute the leaderboard rank
      const leaderboardRank = await this.computeUserRank(user.totalCHAOSPoints);

      // Map to ChaosInfoResponseDto
      const chaosInfoDto = new ChaosInfoResponseDto(
        user.userAddress as Address,
        leaderboardRank,
        user.totalCHAOSPoints,
      );

      return chaosInfoDto;
    } catch (error) {
      throw new Error(`Failed to retrieve ChaosInfo for address ${address}: ${error.message}`);
    }
  }

  /**
   * Computes the leaderboard rank of a user based on their totalCHAOSPoints.
   *
   * @param {number} totalChaosPoints - The total CHAOS points of the user.
   * @returns {Promise<number>} The rank of the user.
   */
  private async computeUserRank(totalChaosPoints: number): Promise<number> {
    // Count the number of users who have more CHAOS points than the current user
    const count = await this.userDbService.countUsersWithMorePoints(totalChaosPoints);
    // Rank is count + 1
    return count + 1;
  }

  /**
   * Retrieves the top 10 holders based on totalCHAOSPoints.
   *
   * @returns {Promise<ChaosLeaderboardResponseDto>} The ChaosLeaderboardResponseDto containing top 10 holders.
   * @throws {Error} If retrieval fails.
   */
  async getTop10Holders(): Promise<ChaosLeaderboardResponseDto> {
    try {
      const topUsers = await this.userDbService.getTop10UsersByTotalCHAOSPoints();

      // Map each user to ChaosLeaderboardEntry
      const leaderboardEntries: ChaosLeaderboardEntry[] = topUsers.map((user) => {
        return new ChaosLeaderboardEntry(user.userAddress as Address, user.totalCHAOSPoints);
      });

      // Create and return the response DTO
      const responseDto = new ChaosLeaderboardResponseDto();
      responseDto.chaosLeaderboard = leaderboardEntries;

      return responseDto;
    } catch (error) {
      this.logger.error(`Failed to retrieve top 10 holders: ${error.message}`, error.stack);
      throw new Error(`Failed to retrieve top 10 holders: ${error.message}`);
    }
  }
}
