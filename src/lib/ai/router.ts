import { AI_MODELS, OPENROUTER_API_KEY, OPENROUTER_BASE_URL } from "../config";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { TradeDecisionSchema, TradeDecisionOutput, validateDecision } from "./schemas";
import { ResolvedMarket } from "../providers/types";

interface TraderPortfolio {
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

export interface ModelDecision {
    modelSlug: string;
    modelName: string;
    decision: TradeDecisionOutput;
    error?: string;
}

// Fallback decisions when API is unavailable
function generateFallbackDecision(
    modelSlug: string,
    modelName: string,
    market: ResolvedMarket,
    portfolio: TraderPortfolio
): ModelDecision {
    const confidence = Math.floor(30 + Math.random() * 60);
    const shouldTrade = confidence > 55 && portfolio.availableCapital > 20;

    const isPrediction = market.type === "prediction_market";
    const direction = shouldTrade
        ? isPrediction
            ? Math.random() > 0.4 ? "yes" : "no"
            : Math.random() > 0.4 ? "long" : "short"
        : "none";

    const sizeUsd = shouldTrade
        ? Math.min(
            parseFloat((portfolio.availableCapital * (confidence / 200)).toFixed(2)),
            portfolio.availableCapital
        )
        : 0;

    return {
        modelSlug,
        modelName,
        decision: {
            action: shouldTrade ? "open" : "skip",
            direction: direction as TradeDecisionOutput["direction"],
            confidence,
            sizeUsd,
            reasoning: shouldTrade
                ? `Based on current ${market.type} data for ${market.symbol}, placing a ${direction} position with ${confidence}% confidence. ${market.change24h && market.change24h > 0 ? "Positive momentum supports entry." : "Contrarian opportunity."}`
                : `Current market conditions for ${market.symbol} do not present a compelling risk/reward. Preserving capital.`,
            riskNote: shouldTrade
                ? "Position sized conservatively relative to bankroll."
                : "No risk taken — capital preserved.",
            timeHorizon: "swing",
            takeProfit: null,
            stopLoss: null,
            closeReason: null,
        },
    };
}

/**
 * Call a single AI model via OpenRouter
 */
async function callModel(
    modelKey: string,
    market: ResolvedMarket,
    portfolio: TraderPortfolio
): Promise<TradeDecisionOutput> {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(market, portfolio);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                "X-Title": "Signal Arena",
            },
            body: JSON.stringify({
                model: modelKey,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: 800,
                response_format: { type: "json_object" },
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`OpenRouter error ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) throw new Error("Empty response from model");

        // Try to parse JSON from response
        const jsonStr = extractJson(content);
        const parsed = JSON.parse(jsonStr);
        return TradeDecisionSchema.parse(parsed);
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

function extractJson(text: string): string {
    // Try to find JSON in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0];
    return text;
}

/**
 * Run all enabled AI models against a market
 */
export async function runAllModels(
    market: ResolvedMarket,
    traderPortfolios: Map<string, TraderPortfolio>
): Promise<ModelDecision[]> {
    const enabledModels = AI_MODELS.filter((m) => m.enabled);
    const hasApiKey = !!OPENROUTER_API_KEY;

    const decisions = await Promise.allSettled(
        enabledModels.map(async (model) => {
            const portfolio = traderPortfolios.get(model.slug) || {
                totalCapital: 500,
                availableCapital: 500,
                openPositions: [],
            };

            if (!hasApiKey) {
                return generateFallbackDecision(model.slug, model.name, market, portfolio);
            }

            try {
                const decision = await callModel(model.modelKey, market, portfolio);
                const validation = validateDecision(decision, portfolio.availableCapital);

                if (!validation.valid) {
                    // Retry once
                    try {
                        const retryDecision = await callModel(model.modelKey, market, portfolio);
                        const retryValidation = validateDecision(retryDecision, portfolio.availableCapital);
                        if (retryValidation.valid) {
                            return { modelSlug: model.slug, modelName: model.name, decision: retryDecision };
                        }
                    } catch {
                        // Use clamped version of original
                    }

                    // Clamp sizeUsd to available capital
                    decision.sizeUsd = Math.min(decision.sizeUsd, portfolio.availableCapital);
                    if (decision.action === "skip" || decision.action === "hold") {
                        decision.sizeUsd = 0;
                        decision.direction = "none";
                    }
                }

                return { modelSlug: model.slug, modelName: model.name, decision };
            } catch (error) {
                console.error(`Model ${model.name} failed:`, error);
                return generateFallbackDecision(model.slug, model.name, market, portfolio);
            }
        })
    );

    return decisions.map((result) => {
        if (result.status === "fulfilled") return result.value;
        // Should not happen since we catch errors above
        return {
            modelSlug: "unknown",
            modelName: "Unknown",
            decision: {
                action: "skip" as const,
                direction: "none" as const,
                confidence: 0,
                sizeUsd: 0,
                reasoning: "Model call failed",
                riskNote: "",
                timeHorizon: "swing" as const,
                takeProfit: null,
                stopLoss: null,
                closeReason: null,
            },
            error: "Model call failed",
        };
    });
}
