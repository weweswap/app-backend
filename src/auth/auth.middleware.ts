import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { WeweConfigService } from "../config/wewe-data-aggregator-config.service";

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private readonly configService: WeweConfigService) {}

  private readonly API_KEY = this.configService.internalApiKey;

  use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey || apiKey !== this.API_KEY) {
      throw new UnauthorizedException("Invalid or missing API key");
    }

    next();
  }
}
