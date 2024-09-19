import SortedSet from "collections/sorted-set";
import { AxiosResponse } from "axios";
import { IPriceEntity } from "../shared/interface/IPriceEntity";
import { createPriceEntitySortedSet } from "./collections-utils";
import { ICoingeckoDataResponse } from "../shared/interface/ICoingeckoData";
import { timeDiffIsLessThan } from "./time-utils";
import { MILLISECONDS_PER_DAY } from "../shared/constants";
import { findClosestPriceEntityOlderOrEqThan, findClosestPriceEntityYoungerOrEqThan } from "./aggregation-utils";

/**
 * @description Try to get token price of the nearest timestamp gt or eq than given timestamp from cache
 * @param timestampMs - timestamp in milliseconds for which we are looking to find price for
 * @param cache - Price cache
 */
export function getHourlyTokenPriceFromCache(
  timestampMs: number,
  cache?: SortedSet.SortedSet<IPriceEntity>,
  maxTimeDiff = MILLISECONDS_PER_DAY,
): string | undefined {
  if (cache == undefined) return undefined;

  const priceEntityOlderOrEqual = findClosestPriceEntityOlderOrEqThan(timestampMs, cache);
  const priceEntityYoungerOrEqual = findClosestPriceEntityYoungerOrEqThan(timestampMs, cache);

  // make sure price entity is not more than hour and half away
  if (priceEntityOlderOrEqual && timeDiffIsLessThan(priceEntityOlderOrEqual.timestampMs, timestampMs, maxTimeDiff)) {
    return priceEntityOlderOrEqual.tokenPrice;
  } else if (
    priceEntityYoungerOrEqual &&
    timeDiffIsLessThan(priceEntityYoungerOrEqual.timestampMs, timestampMs, maxTimeDiff)
  ) {
    return priceEntityYoungerOrEqual.tokenPrice;
  } else {
    return undefined;
  }
}

export function toPriceEntities(coingeckoDataResponse: ICoingeckoDataResponse): IPriceEntity[] {
  return coingeckoDataResponse.prices.map((pricePoint) => {
    return {
      timestampMs: pricePoint[0],
      tokenPrice: pricePoint[1].toString(),
    };
  });
}

export function savePriceEntitiesInCache(
  priceEntities: IPriceEntity[],
  cache: SortedSet.SortedSet<IPriceEntity>,
): void {
  priceEntities.forEach((v) => cache.add(v));
}

export function cacheCoingeckoResponse(
  coinId: string,
  res: AxiosResponse<ICoingeckoDataResponse>,
  cache: Map<string, SortedSet.SortedSet<IPriceEntity>>,
): void {
  // make sure sorted set is initialized for given coin id
  if (cache.get(coinId) == undefined) {
    cache.set(coinId, createPriceEntitySortedSet());
  }

  savePriceEntitiesInCache(toPriceEntities(res.data), cache.get(coinId)!);
}
