import { Test, TestingModule } from "@nestjs/testing";
import { MergeService } from "./merge.service";

describe("MergeService", () => {
  let service: MergeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MergeService],
    }).compile();

    service = module.get<MergeService>(MergeService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
