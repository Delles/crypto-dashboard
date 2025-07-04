import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/data-transformers";

interface DashboardOverviewProps {
    totalAssetsValue: number;
    totalDebtValue: number;
    netValue: number;
    isLoading?: boolean;
}

export const DashboardOverview = ({
    totalAssetsValue,
    totalDebtValue,
    netValue,
    isLoading = false,
}: DashboardOverviewProps) => {
    const renderValue = (title: string, value: number, className?: string) => (
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
                <div className="h-8 w-48 bg-muted animate-pulse rounded mt-1" />
            ) : (
                <p className={`text-2xl font-bold ${className}`}>
                    {formatCurrency(value)}
                </p>
            )}
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Portfolio Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
                    {renderValue(
                        "Total Assets",
                        totalAssetsValue,
                        "text-green-500"
                    )}
                    {renderValue("Total Debt", totalDebtValue, "text-red-500")}
                    {renderValue("Net Value", netValue, "")}
                </div>
            </CardContent>
        </Card>
    );
};
