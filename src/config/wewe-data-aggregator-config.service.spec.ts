import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import configuration from "./configuration";
import { Logger } from "@nestjs/common";
import { WeweConfigService } from "./wewe-data-aggregator-config.service";

describe("WeweConfigService", () => {
  let service: WeweConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          cache: true,
          isGlobal: true,
          load: [configuration],
        }),
      ],
      providers: [WeweConfigService, Logger],
    }).compile();

    service = module.get<WeweConfigService>(WeweConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
