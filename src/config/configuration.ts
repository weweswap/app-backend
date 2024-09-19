import "dotenv-flow/config";
import { registerAs } from "@nestjs/config";
import { EnvType } from "../shared/enum/EnvType";
import { BrokkrDataAggregatorConfig } from "../shared/class/BrokkrDataAggregatorConfig";
import { ConfigUtils } from "../utils/config-utils";
import { validateUtil } from "../utils/validate-util";

// define ENV and LOG_LEVEL globally to be consumed at any time (even before app bootstrap)
export const ENV: EnvType = ConfigUtils.loadEnvFileName(process.env.NODE_ENV);
export const LOG_LEVEL = ConfigUtils.loadLogLevelEnv(process.env.LOG_LEVEL);

const config: Record<string, unknown> = {
  env: ENV,
  coingeckoApiKey: process.env.COINGECKO_API_KEY,
  multicallV3Address: process.env.MULTICALL_V3_ADDRESS,
  nodeUrlRpc: process.env.NODE_URL_RPC,
  mongoConfig: JSON.parse(process.env.MONGO_CONFIG ?? ""),
  arrakisVaults: JSON.parse(process.env.ARRAKIS_VAULTS ?? ""),
  arrakisHelperAddress: process.env.ARRAKIS_HELPER_ADDRESS,
};

export default registerAs("config", () => {
  return validateUtil(config, BrokkrDataAggregatorConfig);
});
