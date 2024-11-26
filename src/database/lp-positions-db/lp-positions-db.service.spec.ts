import { Test, TestingModule } from "@nestjs/testing";
import { MockDatabaseModule } from "../mock-database.module.spec";
import { Logger } from "@nestjs/common";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";
import { LpPositionDbService } from "./lp-positions-db.service";

describe("LpPositionDbService", () => {
  let service: LpPositionDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WeweConfigModule, MockDatabaseModule],
      providers: [Logger],
    }).compile();

    service = module.get<LpPositionDbService>(LpPositionDbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
