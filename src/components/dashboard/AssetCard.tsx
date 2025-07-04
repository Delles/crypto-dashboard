import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AggregatedAsset } from "@/lib/data-transformers";
import {
    formatAmount,
    formatCurrency,
    formatNetValue,
    formatPercentage,
} from "@/lib/data-transformers";
import type { PlatformHolding } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AssetCardProps {
    asset: AggregatedAsset;
}

interface HoldingsByPlatform {
    platformName: string;
    holdings: PlatformHolding[];
}

export const AssetCard = ({ asset }: AssetCardProps) => {
    const holdingsByPlatform = asset.holdings.reduce((acc, holding) => {
        const platformName = holding.platformName;
        if (!acc[platformName]) {
            acc[platformName] = [];
        }
        acc[platformName].push(holding);
        return acc;
    }, {} as Record<string, PlatformHolding[]>);

    const groupedHoldings: HoldingsByPlatform[] = Object.entries(
        holdingsByPlatform
    ).map(([platformName, holdings]) => ({
        platformName,
        holdings,
    }));

    return (
        <Card className="transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col">
            <CardHeader>
                <CardTitle className="flex justify-between items-start">
                    <div>
                        <span className="text-2xl">{asset.name}</span>
                        <span className="text-lg text-muted-foreground ml-2">
                            {asset.ticker}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                            Net Value
                        </p>
                        <div
                            className={cn(
                                "text-2xl font-bold",
                                asset.netValue >= 0
                                    ? "text-primary"
                                    : "text-red-500"
                            )}
                        >
                            {formatCurrency(asset.netValue)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatPercentage(asset.portfolioPercentage)} of
                            portfolio assets
                        </p>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="flex justify-between text-sm mb-4">
                    <div className="text-green-500">
                        <span className="text-muted-foreground">Assets: </span>
                        {formatCurrency(asset.totalAssetsValue)}
                    </div>
                    <div className="text-red-500">
                        <span className="text-muted-foreground">Debt: </span>
                        {formatCurrency(asset.totalDebtValue)}
                    </div>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>
                            View Details ({asset.holdings.length})
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                <Accordion type="multiple" className="w-full">
                                    {groupedHoldings.map(
                                        ({ platformName, holdings }) => {
                                            const netValue = holdings.reduce(
                                                (sum, h) => sum + h.value,
                                                0
                                            );

                                            return (
                                                <AccordionItem
                                                    key={platformName}
                                                    value={platformName}
                                                >
                                                    <AccordionTrigger className="hover:no-underline">
                                                        <div className="flex justify-between items-center w-full mr-4">
                                                            <span className="font-medium">
                                                                {platformName}
                                                            </span>
                                                            <div
                                                                className={cn(
                                                                    "font-bold",
                                                                    netValue >=
                                                                        0
                                                                        ? "text-green-600"
                                                                        : "text-red-600"
                                                                )}
                                                            >
                                                                {formatNetValue(
                                                                    netValue
                                                                )}
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        {holdings.map(
                                                            (h, i) => (
                                                                <HoldingDetails
                                                                    key={i}
                                                                    holding={h}
                                                                />
                                                            )
                                                        )}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            );
                                        }
                                    )}
                                </Accordion>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
};

const typeColors = {
    spot: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300",
    collateral:
        "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300",
    debt: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300",
};

const HoldingDetails = ({ holding }: { holding: PlatformHolding }) => {
    const colorClass = typeColors[holding.type];

    const ltv = holding.loanInfo?.ltv;
    const ltvColor =
        ltv && ltv >= 0.91
            ? "text-red-500"
            : ltv && ltv >= 0.85
            ? "text-yellow-500"
            : "text-green-500";

    return (
        <div className={cn("p-3 rounded-lg mb-2", colorClass)}>
            <h4 className="font-semibold mb-2 capitalize">{holding.type}</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                    <span className="text-muted-foreground">Amount</span>
                    <div className="font-mono">
                        {formatAmount(holding.amount)}
                    </div>
                </div>
                <div>
                    <span className="text-muted-foreground">Price</span>
                    <div className="font-mono">
                        {formatCurrency(holding.price, {
                            maximumFractionDigits: 5,
                        })}
                    </div>
                </div>
                <div>
                    <span className="text-muted-foreground">Value</span>
                    <div className="font-mono font-semibold">
                        {formatCurrency(holding.value)}
                    </div>
                </div>
            </div>

            {holding.type === "collateral" && holding.loanInfo && (
                <div className="border-t border-orange-200 dark:border-orange-800 pt-3 mt-3">
                    <h5 className="font-medium mb-2">Risk Metrics</h5>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                            <span className="text-muted-foreground">
                                Current LTV
                            </span>
                            <div className={cn("font-semibold", ltvColor)}>
                                {formatPercentage(holding.loanInfo.ltv * 100)}
                            </div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Margin Call
                            </span>
                            <div className="font-semibold">
                                {formatCurrency(
                                    holding.loanInfo.marginCallPrice,
                                    { maximumFractionDigits: 5 }
                                )}
                            </div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Liquidation
                            </span>
                            <div className="font-semibold">
                                {formatCurrency(
                                    holding.loanInfo.liquidationPrice,
                                    { maximumFractionDigits: 5 }
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
