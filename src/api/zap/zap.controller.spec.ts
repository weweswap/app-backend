import { Test, TestingModule } from "@nestjs/testing";
import { ZapController } from "./zap.controller";

describe("ZapController", () => {
  let controller: ZapController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZapController],
    }).compile();

    controller = module.get<ZapController>(ZapController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
