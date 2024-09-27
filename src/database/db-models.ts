import { AggregationType } from "../shared/enum/AggregationType";

export class CollectedVaultFeeEventMetadataDto {
  constructor(
    public vaultAddress: string,
    public fee0: string,
    public fee1: string,
    public blockNumber: number,
    public txHash: string,
  ) {}
}

export class CollectedVaultFeeEventDto {
  constructor(
    public _id: string,
    public timestamp: Date,
    public metadata: CollectedVaultFeeEventMetadataDto,
  ) {}
}

export class ProgressMetadataDto {
  constructor(
    public address: string,
    public lastBlockNumber: number,
    public aggregationType: AggregationType,
  ) {}
}
