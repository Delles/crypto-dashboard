import type { Platform, PlatformHolding } from "./types";

export interface AggregatedAsset {
    name: string;
    ticker: string;
    totalAmount: number; // Net amount of the asset (spot + collateral)
    totalAssetsValue: number; // Sum of positive values (spot + collateral)
    totalDebtValue: number; // Sum of debt values (stored as a positive number)
    netValue: number; // totalAssetsValue - totalDebtValue
    price: number; // Average price of the asset itself
    portfolioPercentage: number; // Percentage of *total gross assets* of the portfolio
    holdings: (PlatformHolding & { platformName: string })[]; // All raw holdings for this asset, augmented with platform name
}

export interface PortfolioAnalytics {
    totalAssetsValue: number;
    totalDebtValue: number;
    netValue: number;
    totalAssets: number;
    totalPlatforms: number;
    assetAllocation: {
        name: string;
        ticker: string;
        value: number;
        percentage: number;
    }[];
    platformAllocation: {
        name: string;
        type: string;
        value: number;
        percentage: number;
    }[];
}

/**
 * Transforms platform-centric data into asset-centric aggregated data.
 */
export const aggregateAssetsByTicker = (
    platforms: Platform[]
): AggregatedAsset[] => {
    const assetMap = new Map<
        string,
        {
            name: string;
            ticker: string;
            totalAmount: number;
            totalAssetsValue: number;
            totalDebtValue: number;
            weightedPriceSum: number;
            holdings: (PlatformHolding & { platformName: string })[];
        }
    >();

    const totalPortfolioAssetsValue = platforms.reduce(
        (acc, p) =>
            acc +
            p.holdings.reduce(
                (sum, h) => (h.value > 0 ? sum + h.value : sum),
                0
            ),
        0
    );

    for (const platform of platforms) {
        for (const holding of platform.holdings) {
            // We group by the main asset ticker, not the debt coin ticker.
            let existing = assetMap.get(holding.ticker);

            if (!existing) {
                assetMap.set(holding.ticker, {
                    name: holding.assetName
                        .replace("(Spot)", "")
                        .replace("(Loan Collateral)", "")
                        .trim(),
                    ticker: holding.ticker,
                    totalAmount: 0,
                    totalAssetsValue: 0,
                    totalDebtValue: 0,
                    weightedPriceSum: 0,
                    holdings: [],
                });
                existing = assetMap.get(holding.ticker)!;
            }

            existing.holdings.push({ ...holding, platformName: platform.name });

            if (holding.type === "debt") {
                existing.totalDebtValue += -holding.value; // value is negative
            } else {
                existing.totalAmount += holding.amount;
                existing.totalAssetsValue += holding.value;
                existing.weightedPriceSum += holding.price * holding.amount;
            }
        }
    }

    const aggregatedAssets: AggregatedAsset[] = Array.from(
        assetMap.values()
    ).map((asset) => {
        const netValue = asset.totalAssetsValue - asset.totalDebtValue;
        const price =
            asset.totalAmount > 0
                ? asset.weightedPriceSum / asset.totalAmount
                : 0;
        const portfolioPercentage =
            totalPortfolioAssetsValue > 0
                ? (asset.totalAssetsValue / totalPortfolioAssetsValue) * 100
                : 0;

        return {
            ...asset,
            netValue,
            price,
            portfolioPercentage,
        };
    });

    return aggregatedAssets.sort((a, b) => b.netValue - a.netValue);
};

/**
 * Generates portfolio analytics data from platform data.
 */
export const generatePortfolioAnalytics = (
    platforms: Platform[]
): PortfolioAnalytics => {
    let totalAssetsValue = 0;
    let totalDebtValue = 0;

    const platformAllocationMap = new Map<
        string,
        { name: string; type: string; value: number }
    >();

    for (const platform of platforms) {
        let platformAssets = 0;
        for (const holding of platform.holdings) {
            if (holding.value > 0) {
                totalAssetsValue += holding.value;
                platformAssets += holding.value;
            } else {
                totalDebtValue += -holding.value;
            }
        }
        platformAllocationMap.set(platform.name, {
            name: platform.name,
            type: platform.type || "unknown",
            value: platformAssets,
        });
    }

    const netValue = totalAssetsValue - totalDebtValue;
    const aggregatedAssets = aggregateAssetsByTicker(platforms);

    const assetAllocation = aggregatedAssets
        .filter((asset) => asset.totalAssetsValue > 0)
        .map((asset) => ({
            name: asset.name,
            ticker: asset.ticker,
            value: asset.totalAssetsValue,
            percentage:
                totalAssetsValue > 0
                    ? (asset.totalAssetsValue / totalAssetsValue) * 100
                    : 0,
        }));

    const platformAllocation = Array.from(platformAllocationMap.values())
        .filter((p) => p.value > 0)
        .map((p) => ({
            ...p,
            percentage:
                totalAssetsValue > 0 ? (p.value / totalAssetsValue) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value);

    return {
        totalAssetsValue,
        totalDebtValue,
        netValue,
        totalAssets: aggregatedAssets.length,
        totalPlatforms: platforms.length,
        assetAllocation,
        platformAllocation,
    };
};

/**
 * Formats currency values consistently across the app.
 */
export const formatCurrency = (
    value: number,
    options?: {
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
    }
): string => {
    const sign = value < 0 ? "-" : "";
    return `${sign}$${Math.abs(value).toLocaleString(undefined, {
        minimumFractionDigits: options?.minimumFractionDigits ?? 2,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    })}`;
};

/**
 * Formats percentage values consistently across the app
 */
export const formatPercentage = (
    value: number,
    decimals: number = 1
): string => {
    return `${value.toFixed(decimals)}%`;
};

export const formatAmount = (
    amount: number,
    options: Intl.NumberFormatOptions = {}
) => {
    const defaultOptions: Intl.NumberFormatOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
        ...options,
    };
    return new Intl.NumberFormat("en-US", defaultOptions).format(amount);
};

export const formatNetValue = (value: number) => {
    const sign = value >= 0 ? "+" : "-";
    const formattedValue = Math.abs(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${sign}$${formattedValue}`;
};
