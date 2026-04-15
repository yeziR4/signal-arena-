import { z } from "zod";

export const TradeDecisionSchema = z.object({
    action: z.enum(["open", "hold", "close", "scale_in", "scale_out", "skip"]),
    direction: z.enum(["long", "short", "yes", "no", "none"]),
    confidence: z.number().min(0).max(100),
    sizeUsd: z.number().min(0),
    reasoning: z.string().max(500),
    riskNote: z.string().max(300).optional().default(""),
    timeHorizon: z.enum(["intraday", "swing", "1w", "1m"]).optional().default("swing"),
    takeProfit: z.number().nullable().optional().default(null),
    stopLoss: z.number().nullable().optional().default(null),
    closeReason: z.string().nullable().optional().default(null),
});

export type TradeDecisionOutput = z.infer<typeof TradeDecisionSchema>;

/**
 * Validate business rules on top of zod schema validation
 */
export function validateDecision(
    decision: TradeDecisionOutput,
    availableCapital: number
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (decision.action === "skip" || decision.action === "hold") {
        if (decision.sizeUsd !== 0) {
            errors.push("sizeUsd must be 0 for skip/hold actions");
        }
        if (decision.direction !== "none") {
            errors.push("direction must be 'none' for skip/hold actions");
        }
    }

    if (decision.action === "open" || decision.action === "scale_in") {
        if (decision.sizeUsd > availableCapital) {
            errors.push(`sizeUsd ($${decision.sizeUsd}) exceeds available capital ($${availableCapital})`);
        }
        if (decision.sizeUsd <= 0) {
            errors.push("sizeUsd must be positive for open/scale_in");
        }
        if (decision.direction === "none") {
            errors.push("direction cannot be 'none' for open/scale_in");
        }
    }

    if (decision.action === "close" && !decision.closeReason) {
        // Soft validation — set a default
        decision.closeReason = "Position closed by AI decision";
    }

    return { valid: errors.length === 0, errors };
}
