export interface PlatformHolding {
    assetName: string;
    ticker: string;
    amount: number;
    price: number;
    value: number;
    type: "spot" | "collateral" | "debt";
    apy?: number;
    loanInfo?: {
        ltv: number;
        loanCoin: string;
        debt: number;
        marginCallPrice: number;
        liquidationPrice: number;
    };
}

export interface Platform {
    name: string;
    totalValue: number;
    holdings: PlatformHolding[];
    type?: "binance" | "multiversx";
}

export interface StoredPlatform {
    type: "binance" | "multiversx";
    name: string;
    apiKey?: string;
    apiSecret?: string;
    walletAddress?: string;
}
