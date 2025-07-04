import type { Platform, PlatformHolding } from "./types";

const API_BASE_URL = "https://api.multiversx.com";

export interface AccountOnNetwork {
    address: string;
    balance: string;
    nonce: number;
    shard: number;
    username: string;
}

export interface FungibleTokenOnNetwork {
    identifier: string;
    name: string;
    ticker: string;
    owner: string;
    decimals: number;
    isPaused: boolean;
    transactions: number;
    accounts: number;
    canUpgrade: boolean;
    canMint: boolean;
    canBurn: boolean;
    canChangeOwner: boolean;
    canPause: boolean;
    canFreeze: boolean;
    canWipe: boolean;
    balance: string;
    price?: number;
    marketCap?: number;
    supply: string;
    circulatingSupply: string;
    valueUsd?: number;
}

const DENOMINATION = 18;

const formatAmount = (amount: string, decimals: number): number => {
    const factor = Math.pow(10, decimals);
    return Number(amount) / factor;
};

const fetchAllTokens = async (
    address: string
): Promise<FungibleTokenOnNetwork[]> => {
    let allTokens: FungibleTokenOnNetwork[] = [];
    let from = 0;
    const size = 100; // Fetch 100 tokens per request
    while (true) {
        const url = `${API_BASE_URL}/accounts/${address}/tokens?includemeta=true&from=${from}&size=${size}`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(
                `Failed to fetch tokens for ${address} from offset ${from}`
            );
            // Depending on desired behavior, you might want to throw an error or return what you have
            break;
        }
        const tokens: FungibleTokenOnNetwork[] = await response.json();
        if (tokens.length === 0) {
            // No more tokens to fetch
            break;
        }
        allTokens = [...allTokens, ...tokens];
        from += size;
    }
    return allTokens;
};

export const getAccountAssets = async (
    address: string,
    name: string
): Promise<Platform | null> => {
    try {
        const accountReq = fetch(`${API_BASE_URL}/accounts/${address}`);
        const allTokensReq = fetchAllTokens(address);
        const economicsReq = fetch(`${API_BASE_URL}/economics`);

        const [accountRes, tokens, economicsRes] = await Promise.all([
            accountReq,
            allTokensReq,
            economicsReq,
        ]);

        if (!accountRes.ok) {
            console.error(`Failed to fetch account data for ${address}`);
            return null;
        }

        const account: AccountOnNetwork = await accountRes.json();
        let egldPrice = 0;
        if (economicsRes.ok) {
            const economicsData = await economicsRes.json();
            egldPrice = economicsData.price || 0;
        } else {
            console.error("Could not fetch EGLD price. Defaulting to 0.");
        }

        const holdings: PlatformHolding[] = [];
        let totalPlatformValue = 0;

        // Add EGLD
        if (account.balance) {
            const amount = formatAmount(account.balance, DENOMINATION);
            const value = amount * egldPrice;
            holdings.push({
                assetName: "EGLD",
                ticker: "EGLD",
                amount,
                price: egldPrice,
                value,
                type: "spot",
            });
            totalPlatformValue += value;
        }

        // Add ESDT tokens
        for (const token of tokens) {
            if (
                token.valueUsd &&
                token.valueUsd >= 1 &&
                token.balance &&
                token.decimals &&
                token.price
            ) {
                const value = token.valueUsd;
                holdings.push({
                    assetName: token.name,
                    ticker: token.ticker,
                    amount: formatAmount(token.balance, token.decimals),
                    price: token.price,
                    value: value,
                    type: "spot",
                });
                totalPlatformValue += value;
            }
        }

        return {
            name,
            totalValue: totalPlatformValue,
            holdings,
            type: "multiversx",
        };
    } catch (error) {
        console.error(`Error fetching account assets for ${address}:`, error);
        return null;
    }
};
