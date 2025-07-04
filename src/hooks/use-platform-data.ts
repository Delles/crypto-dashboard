import { useQuery } from "@tanstack/react-query";
import { getPlatforms } from "@/lib/store";
import { getAccountAssets } from "@/lib/multiversx-api";
import { getBinanceAccountAssets } from "@/lib/binance-api";
import type { Platform } from "@/lib/types";

const fetchAllPlatformData = async (): Promise<Platform[]> => {
    const storedPlatforms = getPlatforms();

    if (storedPlatforms.length === 0) {
        return [];
    }

    // Fetch MultiversX data
    const multiversxPlatforms = storedPlatforms.filter(
        (p) => p.type === "multiversx" && p.walletAddress
    );

    // Fetch Binance data
    const binancePlatforms = storedPlatforms.filter(
        (p) => p.type === "binance" && p.apiKey && p.apiSecret
    );

    // Execute all API calls in parallel
    const [multiversxResults, binanceResults] = await Promise.allSettled([
        Promise.all(
            multiversxPlatforms.map((p) =>
                getAccountAssets(p.walletAddress!, p.name)
            )
        ),
        Promise.all(binancePlatforms.map((p) => getBinanceAccountAssets(p))),
    ]);

    // Collect successful results
    const allData: Platform[] = [];

    if (multiversxResults.status === "fulfilled") {
        allData.push(
            ...multiversxResults.value.filter((p): p is Platform => p !== null)
        );
    }

    if (binanceResults.status === "fulfilled") {
        allData.push(
            ...binanceResults.value.filter((p): p is Platform => p !== null)
        );
    }

    // Include platforms from local storage that might not have fetching logic
    const existingPlatformNames = new Set(allData.map((p) => p.name));
    const otherPlatforms = storedPlatforms
        .filter((p) => !existingPlatformNames.has(p.name))
        .map(
            (p) =>
                ({
                    name: p.name,
                    totalValue: 0,
                    holdings: [],
                    type: p.type,
                } as Platform)
        );

    return [...allData, ...otherPlatforms];
};

export const usePlatformData = () => {
    return useQuery({
        queryKey: ["platform-data"],
        queryFn: fetchAllPlatformData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
            // Retry up to 3 times for network errors, but not for auth errors
            if (failureCount >= 3) return false;
            if (
                error?.message?.includes("401") ||
                error?.message?.includes("403")
            ) {
                return false;
            }
            return true;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
};

export const useRefreshPlatformData = () => {
    const { refetch } = usePlatformData();
    return refetch;
};
