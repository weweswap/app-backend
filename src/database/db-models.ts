import { AggregationType } from "../shared/enum/AggregationType";

export class RewardsConvertedToUsdcEventMetadataDto {
  constructor(
    public vaultAddress: string,
    public feeManagerAddress: string,
    public feeInUsdc: string,
    public blockNumber: number,
    public txHash: string,
  ) {}
}

export class RewardsConvertedToUsdcEventDto {
  constructor(
    public _id: string,
    public timestamp: Date,
    public metadata: RewardsConvertedToUsdcEventMetadataDto,
  ) {}
}

export class ProgressMetadataDto {
  constructor(
    public address: string,
    public lastBlockNumber: number,
    public aggregationType: AggregationType,
  ) {}
}
