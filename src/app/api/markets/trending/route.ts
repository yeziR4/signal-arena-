import { NextResponse } from "next/server";
import { resolveCrypto } from "@/lib/providers/crypto";
import { getClosingSoonPredictionMarkets } from "@/lib/providers/prediction";
import { resolveStock } from "@/lib/providers/stocks";
import { getAssetIcon } from "@/lib/utils/icons";

export async function GET() {
    try {
        // 1. Fetch "Closing Soon" Prediction Markets (Dome API)
        const predictionMarkets = await getClosingSoonPredictionMarkets();

        // 2. Fetch Top Crypto (Simulated for speed, but branded)
        const cryptoSymbols = ["BTC", "ETH", "SOL", "BNB", "XRP"];
        const cryptoPromises = cryptoSymbols.map(s => resolveCrypto(s));
        const cryptoResults = await Promise.all(cryptoPromises);
        const cryptos = cryptoResults
            .filter(r => r.success && r.data)
            .map(r => r.data!);

        // 3. Fetch Core Stocks
        const stockSymbols = ["AAPL", "NVDA", "TSLA", "MSFT"];
        const stockPromises = stockSymbols.map(s => resolveStock(s));
        const stockResults = await Promise.all(stockPromises);
        const stocks = stockResults
            .filter(r => r.success && r.data)
            .map(r => r.data!);

        // Combine and Normalize
        const combined = [...predictionMarkets, ...cryptos, ...stocks].map(m => ({
            id: m.id,
            symbol: m.symbol,
            name: m.name,
            type: m.type,
            source: m.source,
            price: m.currentPrice,
            change24h: m.change24h,
            volume: m.metadata.volume || null,
            iconUrl: m.iconUrl || getAssetIcon(m.symbol, m.type)
        }));

        // Shuffle slightly for a more dynamic feel
        const sorted = combined.sort(() => Math.random() - 0.5);

        return NextResponse.json(sorted);
    } catch (error) {
        console.error("Trending markets error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
