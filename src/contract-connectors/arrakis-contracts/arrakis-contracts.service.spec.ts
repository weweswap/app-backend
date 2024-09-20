import { Test, TestingModule } from "@nestjs/testing";
import { ArrakisContractsService } from "./arrakis-contracts.service";
import { BlockchainConnectorsModule } from "../../blockchain-connectors/blockchain-connectors.module";
import { PriceOraclesModule } from "../../price-oracles/price-oracles.module";
import { Logger } from "@nestjs/common";
import { Erc20Service } from "../../blockchain-connectors/erc-20/erc-20.service";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";

describe("ArrakisVaultContractService", () => {
  let service: ArrakisContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BlockchainConnectorsModule, WeweConfigModule, PriceOraclesModule],
      providers: [Logger, ArrakisContractsService, Erc20Service],
    }).compile();

    service = module.get<ArrakisContractsService>(ArrakisContractsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
