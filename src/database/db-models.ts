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
