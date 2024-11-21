import { Test, TestingModule } from "@nestjs/testing";
import { MockDatabaseModule } from "../mock-database.module.spec";
import { Logger } from "@nestjs/common";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";
import { LpOperationsDbService } from "./lp-operations-db.service";

describe("LpOperationsDbService", () => {
  let service: LpOperationsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WeweConfigModule, MockDatabaseModule],
      providers: [Logger],
    }).compile();

    service = module.get<LpOperationsDbService>(LpOperationsDbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
