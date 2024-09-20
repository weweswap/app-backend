import { Test, TestingModule } from "@nestjs/testing";
import { CoingeckoService } from "./coingecko.service";
import { HttpModule } from "@nestjs/axios";
import { Logger } from "@nestjs/common";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";

describe("CoingeckoService", () => {
  let service: CoingeckoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WeweConfigModule, HttpModule],
      providers: [CoingeckoService, Logger],
    }).compile();

    service = module.get<CoingeckoService>(CoingeckoService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
