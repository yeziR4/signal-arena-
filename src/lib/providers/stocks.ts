import { ResolvedMarket, ChartPoint, ProviderResult } from "./types";
import { getAssetIcon } from "../utils/icons";

function generateChartData(basePrice: number, points: number = 24): ChartPoint[] {
    const data: ChartPoint[] = [];
    let price = basePrice * (0.95 + Math.random() * 0.05);
    const now = Date.now();
    for (let i = points; i >= 0; i--) {
        const time = new Date(now - i * 3600000).toISOString();
        price = price * (1 + (Math.random() - 0.48) * 0.02);
        data.push({ time, value: parseFloat(price.toFixed(2)) });
    }
    data[data.length - 1].value = basePrice;
    return data;
}

// Well-known stock tickers
const STOCK_TICKERS = new Set([
    "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "META", "TSLA",
    "BRK.B", "JPM", "V", "UNH", "MA", "HD", "PG", "JNJ",
    "COST", "ABBV", "BAC", "KO", "PEP", "MRK", "AVGO", "TMO",
    "LLY", "ORCL", "CSCO", "CRM", "AMD", "NFLX", "ADBE", "INTC",
    "QCOM", "DIS", "NKE", "PYPL", "IBM", "GS", "MS", "UBER",
    "PLTR", "COIN", "SQ", "SHOP", "SNOW", "CRWD", "ZS", "NET",
    "DDOG", "MDB",
]);

const DEMO_STOCKS: Record<string, { price: number; name: string; change: number }> = {
    AAPL: { price: 198.50, name: "Apple Inc.", change: 1.24 },
    NVDA: { price: 142.80, name: "NVIDIA Corporation", change: 3.67 },
    TSLA: { price: 271.30, name: "Tesla, Inc.", change: -2.15 },
    MSFT: { price: 445.20, name: "Microsoft Corporation", change: 0.89 },
    GOOGL: { price: 178.60, name: "Alphabet Inc.", change: 1.56 },
    AMZN: { price: 201.40, name: "Amazon.com, Inc.", change: 0.23 },
    META: { price: 562.80, name: "Meta Platforms, Inc.", change: 2.10 },
    AMD: { price: 168.90, name: "Advanced Micro Devices", change: -1.30 },
    PLTR: { price: 78.20, name: "Palantir Technologies", change: 4.50 },
    COIN: { price: 265.30, name: "Coinbase Global", change: 3.20 },
};

/**
 * Resolve stock market data using Finnhub API
 */
export async function resolveStock(symbol: string): Promise<ProviderResult> {
    const upperSymbol = symbol.toUpperCase().trim();
    const apiKey = process.env.STOCKS_API_KEY;

    if (!apiKey) {
        return getStockDemoData(upperSymbol);
    }

    try {
        // 1. Fetch Quote
        const quoteRes = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${upperSymbol}&token=${apiKey}`,
            { next: { revalidate: 300 } } // Cache for 5 mins
        );

        if (!quoteRes.ok) throw new Error("Finnhub quote failed");
        const quote = await quoteRes.json();

        // Finnhub returns 0 for current price if symbol not found
        if (!quote.c || quote.c === 0) {
            return getStockDemoData(upperSymbol);
        }

        let name = upperSymbol;
        let logoUrl = undefined;
        try {
            const profileRes = await fetch(
                `https://finnhub.io/api/v1/stock/profile2?symbol=${upperSymbol}&token=${apiKey}`,
                { next: { revalidate: 86400 } }
            );
            if (profileRes.ok) {
                const profile = await profileRes.json();
                if (profile.name) name = profile.name;
                if (profile.logo) logoUrl = profile.logo;
            }
        } catch {
            // Ignore profile error
        }

        const price = quote.c;
        const change24h = quote.dp || 0;

        const market: ResolvedMarket = {
            id: `stock-${upperSymbol}`,
            symbol: upperSymbol,
            name: name,
            type: "stock",
            currentPrice: price,
            change24h: change24h,
            chartData: generateChartData(price),
            metadata: {
                high: quote.h,
                low: quote.l,
                open: quote.o,
                prevClose: quote.pc,
                description: `${name} (${upperSymbol}) stock quote`,
            },
            source: "finnhub",
            iconUrl: logoUrl || getAssetIcon(upperSymbol, "stock"),
        };

        return { success: true, data: market };

    } catch (error) {
        console.error("Finnhub error:", error);
        return getStockDemoData(upperSymbol);
    }
}

function getStockDemoData(symbol: string): ProviderResult {
    const demo = DEMO_STOCKS[symbol];
    if (!demo) {
        // Generate pseudo data for any valid-looking ticker
        if (symbol.match(/^[A-Z]{1,5}$/)) {
            const price = 50 + Math.random() * 400;
            return {
                success: true,
                data: {
                    id: `stock-${symbol}`,
                    symbol,
                    name: `${symbol} Inc.`,
                    type: "stock",
                    currentPrice: parseFloat(price.toFixed(2)),
                    change24h: parseFloat((Math.random() * 6 - 3).toFixed(2)),
                    chartData: generateChartData(price),
                    metadata: { volume: Math.floor(Math.random() * 50000000) },
                    source: "demo",
                },
            };
        }
        return { success: false, error: `Unknown stock: ${symbol}` };
    }

    return {
        success: true,
        data: {
            id: `stock-${symbol}`,
            symbol,
            name: demo.name,
            type: "stock",
            currentPrice: demo.price,
            change24h: demo.change,
            chartData: generateChartData(demo.price),
            metadata: { volume: Math.floor(Math.random() * 50000000) },
            source: "demo",
        },
    };
}

export function isStockSymbol(input: string): boolean {
    const upper = input.toUpperCase().trim();
    return STOCK_TICKERS.has(upper) || DEMO_STOCKS[upper] !== undefined;
}
