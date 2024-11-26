import { Module } from "@nestjs/common";
import { ChaosService } from "./chaos.service";
import { ChaosController } from "./chaos.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [ChaosService],
  controllers: [ChaosController],
})
export class ChaosModule {}
