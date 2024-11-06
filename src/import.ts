import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";
import { ImportService } from "./database/importWhitelist.service";

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger("ImportBootstrap");

  try {
    logger.log("Starting import service...");
    const importService = appContext.get(ImportService);
    await importService.importAllData();
    logger.log("Data import completed successfully.");
  } catch (error) {
    logger.error("Data import failed:", error);
  } finally {
    await appContext.close();
    process.exit(0);
  }
}

bootstrap();
