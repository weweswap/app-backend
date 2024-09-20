import { Test, TestingModule } from "@nestjs/testing";
import { EvmConnectorService } from "./evm-connector.service";
import { Logger } from "@nestjs/common";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";

describe("EvmConnectorService", () => {
  let service: EvmConnectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WeweConfigModule],
      providers: [EvmConnectorService, Logger],
    }).compile();

    service = module.get<EvmConnectorService>(EvmConnectorService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
