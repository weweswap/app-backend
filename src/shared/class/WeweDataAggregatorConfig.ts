import {
  IsArray,
  IsDefined,
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  IsUrl,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { Address } from "viem";
import { MongoConfig } from "./MongoConfig";
import { KyberswapConfig } from "./KyberswapConfig";

export class ArrakisVaultConfig {
  @Transform(({ value }) => value.toLowerCase() as Address, { toClassOnly: true })
  @IsEthereumAddress()
  address: Address;

  @IsNumber()
  @Min(0)
  startingBlock: number;

  @IsString()
  @IsNotEmpty()
  token0CoingeckoName: string;

  @IsString()
  @IsNotEmpty()
  token1CoingeckoName: string;

  @Transform(({ value }) => value.toLowerCase() as Address, { toClassOnly: true })
  @IsEthereumAddress()
  feeManager: Address;

  constructor(
    address: Address,
    startingBlock: number,
    token0CoingeckoName: string,
    token1CoingeckoName: string,
    feeManager: Address,
  ) {
    this.address = address;
    this.startingBlock = startingBlock;
    this.token0CoingeckoName = token0CoingeckoName;
    this.token1CoingeckoName = token1CoingeckoName;
    this.feeManager = feeManager;
  }
}

export class TokenConfig {
  @Transform(({ value }) => value.toLowerCase() as Address, { toClassOnly: true })
  @IsEthereumAddress()
  address: Address;

  @IsString()
  @IsNotEmpty()
  coingeckoId: string;

  constructor(address: Address, coingeckoId: string) {
    this.address = address;
    this.coingeckoId = coingeckoId;
  }
}

export class MergeCoinConfig {
  @IsString()
  @IsNotEmpty()
  memeCoingeckoName: string;

  @IsNumber()
  @Min(0)
  chartStartTimestamp: number;

  constructor(memeCoingeckoName: string, chartStartTimestamp: number) {
    this.memeCoingeckoName = memeCoingeckoName;
    this.chartStartTimestamp = chartStartTimestamp;
  }
}

export class WeweConfig {
  @IsString()
  @IsNotEmpty()
  coingeckoApiKey: string;

  @IsNotEmpty()
  @IsEthereumAddress()
  @Transform(({ value }) => value as Address)
  multicallV3Address: Address;

  @IsUrl()
  @IsNotEmpty()
  nodeUrlRpc: string;

  @IsObject()
  @IsDefined()
  @Type(() => MongoConfig)
  mongoConfig: MongoConfig;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArrakisVaultConfig)
  arrakisVaults: ArrakisVaultConfig[];

  @ValidateIf((o) => o.arrakisVaults && o.arrakisVaults.length > 0)
  @IsString()
  @IsEthereumAddress()
  @Transform(({ value }) => value as Address)
  arrakisHelperAddress: Address;

  @ValidateIf((o) => o.arrakisVaults && o.arrakisVaults.length > 0)
  @IsString()
  @IsEthereumAddress({ each: true })
  arrakisResolverAddress: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeCoinConfig)
  mergeCoins: MergeCoinConfig[];

  @IsNotEmpty()
  @Transform(({ value }) => value as Address)
  privateKey: Address;

  @IsObject()
  @IsDefined()
  @Type(() => KyberswapConfig)
  kyberswapConfig: KyberswapConfig;

  constructor(
    nodeUrlRpc: string,
    mongoConfig: MongoConfig,
    arrakisVaults: ArrakisVaultConfig[],
    arrakisHelperAddress: Address,
    mergeCoins: MergeCoinConfig[],
    privateKey: Address,
    arrakisResolverAddress: string,
    kyberswapConfig: KyberswapConfig,
  ) {
    this.nodeUrlRpc = nodeUrlRpc;
    this.mongoConfig = mongoConfig;
    this.arrakisVaults = arrakisVaults;
    this.arrakisHelperAddress = arrakisHelperAddress;
    this.arrakisResolverAddress = arrakisResolverAddress;
    this.mergeCoins = mergeCoins;
    this.privateKey = privateKey;
    this.kyberswapConfig = kyberswapConfig;
  }
}
