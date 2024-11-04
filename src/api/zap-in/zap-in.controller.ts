import { Body, Controller, Logger, Post } from "@nestjs/common";
import { ZapInService } from "./zap-in.service";
import { GetZapInRouteBodyDto } from "../../dto/GetZapInRouteBodyDto";

@Controller("api/zap-in")
export class ZapInController {
  private readonly logger = new Logger(ZapInController.name);

  constructor(private readonly zapInservice: ZapInService) {}

  @Post()
  async getZapInRoute(@Body() zapInRouteBodyDto: GetZapInRouteBodyDto) {
    try {
      return await this.zapInservice.getZapInRoute(zapInRouteBodyDto);
    } catch (error) {
      this.logger.error("Error occurred during zap-in operation:", error);
      throw error;
    }
  }
}
