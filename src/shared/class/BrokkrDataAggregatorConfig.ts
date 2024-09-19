import {
  IsArray,
  IsDefined,
  IsEnum,
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
import { EnvType } from "../enum/EnvType";
import { Address } from "viem";
import { MongoConfig } from "./MongoConfig";

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

  constructor(address: Address, startingBlock: number, token0CoingeckoName: string, token1CoingeckoName: string) {
    this.address = address;
    this.startingBlock = startingBlock;
    this.token0CoingeckoName = token0CoingeckoName;
    this.token1CoingeckoName = token1CoingeckoName;
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

export class BrokkrDataAggregatorConfig {
  @IsEnum(EnvType)
  env: EnvType;

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
  @IsEthereumAddress({ each: true })
  arrakisHelperAddress: string;

  constructor(
    env: EnvType,
    nodeUrlRpc: string,
    mongoConfig: MongoConfig,
    arrakisVaults: ArrakisVaultConfig[],
    arrakisHelperAddress: string,
  ) {
    this.nodeUrlRpc = nodeUrlRpc;
    this.mongoConfig = mongoConfig;
    this.arrakisVaults = arrakisVaults;
    this.arrakisHelperAddress = arrakisHelperAddress;
  }
}
