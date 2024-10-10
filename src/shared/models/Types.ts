import { getAbiItem, GetLogsReturnType } from "viem";
import { feeManagerAbi } from "../../abis/abi";

export const RewardsConvertedToUsdcAbiEvent = getAbiItem({ abi: feeManagerAbi, name: "RewardsConvertedToUsdc" });

export type SingleLogEvent = GetLogsReturnType<typeof RewardsConvertedToUsdcAbiEvent>[number];

export function isRewardsConvertedToUsdcEvent(
  log: SingleLogEvent,
): log is GetLogsReturnType<typeof RewardsConvertedToUsdcAbiEvent>[number] {
  return typeof log === "object" && log !== null && log.eventName == "RewardsConvertedToUsdc";
}
