import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Platform } from "@/lib/types";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from "recharts";
import {
    useAssetAllocationData,
    usePlatformAllocationData,
} from "@/hooks/use-portfolio-analytics";
import { formatCurrency } from "@/lib/data-transformers";

interface AnalyticsProps {
    platforms: Platform[];
    isLoading?: boolean;
}

const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FFC658",
    "#FF7C7C",
];

export const Analytics = ({ platforms, isLoading = false }: AnalyticsProps) => {
    const assetAllocationData = useAssetAllocationData(platforms);
    const platformAllocationData = usePlatformAllocationData(platforms);

    if (isLoading) {
        return (
            <div className="grid md:grid-cols-2 gap-8 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Asset Allocation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 bg-muted animate-pulse rounded" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Allocation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 bg-muted animate-pulse rounded" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (platforms.length === 0 || assetAllocationData.length === 0) {
        return (
            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-muted-foreground py-12">
                            No data available. Add platforms to see analytics.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="grid md:grid-cols-2 gap-8 mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>Asset Allocation</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Top 5 assets by value{" "}
                        {assetAllocationData.length > 5
                            ? "(others grouped)"
                            : ""}
                    </p>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={assetAllocationData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ percentage }) =>
                                    percentage > 3
                                        ? `${percentage.toFixed(1)}%`
                                        : ""
                                }
                            >
                                {assetAllocationData.map((_, index) => (
                                    <Cell
                                        key={`asset-cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number, name: string) => [
                                    `$${formatCurrency(value)}`,
                                    name,
                                ]}
                                labelFormatter={(label) => `Asset: ${label}`}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: "12px" }}
                                formatter={(value) => {
                                    const item = assetAllocationData.find(
                                        (d) => d.name === value
                                    );
                                    return `${value} (${item?.percentage?.toFixed(
                                        1
                                    )}%)`;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Platform Allocation</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Distribution across platforms
                    </p>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={platformAllocationData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ percentage }) =>
                                    percentage > 5
                                        ? `${percentage.toFixed(1)}%`
                                        : ""
                                }
                            >
                                {platformAllocationData.map((_, index) => (
                                    <Cell
                                        key={`platform-cell-${index}`}
                                        fill={
                                            COLORS[(index + 4) % COLORS.length]
                                        }
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number, name: string) => [
                                    `$${formatCurrency(value)}`,
                                    name,
                                ]}
                                labelFormatter={(label) => `Platform: ${label}`}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: "12px" }}
                                formatter={(value) => {
                                    const item = platformAllocationData.find(
                                        (d) => d.name === value
                                    );
                                    return `${value} (${item?.percentage?.toFixed(
                                        1
                                    )}%)`;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};
