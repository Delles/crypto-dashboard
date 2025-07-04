import { useMemo } from "react";
import type { Platform } from "@/lib/types";
import {
    generatePortfolioAnalytics,
    type PortfolioAnalytics,
} from "@/lib/data-transformers";

export const usePortfolioAnalytics = (
    platforms: Platform[]
): PortfolioAnalytics => {
    return useMemo(() => {
        if (!platforms || platforms.length === 0) {
            return {
                totalAssetsValue: 0,
                totalDebtValue: 0,
                netValue: 0,
                totalAssets: 0,
                totalPlatforms: 0,
                assetAllocation: [],
                platformAllocation: [],
            };
        }

        return generatePortfolioAnalytics(platforms);
    }, [platforms]);
};

export const useAssetAllocationData = (platforms: Platform[]) => {
    const analytics = usePortfolioAnalytics(platforms);

    return useMemo(() => {
        // Filter only positive values and sort by value
        const positiveAssets = analytics.assetAllocation
            .filter((asset) => asset.value > 0)
            .sort((a, b) => b.value - a.value);

        if (positiveAssets.length <= 5) {
            // If 5 or fewer assets, show all
            return positiveAssets.map((asset) => ({
                name: `${asset.name} (${asset.ticker})`,
                value: asset.value,
                percentage: asset.percentage,
            }));
        }

        // Take top 5 and group the rest as "Others"
        const top5Assets = positiveAssets.slice(0, 5);
        const otherAssets = positiveAssets.slice(5);

        const othersValue = otherAssets.reduce(
            (sum, asset) => sum + asset.value,
            0
        );
        const othersPercentage = otherAssets.reduce(
            (sum, asset) => sum + asset.percentage,
            0
        );

        const result = [
            ...top5Assets.map((asset) => ({
                name: `${asset.name} (${asset.ticker})`,
                value: asset.value,
                percentage: asset.percentage,
            })),
        ];

        // Only add "Others" if there are remaining assets
        if (othersValue > 0) {
            result.push({
                name: `Others (${otherAssets.length} assets)`,
                value: othersValue,
                percentage: othersPercentage,
            });
        }

        return result;
    }, [analytics.assetAllocation]);
};

export const usePlatformAllocationData = (platforms: Platform[]) => {
    const analytics = usePortfolioAnalytics(platforms);

    return useMemo(() => {
        // Filter only positive values
        return analytics.platformAllocation
            .filter((platform) => platform.value > 0)
            .map((platform) => ({
                name: platform.name,
                type: platform.type,
                value: platform.value,
                percentage: platform.percentage,
            }));
    }, [analytics.platformAllocation]);
};
