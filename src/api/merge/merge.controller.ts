// src/merge/merge.controller.ts

import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { MergeService } from "./merge.service";
import { WhitelistService } from "./whitelist.service"; // Import the new service
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { MergeChartDatapoint } from "../../dto/MergeChartDto";
import { GetMergeChartParamsDto } from "../../dto/GetMergeChartParamsDto";
import { HistoricDataQueryParamsDto } from "../../dto/HistoricDataQueryParamsDto";

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

  @Post("/whitelist/:address")
  @ApiOperation({
    summary: "Add Address to Whitelist",
    description: "Add a user's Ethereum address to the whitelist.",
  })
  @ApiParam({
    name: "address",
    type: "string",
    description: "User's Ethereum address",
    example: "0x0000000000000000000000000000000000000000",
  })
  @ApiResponse({
    status: 200,
    description: "Successful transaction hash.",
    type: String,
  })
  @ApiNotFoundResponse({
    description: "Address not found in whitelist",
  })
  @ApiBadRequestResponse({
    description: "Invalid Ethereum address or unable to add to whitelist",
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new BadRequestException(`Bad Request: ${errors}`),
    }),
  )
  async setWhitelist(@Param("address") address: string): Promise<string> {
    try {
      const result = await this.whitelistService.addAddressToWhitelist(address);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error; // Re-throw known exceptions
      }
      this.logger.error(`Unexpected error setting whitelist for ${address}: ${error}`);
      throw new BadRequestException("Unable to set whitelist");
    }
  }
}
