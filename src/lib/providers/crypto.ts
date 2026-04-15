import { ResolvedMarket, ChartPoint, ProviderResult } from "./types";
import { getAssetIcon } from "../utils/icons";

// Generate realistic chart data
function generateChartData(basePrice: number, points: number = 24): ChartPoint[] {
    const data: ChartPoint[] = [];
    let price = basePrice * (0.95 + Math.random() * 0.05);
    const now = Date.now();

    for (let i = points; i >= 0; i--) {
        const time = new Date(now - i * 3600000).toISOString();
        price = price * (1 + (Math.random() - 0.48) * 0.02);
        data.push({ time, value: parseFloat(price.toFixed(2)) });
    }
    // ensure last point = current price
    data[data.length - 1].value = basePrice;
    return data;
}

// CoinGecko public API
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const CRYPTO_MAP: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    DOGE: "dogecoin",
    ADA: "cardano",
    XRP: "ripple",
    AVAX: "avalanche-2",
    DOT: "polkadot",
    MATIC: "matic-network",
    LINK: "chainlink",
    UNI: "uniswap",
    ATOM: "cosmos",
    LTC: "litecoin",
    NEAR: "near",
    APT: "aptos",
    SUI: "sui",
    ARB: "arbitrum",
    OP: "optimism",
};

export async function resolveCrypto(symbol: string): Promise<ProviderResult> {
    const upperSymbol = symbol.toUpperCase().trim();
    const geckoId = CRYPTO_MAP[upperSymbol];

    if (!geckoId) {
        return { success: false, error: `Unknown crypto symbol: ${upperSymbol}` };
    }

    try {
        const res = await fetch(
            `${COINGECKO_BASE}/coins/${geckoId}?localization=false&tickers=false&community_data=false&developer_data=false`,
            { next: { revalidate: 60 } }
        );

        if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);

        const data = await res.json();
        const price = data.market_data?.current_price?.usd ?? 0;
        const change24h = data.market_data?.price_change_percentage_24h ?? null;
        const marketCap = data.market_data?.market_cap?.usd ?? null;
        const volume = data.market_data?.total_volume?.usd ?? null;

        const market: ResolvedMarket = {
            id: `crypto-${upperSymbol}`,
            symbol: upperSymbol,
            name: data.name || upperSymbol,
            type: "crypto",
            currentPrice: price,
            change24h,
            chartData: generateChartData(price),
            metadata: {
                marketCap,
                volume,
                description: data.description?.en?.substring(0, 200) || undefined,
            },
            source: "coingecko",
            iconUrl: getAssetIcon(upperSymbol, "crypto"),
        };

        return { success: true, data: market };
    } catch {
        // Fallback to demo data
        return getCryptoDemoData(upperSymbol);
    }
}

// Demo data fallback
const DEMO_CRYPTO: Record<string, { price: number; name: string; change: number }> = {
    BTC: { price: 94250, name: "Bitcoin", change: 2.35 },
    ETH: { price: 3420, name: "Ethereum", change: -1.12 },
    SOL: { price: 178, name: "Solana", change: 5.67 },
    DOGE: { price: 0.162, name: "Dogecoin", change: -3.45 },
    ADA: { price: 0.72, name: "Cardano", change: 1.89 },
    XRP: { price: 2.14, name: "Ripple", change: 0.45 },
};

function getCryptoDemoData(symbol: string): ProviderResult {
    const demo = DEMO_CRYPTO[symbol];
    if (!demo) {
        return { success: false, error: `No demo data for ${symbol}` };
    }

    return {
        success: true,
        data: {
            id: `crypto-${symbol}`,
            symbol,
            name: demo.name,
            type: "crypto",
            currentPrice: demo.price,
            change24h: demo.change,
            chartData: generateChartData(demo.price),
            metadata: { marketCap: demo.price * 1e9, volume: demo.price * 1e7 },
            source: "demo",
            iconUrl: getAssetIcon(symbol, "crypto"),
        },
    };
}

export function isCryptoSymbol(input: string): boolean {
    return CRYPTO_MAP[input.toUpperCase().trim()] !== undefined ||
        DEMO_CRYPTO[input.toUpperCase().trim()] !== undefined;
}
