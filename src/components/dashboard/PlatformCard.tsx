import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/types";
import { PlatformCardBase } from "./PlatformCardBase";

interface PlatformCardProps {
    platform: Platform;
}

export const PlatformCard = ({ platform }: PlatformCardProps) => (
    <PlatformCardBase platform={platform}>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>APY</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {platform.holdings
                    .sort((a, b) => b.value - a.value)
                    .map((holding) => {
                        const ltv = holding.loanInfo?.ltv;
                        const ltvColor =
                            ltv && ltv >= 0.91
                                ? "text-red-500"
                                : ltv && ltv >= 0.85
                                ? "text-yellow-500"
                                : "text-green-500";

                        return (
                            <>
                                <TableRow
                                    key={`${holding.ticker}-${holding.assetName}`}
                                    className={cn(
                                        holding.value < 0 ? "text-red-500" : ""
                                    )}
                                >
                                    <TableCell>
                                        {holding.assetName}
                                        {holding.loanInfo && (
                                            <span
                                                className={cn(
                                                    "ml-2 font-bold",
                                                    ltvColor
                                                )}
                                            >
                                                LTV: {(ltv! * 100).toFixed(2)}%
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {holding.amount.toLocaleString(
                                            undefined,
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 6,
                                            }
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        $
                                        {holding.price?.toLocaleString(
                                            undefined,
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 4,
                                            }
                                        ) ?? "-"}
                                    </TableCell>
                                    <TableCell>
                                        {holding.apy
                                            ? `${(holding.apy * 100).toFixed(
                                                  2
                                              )}%`
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        $
                                        {holding.value.toLocaleString(
                                            undefined,
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}
                                    </TableCell>
                                </TableRow>
                                {holding.loanInfo && (
                                    <TableRow
                                        key={`${holding.ticker}-${holding.assetName}-loan`}
                                    >
                                        <TableCell colSpan={5} className="p-0">
                                            <div className="bg-muted/50 p-4">
                                                <h4 className="font-semibold mb-2">
                                                    Loan Details
                                                </h4>
                                                <ul className="space-y-1 text-sm">
                                                    <li>
                                                        <strong>Debt:</strong>{" "}
                                                        {holding.loanInfo.debt.toFixed(
                                                            2
                                                        )}{" "}
                                                        {
                                                            holding.loanInfo
                                                                .loanCoin
                                                        }
                                                    </li>
                                                    <li className="text-yellow-500">
                                                        <strong>
                                                            Margin Call Price:
                                                        </strong>{" "}
                                                        {holding.loanInfo.marginCallPrice.toFixed(
                                                            4
                                                        )}{" "}
                                                        {
                                                            holding.loanInfo
                                                                .loanCoin
                                                        }
                                                    </li>
                                                    <li className="text-red-500">
                                                        <strong>
                                                            Liquidation Price:
                                                        </strong>{" "}
                                                        {holding.loanInfo.liquidationPrice.toFixed(
                                                            4
                                                        )}{" "}
                                                        {
                                                            holding.loanInfo
                                                                .loanCoin
                                                        }
                                                    </li>
                                                </ul>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        );
                    })}
            </TableBody>
        </Table>
    </PlatformCardBase>
);
