import { Test, TestingModule } from "@nestjs/testing";
import { ChaosController } from "./chaos.controller";

describe("ChaosController", () => {
  let controller: ChaosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChaosController],
    }).compile();

    controller = module.get<ChaosController>(ChaosController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
