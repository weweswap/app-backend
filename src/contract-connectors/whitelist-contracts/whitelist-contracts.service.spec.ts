import { Test, TestingModule } from "@nestjs/testing";
import { WhitelistContractsService } from "./whitelist-contracts.service";
import { BlockchainConnectorsModule } from "../../blockchain-connectors/blockchain-connectors.module";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";

describe("WhitelistContractsService", () => {
  let service: WhitelistContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BlockchainConnectorsModule, WeweConfigModule],
      providers: [WhitelistContractsService],
    }).compile();

    service = module.get<WhitelistContractsService>(WhitelistContractsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
