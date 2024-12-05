import { Test, TestingModule } from "@nestjs/testing";
import { BlockchainConnectorsModule } from "../../blockchain-connectors/blockchain-connectors.module";
import { PriceOraclesModule } from "../../price-oracles/price-oracles.module";
import { Logger } from "@nestjs/common";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";
import { Erc20Service } from "../erc-20/erc-20.service";
import { MergeContractsService } from "./merge-contracts.service";

describe("MergeContractService", () => {
  let service: MergeContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BlockchainConnectorsModule, WeweConfigModule, PriceOraclesModule],
      providers: [Logger, MergeContractsService, Erc20Service],
    }).compile();

    service = module.get<MergeContractsService>(MergeContractsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
