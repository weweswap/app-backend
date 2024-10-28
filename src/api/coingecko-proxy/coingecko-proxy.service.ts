import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { WeweConfigService } from "../../config/wewe-data-aggregator-config.service";

@Injectable()
export class CoingeckoProxyService implements NestMiddleware {
  private proxyMiddleware: ReturnType<typeof createProxyMiddleware>;

  constructor(private configService: WeweConfigService) {
    const apiKey = this.configService.coingeckoApiKey;

    const options: Options = {
      target: "https://pro-api.coingecko.com",
      changeOrigin: true,
      secure: true,
      pathRewrite: {
        "^/": "/api/v3/simple/price",
      },
      on: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        proxyReq: (proxyReq, req: Request, res: Response) => {
          proxyReq.setHeader("x-cg-pro-api-key", apiKey);
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        error: (err, req, res) => {
          console.error("[Proxy Error]:", err);
        },
      },
    };

    // Create the proxy middleware with options
    this.proxyMiddleware = createProxyMiddleware(options);
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Log incoming request before proxying
    console.log(`[Incoming Request] ${req.method} ${req.originalUrl}`);

    // Delegate the request to the proxy middleware
    this.proxyMiddleware(req, res, next);
  }
}
