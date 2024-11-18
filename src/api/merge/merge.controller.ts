import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { MergeService } from "./merge.service";
import { WhitelistService } from "./whitelist.service"; // Import the new service
import {
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { MergeChartDatapoint } from "../../dto/MergeChartDto";
import { GetMergeChartParamsDto } from "../../dto/GetMergeChartParamsDto";
import { HistoricDataQueryParamsDto } from "../../dto/HistoricDataQueryParamsDto";
import { WhitelistInfoResponseDto } from "../../dto/WhitelistInfoResponseDto";
import { GetWhitelistInfoParamsDto } from "../../dto/GetWhitelistInfoParamsDto";
import { GetWhitelistInfoQueryParamsDto } from "../../dto/GetWhitelistInfoQueryParamsDto";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { basename, extname } from "path";
import { ImportService } from "./importWhitelist.service";
import { SnapshotService } from "./snapshot.service";
import { Address, isAddress } from "viem";

@ApiTags("Merge")
@Controller("api/merge")
export class MergeController {
  private readonly logger = new Logger(MergeController.name);

  constructor(
    private readonly mergeService: MergeService,
    private readonly whitelistService: WhitelistService,
    private readonly importService: ImportService,
    private readonly snapshotService: SnapshotService,
  ) {}

  /**
   * Retrieves the Merge chart data for a specific coin.
   *
   * @param params - The parameters containing the `coinId`.
   * @param queryParams - The query parameters containing the `timeframe`.
   * @returns An array of `MergeChartDatapoint` objects representing the chart data.
   *
   * @throws {NotFoundException} If the merge coin is not found.
   * @throws {BadRequestException} If the request parameters are invalid.
   */
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
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid parameters.",
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

  /**
   * Retrieves whitelist information for a specific merge project and user address.
   *
   * @param params - The parameters containing the `address` of the merge project.
   * @param queryParams - The query parameters containing the `userAddress`.
   * @returns A `WhitelistInfoResponseDto` object containing whitelist details.
   *
   * @throws {NotFoundException} If the merge project or user is not found.
   * @throws {BadRequestException} If the request parameters are invalid.
   */
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
    description: "Merge project or user not found",
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid parameters.",
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

  /**
   * Uploads a CSV file to process whitelist entries for a merge project.
   *
   * @param file - The uploaded CSV file containing whitelist data.
   * @returns An object containing a success message and the generated Merkle Root.
   *
   * @throws {HttpException} If the file is not provided, invalid, or processing fails.
   */
  @Post("/whitelist/csv")
  @ApiSecurity("X-API-KEY")
  @ApiOperation({
    summary: "Upload Whitelist CSV",
    description: "Upload a CSV file containing whitelist entries for a specific merge project.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - File not provided or invalid format.",
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error - Processing failed.",
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "src/uploads",
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (extname(file.originalname).toLowerCase() !== ".csv") {
          return callback(new HttpException("Only CSV files are allowed!", HttpStatus.BAD_REQUEST), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    }),
  )
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException("File is not provided", HttpStatus.BAD_REQUEST);
    }

    const originalName = basename(file.originalname, extname(file.originalname));
    const mergeProject = originalName.toLowerCase();

    try {
      const merkleRoot = await this.importService.processCsv(file.path, mergeProject, 18);
      return { message: "CSV processed successfully", merkleRoot };
    } catch (error) {
      throw new HttpException(`Processing failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Initiates a snapshot process for a specific token contract address at a given block height.
   *
   * @param params - The parameters containing the `address` of the token contract.
   * @param queryParams - The query parameters containing the `blockheight` for the snapshot.
   * @returns A message indicating the success of the snapshot operation.
   *
   * @throws {NotFoundException} If the token is not found.
   * @throws {BadRequestException} If the token address is invalid.
   */
  @Post("/snapshot/:address")
  @ApiSecurity("X-API-KEY")
  @ApiOperation({
    summary: "Take Snapshot",
    description: "Initiate a snapshot process for a specific token contract address at a given block height.",
  })
  @ApiParam({
    name: "address",
    type: "string",
    description: "Address of the token contract",
    example: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  })
  @ApiQuery({
    name: "blockheight",
    required: true,
    type: Number,
    description: "Block height at which to take the snapshot",
    example: 12345678,
  })
  @ApiResponse({
    status: 200,
    description: "Snapshot successfully saved.",
    schema: {
      type: "string",
      example: "Snapshot successfully saved",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid token contract address.",
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - Token not found.",
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async takeSnapshot(
    @Param() params: GetWhitelistInfoParamsDto,
    @Query() queryParams: { blockheight: number },
  ): Promise<string> {
    try {
      // Validate the address using viem's isAddress
      if (!isAddress(params.address)) {
        throw new BadRequestException("Invalid token contract address.");
      }

      await this.snapshotService.takeSnapshot(params.address as Address, queryParams.blockheight);
      return "Snapshot successfully saved";
    } catch (error) {
      this.logger.error(
        `Error taking snapshot for project ${params.address} and blockheight ${queryParams.blockheight}: ${error}`,
      );
      throw new NotFoundException("Token not found");
    }
  }

  /**
   * Generates a Merkle Root for a specific token contract address at a given block height.
   *
   * @param params - The parameters containing the `address` of the token contract.
   * @param queryParams - The query parameters containing the `blockheight` for generating the Merkle Root.
   * @returns An object containing the generated Merkle Root.
   *
   * @throws {NotFoundException} If the token is not found.
   * @throws {BadRequestException} If the token address is invalid.
   */
  @Post("/merkleroot/:address")
  @ApiSecurity("X-API-KEY")
  @ApiOperation({
    summary: "Generate Merkle Root",
    description: "Generate a Merkle Root for a specific token contract address at a given block height.",
  })
  @ApiParam({
    name: "address",
    type: "string",
    description: "Address of the token contract",
    example: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  })
  @ApiQuery({
    name: "blockheight",
    required: true,
    type: Number,
    description: "Block height at which to generate the Merkle Root",
    example: 12345678,
  })
  @ApiResponse({
    status: 200,
    description: "Successfully generated Merkle Root.",
    schema: {
      type: "object",
      properties: {
        merkleRoot: { type: "string", example: "0xabc123..." },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid token contract address.",
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - Token not found.",
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async generateMerkleRoot(
    @Param() params: GetWhitelistInfoParamsDto,
    @Query() queryParams: { blockheight: number },
  ): Promise<{ merkleRoot: string }> {
    try {
      // Validate the address using viem's isAddress
      if (!isAddress(params.address)) {
        throw new BadRequestException("Invalid token contract address.");
      }

      const holders = await this.snapshotService.takeSnapshot(params.address as Address, queryParams.blockheight);
      const merkleRoot = await this.snapshotService.generateMerkleRoot(params.address.toLowerCase(), holders);
      return { merkleRoot };
    } catch (error) {
      this.logger.error(
        `Error taking snapshot for project ${params.address} and blockheight ${queryParams.blockheight}: ${error}`,
      );
      throw new NotFoundException("Token not found");
    }
  }
}
