import { isCryptoSymbol, resolveCrypto } from "./crypto";
import { isStockSymbol, resolveStock } from "./stocks";
import { isPolymarketUrl, resolvePredictionMarket } from "./prediction";
import { ProviderResult } from "./types";

export type { ResolvedMarket, ChartPoint, MarketMetadata, ProviderResult } from "./types";

/**
 * Smart input resolver — detects market type from user input
 * Supports: stock tickers, crypto symbols, Polymarket URLs, search text
 */
export async function resolveInput(input: string): Promise<ProviderResult> {
    const trimmed = input.trim();

    if (!trimmed) {
        return { success: false, error: "Please enter a ticker, symbol, or market URL" };
    }

    // 1. Polymarket URL
    if (isPolymarketUrl(trimmed)) {
        return resolvePredictionMarket(trimmed);
    }

    // 2. Crypto symbol
    if (isCryptoSymbol(trimmed)) {
        return resolveCrypto(trimmed);
    }

    // 3. Stock ticker
    if (isStockSymbol(trimmed)) {
        return resolveStock(trimmed);
    }

    // 4. Try as stock ticker anyway (1-5 uppercase letters)
    const upper = trimmed.toUpperCase();
    if (/^[A-Z]{1,5}$/.test(upper)) {
        const stockResult = await resolveStock(upper);
        if (stockResult.success) return stockResult;

        // Maybe it's crypto we don't know about
        const cryptoResult = await resolveCrypto(upper);
        if (cryptoResult.success) return cryptoResult;
    }

    // 5. Prediction market search
    const predResult = await resolvePredictionMarket(trimmed);
    if (predResult.success) return predResult;

    return { success: false, error: `Could not resolve market for: ${trimmed}` };
}
