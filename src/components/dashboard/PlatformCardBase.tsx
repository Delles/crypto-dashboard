import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/types";
import { formatCurrency } from "@/lib/data-transformers";

interface PlatformCardBaseProps {
    platform: Platform;
    children: React.ReactNode;
    platformIcon?: React.ReactNode;
    subtitle?: string;
}

export const PlatformCardBase = ({
    platform,
    children,
    platformIcon,
    subtitle,
}: PlatformCardBaseProps) => {
    const totalAssetsValue = platform.holdings.reduce(
        (sum, h) => (h.value > 0 ? sum + h.value : sum),
        0
    );
    const totalDebtValue = platform.holdings.reduce(
        (sum, h) => (h.value < 0 ? sum + h.value : sum),
        0
    );
    const totalNetValue = totalAssetsValue + totalDebtValue;

    return (
        <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
                <CardTitle className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            {platformIcon}
                            <span className="text-2xl">{platform.name}</span>
                        </div>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                            Net Value
                        </p>
                        <div
                            className={cn(
                                "text-2xl font-bold",
                                totalNetValue >= 0
                                    ? "text-primary"
                                    : "text-red-500"
                            )}
                        >
                            {formatCurrency(totalNetValue)}
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between text-sm mb-4">
                    <div className="text-green-500">
                        <span className="text-muted-foreground">Assets: </span>
                        {formatCurrency(totalAssetsValue)}
                    </div>
                    <div className="text-red-500">
                        <span className="text-muted-foreground">Debt: </span>
                        {formatCurrency(Math.abs(totalDebtValue))}
                    </div>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>
                            Show Holdings ({platform.holdings.length})
                        </AccordionTrigger>
                        <AccordionContent>{children}</AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
};
