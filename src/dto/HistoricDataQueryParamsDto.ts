import { IsEnum } from "class-validator";

export enum TimeFrame {
  Daily = "daily",
  Weekly = "weekly",
}

export class HistoricDataQueryParamsDto {
  @IsEnum(TimeFrame)
  timeframe: TimeFrame;
}
