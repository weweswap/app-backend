import { getAbiItem, GetLogsReturnType } from "viem";
import { arrakisVaultAbi, feeManagerAbi, mergeContractAbi } from "../../abis/abi";

export const RewardsConvertedToUsdcAbiEvent = getAbiItem({ abi: feeManagerAbi, name: "RewardsConvertedToUsdc" });
export const LpVaultLogMintAbiEvent = getAbiItem({ abi: arrakisVaultAbi, name: "LogMint" });
export const LpVaultLogBurnAbiEvent = getAbiItem({ abi: arrakisVaultAbi, name: "LogBurn" });
export const MergeContractMergedEvent = getAbiItem({ abi: mergeContractAbi, name: "Merged" });

export type SingleLogEvent =
  | GetLogsReturnType<typeof RewardsConvertedToUsdcAbiEvent>[number]
  | GetLogsReturnType<typeof LpVaultLogMintAbiEvent>[number]
  | GetLogsReturnType<typeof LpVaultLogBurnAbiEvent>[number]
  | GetLogsReturnType<typeof MergeContractMergedEvent>[number];

export function isRewardsConvertedToUsdcEvent(
  log: SingleLogEvent,
): log is GetLogsReturnType<typeof RewardsConvertedToUsdcAbiEvent>[number] {
  return typeof log === "object" && log !== null && log.eventName == "RewardsConvertedToUsdc";
}

export function isLpVaultLogBurnEvent(
  log: SingleLogEvent,
): log is GetLogsReturnType<typeof LpVaultLogBurnAbiEvent>[number] {
  return typeof log === "object" && log !== null && log.eventName == "LogBurn";
}

export function isLpVaultLogMintEvent(
  log: SingleLogEvent,
): log is GetLogsReturnType<typeof LpVaultLogMintAbiEvent>[number] {
  return typeof log === "object" && log !== null && log.eventName == "LogMint";
}

export function isMergeEvent(log: SingleLogEvent): log is GetLogsReturnType<typeof MergeContractMergedEvent>[number] {
  return typeof log === "object" && log !== null && log.eventName == "Merged";
}
