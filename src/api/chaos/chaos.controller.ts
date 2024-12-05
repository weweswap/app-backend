import { Controller, Get, InternalServerErrorException, Logger, NotFoundException, Param } from "@nestjs/common";
import { ChaosService } from "./chaos.service";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ChaosInfoResponseDto } from "../../dto/ChaosInfoResponseDto";
import { ChaosLeaderboardResponseDto } from "../../dto/ChaosLeaderboardResponseDto";
import { GetChaosInfoParamsDto } from "../../dto/GetChaosInfoParamsDto";

@Controller("api/chaos")
@ApiTags("Chaos Info")
export class ChaosController {
  private readonly logger = new Logger(ChaosController.name);

  constructor(private readonly chaosService: ChaosService) {}

  /**
   * Retrieves ChaosInfo for a specific user by their Ethereum address.
   *
   * @param {GetChaosInfoParamsDto} params - The parameters containing the user's address.
   * @returns {Promise<ChaosInfoResponseDto>} The ChaosInfo of the user.
   * @throws {NotFoundException} If the user is not found.
   * @throws {InternalServerErrorException} If an unexpected error occurs.
   */
  @Get("/info/:address")
  @ApiOperation({ summary: "Get Chaos information for a specific user by address" })
  @ApiParam({
    name: "address",
    description: "Ethereum address of the user",
    type: String,
    example: "0x1234567890abcdef1234567890abcdef12345678",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved Chaos information.",
    type: ChaosInfoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "User not found.",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error.",
  })
  async getChaosInfo(@Param() params: GetChaosInfoParamsDto): Promise<ChaosInfoResponseDto> {
    const { address } = params;
    this.logger.log(`Fetching ChaosInfo for address: ${address}`);

    try {
      const chaosInfo = await this.chaosService.getChaosInfoByAddress(address);
      return chaosInfo;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`User not found: ${address}`);
        throw error;
      }
      this.logger.error(`Failed to retrieve ChaosInfo for address ${address}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to retrieve ChaosInfo for address ${address}.`);
    }
  }

  /**
   * Retrieves the top 10 CHAOS holders.
   *
   * @returns {Promise<ChaosLeaderboardResponseDto>} The top 10 CHAOS holders.
   * @throws {InternalServerErrorException} If an unexpected error occurs.
   */
  @Get("/leaderboard")
  @ApiOperation({ summary: "Get top 10 CHAOS holders" })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved top 10 CHAOS holders.",
    type: ChaosLeaderboardResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error.",
  })
  async getChaosLeaderboard(): Promise<ChaosLeaderboardResponseDto> {
    this.logger.log(`Fetching top 10 CHAOS holders`);

    try {
      const leaderboard = await this.chaosService.getTop10Holders();
      return leaderboard;
    } catch (error) {
      this.logger.error(`Failed to retrieve top 10 CHAOS holders: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to retrieve top 10 CHAOS holders.`);
    }
  }
}
