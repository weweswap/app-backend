import { Test, TestingModule } from "@nestjs/testing";
import { BrokkrDataAggregatorConfigService } from "./brokkr-data-aggregator-config.service";
import { ConfigModule } from "@nestjs/config";
import configuration from "./configuration";
import { Logger } from "@nestjs/common";

describe("BrokkrDataAggregatorConfigService", () => {
  let service: BrokkrDataAggregatorConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          cache: true,
          isGlobal: true,
          load: [configuration],
        }),
      ],
      providers: [BrokkrDataAggregatorConfigService, Logger],
    }).compile();

    service = module.get<BrokkrDataAggregatorConfigService>(BrokkrDataAggregatorConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
