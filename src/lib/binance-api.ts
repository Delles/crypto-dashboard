import type { Platform, PlatformHolding } from "./types";
import type { StoredPlatform } from "./types";

interface TickerPrice {
    symbol: string;
    price: string;
}

// Interfaces based on Binance API responses
// Spot account info
interface BinanceAccountInfo {
    balances: Array<{
        asset: string;
        free: number | string;
        locked: number | string;
    }>;
}

interface BinanceFlexibleLoanOrder {
    loanCoin: string;
    collateralCoin: string;
    totalDebt: string;
    collateralAmount: string;
    currentLTV: string;
}

interface BinanceLoanOrdersResponse {
    total: number;
    rows: BinanceFlexibleLoanOrder[];
}

// Simple HMAC-SHA256 signing using Web Crypto API
async function signRequest(query: string, apiSecret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(apiSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(query)
    );
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

// Function to generate HMAC-SHA256 signature
async function createSignature(
    queryString: string,
    apiSecret: string
): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(apiSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(queryString)
    );
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

// Make authenticated request to Binance API
async function binanceFetch(
    endpoint: string,
    apiKey: string,
    apiSecret: string,
    params: Record<string, string> = {}
) {
    const timestamp = Date.now().toString();
    const queryParams = new URLSearchParams({ ...params, timestamp });
    const queryString = queryParams.toString();

    const signature = await signRequest(queryString, apiSecret);
    const signedQuery = `${queryString}&signature=${signature}`;

    const response = await fetch(`/binance-api/v3/${endpoint}?${signedQuery}`, {
        headers: {
            "X-MBX-APIKEY": apiKey,
        },
    });

    if (!response.ok) {
        throw new Error(
            `Binance API error: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

// Make authenticated request to Binance SAPI (for loan endpoints)
async function binanceSapiFetch(
    path: string,
    apiKey: string,
    apiSecret: string,
    version = "v1",
    params: Record<string, string> = {}
) {
    const timestamp = Date.now();
    const queryParams = new URLSearchParams({
        ...params,
        timestamp: timestamp.toString(),
    });
    const queryString = queryParams.toString();
    const signature = await createSignature(queryString, apiSecret);
    const url = `/binance-api/sapi/${version}/${path}?${queryString}&signature=${signature}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "X-MBX-APIKEY": apiKey,
        },
    });

    if (!response.ok) {
        throw new Error(
            `Binance SAPI error: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

// Fetch crypto loan account data (flexible loans)
async function getBinanceLoansAccount(
    apiKey: string,
    apiSecret: string
): Promise<BinanceLoanOrdersResponse> {
    return binanceSapiFetch(
        "loan/flexible/ongoing/orders",
        apiKey,
        apiSecret,
        "v2"
    );
}

// Fetches the account assets from Binance
export const getBinanceAccountAssets = async (
    platform: StoredPlatform
): Promise<Platform | null> => {
    if (!platform.apiKey || !platform.apiSecret) {
        console.error("Binance API key or secret is missing.");
        return null;
    }

    try {
        // Fetch account info and ticker prices in parallel
        const [accountInfo, tickerPrices] = await Promise.all([
            binanceFetch(
                "account",
                platform.apiKey,
                platform.apiSecret
            ) as Promise<BinanceAccountInfo>,
            fetch("/binance-api/v3/ticker/price").then((res) =>
                res.json()
            ) as Promise<TickerPrice[]>,
        ]);

        const priceMap = new Map<string, number>();
        for (const ticker of tickerPrices) {
            priceMap.set(ticker.symbol, Number.parseFloat(ticker.price));
        }

        const holdings: PlatformHolding[] = [];
        let totalPlatformValue = 0;

        console.log(
            `Processing ${accountInfo.balances.length} balances for ${platform.name}`
        );

        // Fetch loan data
        const loansAccount = await Promise.allSettled([
            getBinanceLoansAccount(platform.apiKey, platform.apiSecret),
        ]);

        // Process spot holdings
        for (const balance of accountInfo.balances) {
            const free = Number.parseFloat(balance.free as string);
            const locked = Number.parseFloat(balance.locked as string);
            const total = free + locked;

            if (total > 0) {
                // Try multiple USD/stablecoin pairs to get better price coverage
                let usdPrice = 0;
                if (
                    balance.asset === "USDT" ||
                    balance.asset === "USDC" ||
                    balance.asset === "BUSD"
                ) {
                    usdPrice = 1; // Stablecoins = $1
                } else {
                    usdPrice =
                        priceMap.get(`${balance.asset}USDT`) ||
                        priceMap.get(`${balance.asset}USDC`) ||
                        priceMap.get(`${balance.asset}BUSD`) ||
                        0;
                }

                const value = total * usdPrice;
                if (value > 0) {
                    // Show all holdings with any value
                    holdings.push({
                        assetName: `${balance.asset}`,
                        ticker: balance.asset,
                        amount: total,
                        price: usdPrice,
                        value,
                        type: "spot",
                    });
                    totalPlatformValue += value;
                }
            }
        }

        // Process flexible loans
        if (
            loansAccount[0].status === "fulfilled" &&
            loansAccount[0].value?.rows?.length > 0
        ) {
            console.log(
                `Processing ${loansAccount[0].value.rows.length} flexible loan positions`
            );
            for (const loan of loansAccount[0].value.rows) {
                const collateralAmount = parseFloat(loan.collateralAmount);
                const collateralAsset = loan.collateralCoin;
                const totalDebt = parseFloat(loan.totalDebt);
                const loanCoin = loan.loanCoin;
                const currentLTV = parseFloat(loan.currentLTV);

                // Calculations
                const marginCallPrice = totalDebt / (collateralAmount * 0.85);
                const liquidationPrice = totalDebt / (collateralAmount * 0.91);
                const collateralUsdPrice =
                    priceMap.get(`${collateralAsset}USDT`) ||
                    priceMap.get(`${collateralAsset}USDC`) ||
                    0;
                const collateralValue = collateralAmount * collateralUsdPrice;

                // Adjust totalPlatformValue for net worth
                totalPlatformValue += collateralValue;
                totalPlatformValue -= totalDebt; // Assuming debt is in a stablecoin

                const loanInfo = {
                    ltv: currentLTV,
                    loanCoin: loanCoin,
                    debt: totalDebt,
                    marginCallPrice: marginCallPrice,
                    liquidationPrice: liquidationPrice,
                };

                // Add collateral as a separate holding
                holdings.push({
                    assetName: `${collateralAsset}`,
                    ticker: collateralAsset,
                    amount: collateralAmount,
                    price: collateralUsdPrice,
                    value: collateralValue,
                    loanInfo: loanInfo,
                    type: "collateral",
                });

                // Add debt as a negative holding
                holdings.push({
                    assetName: `Debt (${loanCoin})`,
                    ticker: loanCoin,
                    amount: totalDebt,
                    price: 1, // Assume stablecoin debt
                    value: -totalDebt,
                    loanInfo: loanInfo,
                    type: "debt",
                });
            }
        }

        console.log(
            `Binance platform ${platform.name}: ${
                holdings.length
            } holdings, total value: $${totalPlatformValue.toFixed(2)}`
        );

        return {
            name: platform.name,
            totalValue: totalPlatformValue,
            holdings,
            type: "binance",
        };
    } catch (error) {
        console.error(
            `Error fetching account assets for ${platform.name}:`,
            error
        );
        return null;
    }
};
