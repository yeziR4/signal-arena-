import { TRADER_SYSTEM_PROMPT } from "../constants";
import { ResolvedMarket } from "../providers/types";

interface PortfolioState {
    totalCapital: number;
    availableCapital: number;
    openPositions: {
        asset: string;
        direction: string;
        sizeUsd: number;
        entryPrice: number;
        currentPrice: number;
        pnl: number;
    }[];
}

export function buildSystemPrompt(): string {
    return TRADER_SYSTEM_PROMPT;
}

export function buildUserPrompt(
    market: ResolvedMarket,
    portfolio: PortfolioState
): string {
    const isPrediction = market.type === "prediction_market";

    const marketSection = isPrediction
        ? `## Market Data
Market: ${market.name}
Type: Prediction Market
Current Probability (Yes): ${((market.currentPrice) * 100).toFixed(1)}%
Current Probability (No): ${((1 - market.currentPrice) * 100).toFixed(1)}%
Volume: $${market.metadata.volume?.toLocaleString() ?? "N/A"}
Close Date: ${market.metadata.closeDate ?? "N/A"}
Category: ${market.metadata.category ?? "N/A"}`
        : `## Market Data
Asset: ${market.name} (${market.symbol})
Type: ${market.type === "crypto" ? "Cryptocurrency" : "Stock"}
Current Price: $${market.currentPrice.toLocaleString()}
24h Change: ${market.change24h != null ? `${market.change24h > 0 ? "+" : ""}${market.change24h.toFixed(2)}%` : "N/A"}
Volume: ${market.metadata.volume ? `$${market.metadata.volume.toLocaleString()}` : "N/A"}`;

    const positionsSection =
        portfolio.openPositions.length > 0
            ? `## Your Open Positions
${portfolio.openPositions.map(
                (p) =>
                    `- ${p.asset}: ${p.direction.toUpperCase()} $${p.sizeUsd.toFixed(2)} @ $${p.entryPrice} → $${p.currentPrice} (PnL: $${p.pnl.toFixed(2)})`
            ).join("\n")}`
            : `## Your Open Positions\nNone`;

    return `${marketSection}

## Your Portfolio
Total Capital: $${portfolio.totalCapital.toFixed(2)}
Available Capital: $${portfolio.availableCapital.toFixed(2)}

${positionsSection}

## Instructions
Analyze the market data and your portfolio. Decide your action.
- If you see a high-quality opportunity, open a position sized to your conviction.
- If you already have a position in this asset, decide whether to hold, scale, or close.
- If the opportunity is low-conviction, skip.

Return ONLY valid JSON matching this schema:
{
  "action": "open" | "hold" | "close" | "scale_in" | "scale_out" | "skip",
  "direction": "${isPrediction ? '"yes" | "no"' : '"long" | "short"'} | "none",
  "confidence": <0-100>,
  "sizeUsd": <amount from available capital, 0 if skip/hold>,
  "reasoning": "<concise rationale>",
  "riskNote": "<key risk>",
  "timeHorizon": "intraday" | "swing" | "1w" | "1m",
  "takeProfit": <price or null>,
  "stopLoss": <price or null>,
  "closeReason": <string or null>
}`;
}
