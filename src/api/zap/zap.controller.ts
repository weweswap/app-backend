import { Body, Controller, Logger, Post } from "@nestjs/common";
import { ZapInService } from "./zap-in.service";
import { GetZapInRouteBodyDto } from "../../dto/GetZapInRouteBodyDto";
import { GetZapOutRouteBodyDto } from "../../dto/GetZapOutRouteBodyDto";
import { ZapOutService } from "./zap-out.service";

@Controller("api")
export class ZapController {
  private readonly logger = new Logger(ZapController.name);

  constructor(
    private readonly zapInService: ZapInService,
    private readonly zapOutService: ZapOutService,
  ) {}

  @Post("/zap-in")
  async getZapInRoute(@Body() zapInRouteBodyDto: GetZapInRouteBodyDto) {
    try {
      return await this.zapInService.getZapInRoute(zapInRouteBodyDto);
    } catch (error) {
      this.logger.error("Error occurred during zap-in operation:", error);
      throw error;
    }
  }

  @Post("/zap-out")
  async getZapOutRoute(@Body() zapOutRouteBodyDto: GetZapOutRouteBodyDto) {
    try {
      return await this.zapOutService.getZapOutRoute(zapOutRouteBodyDto);
    } catch (error) {
      this.logger.error("Error occurred during zap-out operation:", error);
      throw error;
    }
  }
}
