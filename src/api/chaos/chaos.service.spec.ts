import { Test, TestingModule } from "@nestjs/testing";
import { ChaosService } from "./chaos.service";

describe("ChaosService", () => {
  let service: ChaosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChaosService],
    }).compile();

    service = module.get<ChaosService>(ChaosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
