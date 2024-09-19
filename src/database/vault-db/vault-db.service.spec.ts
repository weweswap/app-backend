import { Test, TestingModule } from "@nestjs/testing";
import { VaultDbService } from "./vault-db.service";
import { BrokkrDataAggregatorConfigModule } from "../../config/brokkr-data-aggregator-config.module";
import { Logger } from "@nestjs/common";
import { MockDatabaseModule } from "../mock-database.module.spec";

describe("VaultDbService", () => {
  let service: VaultDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BrokkrDataAggregatorConfigModule, MockDatabaseModule],
      providers: [Logger],
    }).compile();

    service = module.get<VaultDbService>(VaultDbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
