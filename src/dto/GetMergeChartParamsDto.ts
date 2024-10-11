import { ApiProperty } from "@nestjs/swagger";

export class GetMergeChartParamsDto {
  @ApiProperty({
    description: "Name of the merge coin",
    example: "brokkr",
  })
  coinId: string;
}
