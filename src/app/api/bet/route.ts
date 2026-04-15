import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveInput } from "@/lib/providers/resolver";
import { runAllModels } from "@/lib/ai/router";
import { canOpenPosition, reserveCapital } from "@/lib/capital";
import { MAX_OPEN_POSITIONS, AI_MODELS, STARTING_CAPITAL } from "@/lib/config";
import { updateAllActivePositions } from "@/lib/pnl";
import { ensureAnonymousId } from "@/lib/auth-anonymous";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { input, assetId } = body;

        // Step 0: Ensure identity
        const anonymousId = await ensureAnonymousId();

        // Step 1: Resolve market
        let market;
        let dbAsset;

        if (assetId) {
            dbAsset = await prisma.asset.findFirst({
                where: {
                    OR: [
                        { id: assetId },
                        { externalId: assetId }
                    ]
                }
            });

            if (!dbAsset) {
                return NextResponse.json({ error: "Asset not found" }, { status: 404 });
            }
            const result = await resolveInput(dbAsset.symbol);
            if (!result.success || !result.data) {
                return NextResponse.json({ error: "Could not fetch market data" }, { status: 500 });
            }
            market = result.data;
        } else if (input) {
            const result = await resolveInput(input);
            if (!result.success || !result.data) {
                return NextResponse.json({ error: result.error || "Could not resolve market" }, { status: 404 });
            }
            market = result.data;

            dbAsset = await prisma.asset.upsert({
                where: { symbol_type: { symbol: market.symbol, type: market.type } },
                update: { 
                    name: market.name, 
                    source: market.source,
                    metadata: JSON.stringify({ 
                        ...(market.metadata || {}), 
                        iconUrl: market.iconUrl 
                    })
                },
                create: {
                    symbol: market.symbol,
                    name: market.name,
                    type: market.type,
                    source: market.source,
                    externalId: market.id,
                    metadata: JSON.stringify({ iconUrl: market.iconUrl }),
                },
            });
        } else {
            return NextResponse.json({ error: "Input or assetId required" }, { status: 400 });
        }

        // Step 2: Load all AI models and current user-specific portfolios
        const traders = await prisma.aiTrader.findMany({ where: { enabled: true } });
        const traderPortfolios = new Map<string, {
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
        }>();

        for (const trader of traders) {
            // Get user-specific stats
            const stats = await prisma.userTraderStats.upsert({
                where: { anonymousId_aiTraderId: { anonymousId, aiTraderId: trader.id } },
                update: {},
                create: {
                    anonymousId,
                    aiTraderId: trader.id,
                    totalCapital: STARTING_CAPITAL,
                    availableCapital: STARTING_CAPITAL
                }
            });

            // Get user-specific open positions
            const openPositions = await prisma.position.findMany({
                where: { anonymousId, aiTraderId: trader.id, status: "open" },
                include: { asset: true },
            });

            traderPortfolios.set(trader.slug, {
                totalCapital: stats.totalCapital,
                availableCapital: stats.availableCapital,
                openPositions: openPositions.map((p) => ({
                    asset: p.asset.symbol,
                    direction: p.direction,
                    sizeUsd: p.sizeUsd,
                    entryPrice: p.entryPrice,
                    currentPrice: p.currentPrice,
                    pnl: p.pnl,
                })),
            });
        }

        // Step 3: Run all AI models
        const decisions = await runAllModels(market, traderPortfolios);

        // Step 4: Process decisions
        const results = [];

        for (const decision of decisions) {
            const trader = traders.find((t) => t.slug === decision.modelSlug);
            if (!trader) continue;

            // Save trade decision (user-specific)
            await prisma.tradeDecision.create({
                data: {
                    anonymousId,
                    aiTraderId: trader.id,
                    assetId: dbAsset!.id,
                    action: decision.decision.action,
                    direction: decision.decision.direction,
                    confidence: decision.decision.confidence,
                    sizeUsd: decision.decision.sizeUsd,
                    reasoning: decision.decision.reasoning,
                    riskNote: decision.decision.riskNote || "",
                    closeReason: decision.decision.closeReason,
                    rawModelOutput: JSON.stringify(decision.decision),
                },
            });

            const modelConfig = AI_MODELS.find((m) => m.slug === decision.modelSlug);

            if (decision.decision.action === "open" && decision.decision.sizeUsd > 0) {
                const portfolio = traderPortfolios.get(trader.slug)!;
                const openCount = portfolio.openPositions.length;

                const check = canOpenPosition(
                    portfolio.availableCapital,
                    decision.decision.sizeUsd,
                    openCount,
                    MAX_OPEN_POSITIONS
                );

                if (check.allowed) {
                    // Open position (user-specific)
                    const position = await prisma.position.create({
                        data: {
                            anonymousId,
                            aiTraderId: trader.id,
                            assetId: dbAsset!.id,
                            direction: decision.decision.direction,
                            sizeUsd: decision.decision.sizeUsd,
                            entryPrice: market.currentPrice,
                            currentPrice: market.currentPrice,
                            confidence: decision.decision.confidence,
                            reasoning: decision.decision.reasoning,
                            riskNote: decision.decision.riskNote || "",
                            timeHorizon: decision.decision.timeHorizon || "swing",
                            stopLoss: decision.decision.stopLoss,
                            takeProfit: decision.decision.takeProfit,
                        },
                    });

                    // Update user-specific capital
                    const newAvailable = reserveCapital(
                        portfolio.availableCapital,
                        decision.decision.sizeUsd
                    );

                    await prisma.userTraderStats.update({
                        where: { anonymousId_aiTraderId: { anonymousId, aiTraderId: trader.id } },
                        data: {
                            availableCapital: newAvailable,
                            totalTrades: { increment: 1 },
                            lastActionSummary: `Opened ${decision.decision.direction} on ${market.symbol} - $${decision.decision.sizeUsd}`,
                        },
                    });

                    results.push({
                        traderName: decision.modelName,
                        modelKey: modelConfig?.modelKey || decision.modelSlug,
                        iconUrl: modelConfig?.iconUrl,
                        ...decision.decision,
                        positionId: position.id,
                        status: "position_opened",
                    });
                } else {
                    // Update user-specific summary for rejection
                    await prisma.userTraderStats.update({
                        where: { anonymousId_aiTraderId: { anonymousId, aiTraderId: trader.id } },
                        data: {
                            lastActionSummary: `Evaluated ${market.symbol} - Trade rejected: ${check.reason}`,
                        },
                    });

                    results.push({
                        traderName: decision.modelName,
                        modelKey: modelConfig?.modelKey || decision.modelSlug,
                        iconUrl: modelConfig?.iconUrl,
                        ...decision.decision,
                        status: "rejected",
                        reason: check.reason,
                    });
                }
            } else {
                // Update user-specific summary for skip/hold
                await prisma.userTraderStats.update({
                    where: { anonymousId_aiTraderId: { anonymousId, aiTraderId: trader.id } },
                    data: {
                        lastActionSummary: `Evaluated ${market.symbol} - Decision: ${decision.decision.action === 'skip' ? 'Skipped' : decision.decision.action}`,
                    },
                });

                results.push({
                    traderName: decision.modelName,
                    modelKey: modelConfig?.modelKey || decision.modelSlug,
                    iconUrl: modelConfig?.iconUrl,
                    ...decision.decision,
                    status: decision.decision.action === "skip" ? "skipped" : decision.decision.action,
                });
            }
        }

        // Step 5: Update user positions
        try {
            await updateAllActivePositions(anonymousId);
        } catch (syncError) {
            console.error("Eager sync failed after bet:", syncError);
        }
        
        return NextResponse.json({
            market,
            asset: dbAsset,
            decisions: results,
        });
    } catch (error) {
        console.error("Bet error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
