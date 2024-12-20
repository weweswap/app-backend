import "dotenv-flow/config";
import { registerAs } from "@nestjs/config";
import { ConfigUtils } from "../utils/config-utils";
import { validateUtil } from "../utils/validate-util";
import { WeweConfig } from "../shared/class/WeweDataAggregatorConfig";

// define ENV and LOG_LEVEL globally to be consumed at any time (even before app bootstrap)
export const LOG_LEVEL = ConfigUtils.loadLogLevelEnv(process.env.LOG_LEVEL);

const config: Record<string, unknown> = {
  coingeckoApiKey: process.env.COINGECKO_API_KEY,
  multicallV3Address: process.env.MULTICALL_V3_ADDRESS,
  nodeUrlRpc: process.env.NODE_URL_RPC,
  mongoConfig: JSON.parse(process.env.MONGO_CONFIG ?? ""),
  arrakisVaults: JSON.parse(process.env.ARRAKIS_VAULTS ?? ""),
  arrakisHelperAddress: process.env.ARRAKIS_HELPER_ADDRESS,
  mergeCoins: JSON.parse(process.env.MERGE_COINS ?? ""),
  privateKey: process.env.PRIVATE_KEY,
  arrakisResolverAddress: process.env.ARRAKIS_RESOLVER_ADDRESS,
  kyberswapConfig: JSON.parse(process.env.KYBERSWAP_CONFIG ?? ""),
  internalApiKey: process.env.INTERNAL_API_KEY,
  mergeContracts: JSON.parse(process.env.MERGE_CONTRACTS ?? ""),
};

export default registerAs("config", () => {
  return validateUtil(config, WeweConfig);
});
