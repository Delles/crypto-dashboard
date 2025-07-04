import { useState } from "react";
import { DashboardOverview } from "./DashboardOverview";
import { AssetCard } from "./AssetCard";
import { PlatformCard } from "./PlatformCard";
import { BinanceCard } from "./BinanceCard";
import { MultiversXCard } from "./MultiversXCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { Analytics } from "./Analytics";
import { PlusCircle, RefreshCw } from "lucide-react";
import { AddPlatformModal } from "./AddPlatformModal";
import { savePlatform } from "@/lib/store";
import type { StoredPlatform } from "@/lib/types";
import {
    usePlatformData,
    useRefreshPlatformData,
} from "@/hooks/use-platform-data";
import { useAggregatedAssets } from "@/hooks/use-aggregated-assets";
import { usePortfolioAnalytics } from "@/hooks/use-portfolio-analytics";

export const Dashboard = () => {
    const [view, setView] = useState<"asset" | "platform">("platform");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        data: platformData = [],
        isLoading,
        error,
        refetch,
    } = usePlatformData();
    const aggregatedAssets = useAggregatedAssets(platformData);
    const portfolioAnalytics = usePortfolioAnalytics(platformData);
    const refreshPlatformData = useRefreshPlatformData();

    const handleSavePlatform = (platform: StoredPlatform) => {
        savePlatform(platform);
        // Refetch data after adding new platform
        refetch();
    };

    const handleRefresh = () => {
        refreshPlatformData();
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-red-500">Failed to load platform data</p>
                <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="grid gap-8">
            <DashboardOverview
                totalAssetsValue={portfolioAnalytics.totalAssetsValue}
                totalDebtValue={portfolioAnalytics.totalDebtValue}
                netValue={portfolioAnalytics.netValue}
                isLoading={isLoading}
            />
            <div className="flex justify-between items-center">
                <Tabs
                    value={view}
                    onValueChange={(v) => setView(v as "asset" | "platform")}
                >
                    <TabsList>
                        <TabsTrigger value="asset">Group by Asset</TabsTrigger>
                        <TabsTrigger value="platform">
                            Group by Platform
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex gap-2">
                    <Button
                        onClick={handleRefresh}
                        variant="outline"
                        disabled={isLoading}
                    >
                        <RefreshCw
                            className={`mr-2 h-4 w-4 ${
                                isLoading ? "animate-spin" : ""
                            }`}
                        />
                        Refresh
                    </Button>
                    <Button variant="outline" disabled>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Asset
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Platform
                    </Button>
                </div>
            </div>

            {view === "asset" && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        // Loading skeletons
                        Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-48 bg-muted animate-pulse rounded-lg"
                            />
                        ))
                    ) : aggregatedAssets.length > 0 ? (
                        aggregatedAssets.map((asset) => (
                            <AssetCard key={asset.ticker} asset={asset} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-muted-foreground">
                                No assets found. Add a platform to get started.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {view === "platform" && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        // Loading skeletons
                        Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-48 bg-muted animate-pulse rounded-lg"
                            />
                        ))
                    ) : platformData.length > 0 ? (
                        platformData.map((platform) =>
                            platform.type === "binance" ? (
                                <BinanceCard
                                    key={platform.name}
                                    platform={platform}
                                />
                            ) : platform.type === "multiversx" ? (
                                <MultiversXCard
                                    key={platform.name}
                                    platform={platform}
                                />
                            ) : (
                                <PlatformCard
                                    key={platform.name}
                                    platform={platform}
                                />
                            )
                        )
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-muted-foreground">
                                No platforms configured. Add a platform to get
                                started.
                            </p>
                        </div>
                    )}
                </div>
            )}

            <Analytics platforms={platformData} isLoading={isLoading} />

            <AddPlatformModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSavePlatform}
            />
        </div>
    );
};
