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
import { Address } from "viem";

@Controller("api/merge")
export class MergeController {
  private readonly logger = new Logger(MergeController.name);

  constructor(
    private readonly mergeService: MergeService,
    private readonly whitelistService: WhitelistService,
    private readonly importService: ImportService,
    private readonly snapshotService: SnapshotService,
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

  @Post("/whitelist/csv")
  @ApiSecurity("X-API-KEY")
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

  @Post("/snapshot/:address")
  async takeSnapshot(@Param() params: GetWhitelistInfoParamsDto, @Query() queryParams: { blockheight: number }) {
    try {
      console.log(params.address, queryParams.blockheight);
      return await this.snapshotService.takeSnapshot(params.address as Address, queryParams.blockheight);
    } catch (error) {
      this.logger.error(
        `Error taking snapshot for project ${params.address} and blockheight ${queryParams.blockheight}: ${error}`,
      );
      throw new NotFoundException("Token not found");
    }
  }
}
