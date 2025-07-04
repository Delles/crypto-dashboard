import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/types";
import {
    formatAmount,
    formatCurrency,
    formatNetValue,
} from "@/lib/data-transformers";
import { PlatformCardBase } from "./PlatformCardBase";

interface MultiversXCardProps {
    platform: Platform;
}

interface AssetGroup {
    ticker: string;
    assetName: string;
    freeAmount: number;
    freeValue: number;
    price: number;
    netValue: number;
}

export const MultiversXCard = ({ platform }: MultiversXCardProps) => {
    // Group holdings by asset ticker (currently all are "Free" holdings)
    const assetGroups = new Map<string, AssetGroup>();

    for (const holding of platform.holdings) {
        const ticker = holding.ticker;
        const group: AssetGroup = {
            ticker,
            assetName: holding.assetName,
            freeAmount: holding.amount,
            freeValue: holding.value,
            price: holding.price,
            netValue: holding.value,
        };

        assetGroups.set(ticker, group);
    }

    const sortedAssets = Array.from(assetGroups.values()).sort(
        (a, b) => Math.abs(b.netValue) - Math.abs(a.netValue)
    );

    return (
        <PlatformCardBase platform={platform} subtitle="MultiversX">
            <div className="max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <Accordion type="multiple" className="w-full">
                    {sortedAssets.map((asset) => {
                        const hasFree =
                            asset.freeAmount && asset.freeAmount > 0;

                        return (
                            <AccordionItem
                                key={asset.ticker}
                                value={asset.ticker}
                            >
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
                                            {formatNetValue(asset.netValue)}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4">
                                        {hasFree && (
                                            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                                                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                                    Free
                                                </h4>
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            Amount:
                                                        </span>
                                                        <div className="font-medium">
                                                            {formatAmount(
                                                                asset.freeAmount
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            Price:
                                                        </span>
                                                        <div className="font-medium">
                                                            {formatCurrency(
                                                                asset.price,
                                                                {
                                                                    maximumFractionDigits: 5,
                                                                }
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            Value:
                                                        </span>
                                                        <div className="font-medium text-green-600">
                                                            {formatCurrency(
                                                                asset.freeValue
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
        </PlatformCardBase>
    );
};
