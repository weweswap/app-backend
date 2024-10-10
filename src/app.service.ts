import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { AggregatorsService } from "./aggregators/aggregators.service";

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  constructor(private aggregatorsService: AggregatorsService) {
    this.logger.log("AppService constructor...");
  }

  async onApplicationBootstrap(): Promise<any> {
    // application has bootstraped, start all aggregators
    await this.startAllAggregators();
  }

  private async startAllAggregators(): Promise<void> {
    this.logger.log("Starting all aggregations...");
    await this.aggregatorsService.startAllAggregators();
  }
  getHello(): string {
    return "Hello World!";
  }
}
