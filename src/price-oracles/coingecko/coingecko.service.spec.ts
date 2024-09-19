import { Test, TestingModule } from "@nestjs/testing";
import { CoingeckoService } from "./coingecko.service";
import { BrokkrDataAggregatorConfigModule } from "../../config/brokkr-data-aggregator-config.module";
import { HttpModule } from "@nestjs/axios";
import { Logger } from "@nestjs/common";

describe("CoingeckoService", () => {
  let service: CoingeckoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BrokkrDataAggregatorConfigModule, HttpModule],
      providers: [CoingeckoService, Logger],
    }).compile();

    service = module.get<CoingeckoService>(CoingeckoService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
