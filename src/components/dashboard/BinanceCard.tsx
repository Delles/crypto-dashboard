import type { Platform, PlatformHolding } from "@/lib/types";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
    formatAmount,
    formatCurrency,
    formatPercentage,
} from "@/lib/data-transformers";
import { PlatformCardBase } from "./PlatformCardBase";

interface BinanceCardProps {
    platform: Platform;
}

interface AssetGroup {
    ticker: string;
    spotAmount?: number;
    spotValue?: number;
    spotPrice?: number;
    collateralAmount?: number;
    collateralValue?: number;
    collateralPrice?: number;
    debtAmount?: number;
    debtValue?: number;
    loanInfo?: {
        ltv: number;
        loanCoin: string;
        debt: number;
        marginCallPrice: number;
        liquidationPrice: number;
    };
    netValue: number;
}

export const BinanceCard = ({ platform }: BinanceCardProps) => {
    const assetGroups = new Map<string, AssetGroup>();

    // Group assets by their type
    for (const holding of platform.holdings) {
        // For debts, we group by the debt coin's ticker (e.g., USDT)
        // For assets, we group by the asset's own ticker.
        const ticker =
            holding.type === "debt" ? holding.ticker : holding.ticker;

        const group = assetGroups.get(ticker) || {
            ticker,
            netValue: 0,
        };

        switch (holding.type) {
            case "spot":
                group.spotAmount = (group.spotAmount || 0) + holding.amount;
                group.spotValue = (group.spotValue || 0) + holding.value;
                group.spotPrice = holding.price; // Assumes price is consistent for the asset
                group.netValue += holding.value;
                break;
            case "collateral":
                group.collateralAmount =
                    (group.collateralAmount || 0) + holding.amount;
                group.collateralValue =
                    (group.collateralValue || 0) + holding.value;
                group.collateralPrice = holding.price;
                group.loanInfo = holding.loanInfo;
                group.netValue += holding.value;
                break;
            case "debt":
                group.debtAmount = (group.debtAmount || 0) + holding.amount;
                group.debtValue = (group.debtValue || 0) + holding.value; // value is negative
                group.netValue += holding.value;
                break;
        }

        assetGroups.set(ticker, group);
    }

    const sortedAssets = Array.from(assetGroups.values()).sort(
        (a, b) => Math.abs(b.netValue) - Math.abs(a.netValue)
    );

    return (
        <PlatformCardBase platform={platform}>
            <Accordion type="multiple" className="w-full">
                {sortedAssets.map((asset) => {
                    const hasSpot = asset.spotAmount && asset.spotAmount > 0;
                    const hasCollateral =
                        asset.collateralAmount && asset.collateralAmount > 0;
                    const hasDebt = asset.debtAmount && asset.debtAmount > 0;

                    return (
                        <AccordionItem key={asset.ticker} value={asset.ticker}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex justify-between items-center w-full mr-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {asset.ticker}
                                        </span>
                                    </div>
                                    <div
                                        className={cn(
                                            "font-bold",
                                            asset.netValue >= 0
                                                ? "text-green-600"
                                                : "text-red-600"
                                        )}
                                    >
                                        {asset.netValue >= 0 ? "+" : ""}$
                                        {asset.netValue.toLocaleString(
                                            undefined,
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2">
                                    {hasSpot && (
                                        <HoldingDetail
                                            title="Spot"
                                            amount={asset.spotAmount!}
                                            price={asset.spotPrice!}
                                            value={asset.spotValue!}
                                            type="spot"
                                        />
                                    )}

                                    {hasCollateral && (
                                        <HoldingDetail
                                            title="Collateral"
                                            amount={asset.collateralAmount!}
                                            price={asset.collateralPrice!}
                                            value={asset.collateralValue!}
                                            type="collateral"
                                            loanInfo={asset.loanInfo}
                                        />
                                    )}

                                    {hasDebt && (
                                        <HoldingDetail
                                            title="Debt"
                                            amount={asset.debtAmount!}
                                            price={1} // Price for debt is 1:1
                                            value={asset.debtValue!}
                                            type="debt"
                                        />
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </PlatformCardBase>
    );
};

// A new sub-component to render holding details consistently
interface HoldingDetailProps {
    title: string;
    amount: number;
    price: number;
    value: number;
    type: "spot" | "collateral" | "debt";
    loanInfo?: PlatformHolding["loanInfo"];
}

const typeStyles = {
    spot: {
        bg: "bg-blue-50 dark:bg-blue-950/20",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800",
    },
    collateral: {
        bg: "bg-orange-50 dark:bg-orange-950/20",
        text: "text-orange-700 dark:text-orange-300",
        border: "border-orange-200 dark:border-orange-800",
    },
    debt: {
        bg: "bg-red-50 dark:bg-red-950/20",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-800",
    },
};

const HoldingDetail = ({
    title,
    amount,
    price,
    value,
    type,
    loanInfo,
}: HoldingDetailProps) => {
    const styles = typeStyles[type];

    const ltv = loanInfo?.ltv;
    const ltvColor =
        ltv && ltv >= 0.91
            ? "text-red-500"
            : ltv && ltv >= 0.85
            ? "text-yellow-500"
            : "text-green-500";

    return (
        <div className={cn("p-3 rounded-lg", styles.bg)}>
            <h4 className={cn("font-semibold mb-2", styles.text)}>{title}</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                    <span className="text-muted-foreground">Amount</span>
                    <div className="font-mono">{formatAmount(amount)}</div>
                </div>
                <div>
                    <span className="text-muted-foreground">Price</span>
                    <div className="font-mono">
                        {formatCurrency(price, { maximumFractionDigits: 5 })}
                    </div>
                </div>
                <div>
                    <span className="text-muted-foreground">Value</span>
                    <div className="font-mono font-semibold">
                        {formatCurrency(value)}
                    </div>
                </div>
            </div>

            {type === "collateral" && loanInfo && (
                <div className={cn("border-t pt-3 mt-3", styles.border)}>
                    <h5 className="font-medium mb-2">Risk Metrics</h5>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                        <div>
                            <span className="text-muted-foreground">
                                Current LTV
                            </span>
                            <div className={cn("font-semibold", ltvColor)}>
                                {formatPercentage(loanInfo.ltv * 100)}
                            </div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Margin Call
                            </span>
                            <div className="font-semibold">
                                {formatCurrency(loanInfo.marginCallPrice, {
                                    maximumFractionDigits: 5,
                                })}
                            </div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Liquidation
                            </span>
                            <div className="font-semibold">
                                {formatCurrency(loanInfo.liquidationPrice, {
                                    maximumFractionDigits: 5,
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
