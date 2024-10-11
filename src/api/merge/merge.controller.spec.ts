import { Test, TestingModule } from "@nestjs/testing";
import { MergeController } from "./merge.controller";

describe("MergeController", () => {
  let controller: MergeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MergeController],
    }).compile();

    controller = module.get<MergeController>(MergeController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
