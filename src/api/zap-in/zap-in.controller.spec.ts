import { Test, TestingModule } from "@nestjs/testing";
import { ZapInController } from "./zap-in.controller";

describe("ZapInController", () => {
  let controller: ZapInController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZapInController],
    }).compile();

    controller = module.get<ZapInController>(ZapInController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
