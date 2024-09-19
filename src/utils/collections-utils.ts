import { SortedSet as SortedSetType } from "collections/sorted-set";
import SortedSet from "collections/sorted-set";
import { IPriceEntity } from "../shared/interface/IPriceEntity";

export function createPriceEntitySortedSet(): SortedSetType<IPriceEntity> {
  return new SortedSet<IPriceEntity>(
    [],
    function (a, b) {
      // The same timestamp - the same entry
      return a.timestampMs == b.timestampMs;
    },
    function (a, b) {
      // highest timestamp (the newest entity) goes last
      return a.timestampMs - b.timestampMs;
    },
  );
}
