import { Test, TestingModule } from "@nestjs/testing";
import { VaultDbService } from "./vault-db.service";
import { Logger } from "@nestjs/common";
import { MockDatabaseModule } from "../mock-database.module.spec";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";

describe("VaultDbService", () => {
  let service: VaultDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WeweConfigModule, MockDatabaseModule],
      providers: [Logger],
    }).compile();

    service = module.get<VaultDbService>(VaultDbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
