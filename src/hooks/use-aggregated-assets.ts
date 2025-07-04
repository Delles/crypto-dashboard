import { useMemo } from "react";
import type { Platform } from "@/lib/types";
import {
    aggregateAssetsByTicker,
    type AggregatedAsset,
} from "@/lib/data-transformers";

export const useAggregatedAssets = (
    platforms: Platform[]
): AggregatedAsset[] => {
    return useMemo(() => {
        if (!platforms || platforms.length === 0) {
            return [];
        }

        return aggregateAssetsByTicker(platforms);
    }, [platforms]);
};

export const useAssetByTicker = (
    platforms: Platform[],
    ticker: string
): AggregatedAsset | undefined => {
    const aggregatedAssets = useAggregatedAssets(platforms);

    return useMemo(() => {
        return aggregatedAssets.find((asset) => asset.ticker === ticker);
    }, [aggregatedAssets, ticker]);
};
