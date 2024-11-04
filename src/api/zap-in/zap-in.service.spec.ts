import { Test, TestingModule } from "@nestjs/testing";
import { ZapInService } from "./zap-in.service";

describe("ZapInService", () => {
  let service: ZapInService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZapInService],
    }).compile();

    service = module.get<ZapInService>(ZapInService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
