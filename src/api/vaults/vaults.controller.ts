import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Logger,
  UsePipes,
  ValidationPipe,
  BadRequestException,
  Query,
} from "@nestjs/common";
import { VaultsService } from "./vaults.service";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Address } from "viem";
import { VaultInfoResponseDto } from "../../dto/VaultInfoResponseDto";
import { GetVaultInfoParamsDto } from "../../dto/GetVaultInfoParamsDto";
import { HistoricTvlDatapoint } from "../../dto/HistoricTvlDto";
import { HistoricPriceDatapoint } from "../../dto/HistoricPriceDto";
import { HistoricDataQueryParamsDto } from "../../dto/HistoricDataQueryParamsDto";

@Controller("api")
@ApiTags("Vault Info")
export class VaultsController {
  private readonly logger = new Logger(VaultsController.name);

  constructor(private readonly vaultService: VaultsService) {}

  @Get("/:address")
  @ApiOperation({
    summary: "Get Vault Information",
    description: "Retrieve information about a vault using its address.",
  })
  @ApiParam({
    name: "address",
    type: "string",
    description: "Address of the vault",
    example: "0x1234567890abcdef1234567890abcdef12345678",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved vault information.",
    type: VaultInfoResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Not a valid Ethereum Address",
  })
  @ApiNotFoundResponse({
    description: "Vault address not found.",
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // Optionally strip unknown properties
      forbidNonWhitelisted: true, // Optionally throw error on unknown properties
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      exceptionFactory: (errors) => new BadRequestException("Not a valid Ethereum Address"),
    }),
  )
  async getVaultInfo(@Param() params: GetVaultInfoParamsDto): Promise<VaultInfoResponseDto> {
    const { address } = params;
    try {
      return await this.vaultService.getVaultInfo(address.toLowerCase() as Address);
    } catch (error) {
      this.logger.error(`Error fetching vault information for address ${address}: ${error}`);
      throw new NotFoundException("Vault Address not found");
    }
  }

  @Get("/tvl/:address")
  @ApiOperation({
    summary: "Get Historic TVL Data",
    description:
      "Retrieve historic Total Value Locked (TVL) data for a specific vault address within a specified timeframe.",
  })
  @ApiParam({
    name: "address",
    type: "string",
    description: "Ethereum address of the vault.",
    example: "0x1234567890abcdef1234567890abcdef12345678",
  })
  @ApiQuery({
    name: "timeframe",
    required: false,
    type: String,
    enum: ["daily", "weekly"],
    description: "Timeframe for historic TVL data.",
    example: "daily",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved historic TVL data.",
    type: HistoricTvlDatapoint,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: "Bad Request - Invalid parameters.",
  })
  @ApiNotFoundResponse({
    description: "Vault Address not found.",
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => new BadRequestException(`Bad Request: ${errors}`),
    }),
  )
  async getHistoricTvl(
    @Param() params: GetVaultInfoParamsDto,
    @Query() queryParams: HistoricDataQueryParamsDto,
  ): Promise<HistoricTvlDatapoint[]> {
    const { address } = params;
    try {
      return await this.vaultService.getHistoricTvl(address.toLowerCase() as Address, queryParams.timeframe);
    } catch (error) {
      this.logger.error(`Error fetching historic tvl for address ${address}: ${error}`);
      throw new NotFoundException("Vault Address not found");
    }
  }

  @Get("/price/:address")
  @ApiOperation({
    summary: "Get Historic Price Data",
    description: "Retrieve historic price data for a specific vault address within a specified timeframe.",
  })
  @ApiParam({
    name: "address",
    type: "string",
    description: "Ethereum address of the vault.",
    example: "0x1234567890abcdef1234567890abcdef12345678",
  })
  @ApiQuery({
    name: "timeframe",
    required: false,
    type: String,
    enum: ["daily", "weekly"],
    description: "Timeframe for historic price data.",
    example: "daily",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved historic price data.",
    type: HistoricPriceDatapoint,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: "Bad Request - Invalid parameters.",
  })
  @ApiNotFoundResponse({
    description: "Vault Address not found.",
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => new BadRequestException(`Bad Request: ${errors}`),
    }),
  )
  async getHistoricPrice(
    @Param() params: GetVaultInfoParamsDto,
    @Query() queryParams: HistoricDataQueryParamsDto,
  ): Promise<HistoricPriceDatapoint[]> {
    const { address } = params;
    try {
      return await this.vaultService.getHistoricPrice(address.toLowerCase() as Address, queryParams.timeframe);
    } catch (error) {
      this.logger.error(`Error fetching historic price for address ${address}: ${error}`);
      throw new NotFoundException("Vault Address not found");
    }
  }
}
