import { Test, TestingModule } from "@nestjs/testing";
import { MockDatabaseModule } from "../mock-database.module.spec";
import { Logger } from "@nestjs/common";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";
import { MergeOperationsDbService } from "./merge-operations-db.service";

describe("MergeOperationsDbService", () => {
  let service: MergeOperationsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WeweConfigModule, MockDatabaseModule],
      providers: [Logger],
    }).compile();

    service = module.get<MergeOperationsDbService>(MergeOperationsDbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
