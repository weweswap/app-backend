import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { MockDatabaseModule } from "../mock-database.module.spec";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";
import { RewardsConvertedToUsdcDbService } from "./rewards-usdc-db.service";

describe("RewardsConvertedToUsdcDbService", () => {
  let service: RewardsConvertedToUsdcDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WeweConfigModule, MockDatabaseModule],
      providers: [Logger],
    }).compile();

    service = module.get<RewardsConvertedToUsdcDbService>(RewardsConvertedToUsdcDbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
