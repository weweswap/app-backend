import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { MergeService } from "./merge.service";
import { WhitelistService } from "./whitelist.service"; // Import the new service
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { MergeChartDatapoint } from "../../dto/MergeChartDto";
import { GetMergeChartParamsDto } from "../../dto/GetMergeChartParamsDto";
import { HistoricDataQueryParamsDto } from "../../dto/HistoricDataQueryParamsDto";
import { WhitelistInfoResponseDto } from "../../dto/WhitelistInfoResponseDto";
import { GetWhitelistInfoParamsDto } from "../../dto/GetWhitelistInfoParamsDto";
import { GetWhitelistInfoQueryParamsDto } from "../../dto/GetWhitelistInfoQueryParamsDto";

@Controller("api/merge")
export class MergeController {
  private readonly logger = new Logger(MergeController.name);

  constructor(
    private readonly mergeService: MergeService,
    private readonly whitelistService: WhitelistService,
  ) {}

  @Get("/:coinId")
  @ApiOperation({
    summary: "Get Merge chart for a specific coin",
    description: "Retrieve chart information for WEWE and the to be merged coin.",
  })
  @ApiParam({
    name: "coinId",
    type: "string",
    description: "Name of the merge coin",
    example: "brokkr",
  })
  @ApiQuery({
    name: "timeframe",
    required: false,
    type: String,
    enum: ["daily", "weekly", "monthly"],
    description: "Timeframe for historic chart data.",
    example: "daily",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved chart information.",
    type: MergeChartDatapoint,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: "Merge Coin not found",
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => new BadRequestException(`Bad Request: ${errors}`),
    }),
  )
  async getMergeChart(
    @Param() params: GetMergeChartParamsDto,
    @Query() queryParams: HistoricDataQueryParamsDto,
  ): Promise<MergeChartDatapoint[]> {
    const { coinId } = params;
    try {
      return await this.mergeService.getMergeChart(coinId.toLowerCase(), queryParams.timeframe);
    } catch (error) {
      this.logger.error(`Error fetching merge chart information for coin ${coinId}: ${error}`);
      throw new NotFoundException("Merge Coin not found");
    }
  }

  @Get("/whitelist/:address")
  @ApiOperation({
    summary: "Get whitelist info for a certain merge project and address",
    description: "Retrieve whitelist information like proofs and whitelisted amounts",
  })
  @ApiParam({
    name: "projectAddress",
    type: "string",
    description: "Address of the merge project",
    example: "0x1234567890abcdef1234567890abcdef12345678",
  })
  @ApiQuery({
    name: "userAddress",
    required: true,
    type: String,
    description: "Address of the requested user",
    example: "0x1234567890abcdef1234567890abcdef12345678",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved whitelist information.",
    type: WhitelistInfoResponseDto,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: "Merge Coin not found",
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => new BadRequestException(`Bad Request: ${errors}`),
    }),
  )
  async getWhitelistInfo(
    @Param() params: GetWhitelistInfoParamsDto,
    @Query() queryParams: GetWhitelistInfoQueryParamsDto,
  ): Promise<WhitelistInfoResponseDto> {
    try {
      return await this.whitelistService.getWhitelistInfo(params.address, queryParams.userAddress);
    } catch (error) {
      this.logger.error(
        `Error fetching whitelist information for project ${params.address} and user ${queryParams.userAddress}: ${error}`,
      );
      throw new NotFoundException("Merge project or user not found");
    }
  }
}
