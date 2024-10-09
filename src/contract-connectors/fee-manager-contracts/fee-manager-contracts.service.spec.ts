import { Test, TestingModule } from "@nestjs/testing";
import { FeeManagerContractsService } from "./fee-manager-contracts.service";
import { BlockchainConnectorsModule } from "../../blockchain-connectors/blockchain-connectors.module";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";

describe("FeeManagerContractsService", () => {
  let service: FeeManagerContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BlockchainConnectorsModule, WeweConfigModule],
      providers: [FeeManagerContractsService],
    }).compile();

    service = module.get<FeeManagerContractsService>(FeeManagerContractsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
