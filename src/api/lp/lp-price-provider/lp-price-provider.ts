import { MemoizeExpiring } from "typescript-memoize";
import { FIVE_MINUTES_IN_MILLISECONDS } from "../../../shared/constants";
import { CoingeckoService } from "../../../price-oracles/coingecko/coingecko.service";
import { ArrakisVaultConfig } from "../../../shared/class/WeweDataAggregatorConfig";

export class LpPriceProvider {
  private readonly token0CoingeckoName;
  private readonly token1CoingeckoName;

  constructor(
    private readonly coingeckoService: CoingeckoService,
    private readonly lpStrategyConfig: ArrakisVaultConfig,
  ) {
    this.token0CoingeckoName = this.lpStrategyConfig.token0CoingeckoName;
    this.token1CoingeckoName = this.lpStrategyConfig.token1CoingeckoName;
  }

  @MemoizeExpiring(FIVE_MINUTES_IN_MILLISECONDS)
  public async getToken0Price(): Promise<string> {
    return await this.coingeckoService.getTokenUsdPrice(this.token0CoingeckoName, Date.now());
  }

  @MemoizeExpiring(FIVE_MINUTES_IN_MILLISECONDS)
  public async getToken1Price(): Promise<string> {
    return await this.coingeckoService.getTokenUsdPrice(this.token1CoingeckoName, Date.now());
  }
}
