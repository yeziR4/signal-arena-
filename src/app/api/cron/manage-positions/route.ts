import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveInput } from "@/lib/providers/resolver";
import { calculatePnl } from "@/lib/capital";
import { STARTING_CAPITAL } from "@/lib/config";

export async function POST() {
    try {
        // Load all open positions globally
        const openPositions = await prisma.position.findMany({
            where: { status: "open" },
            include: {
                asset: true,
                aiTrader: true,
            },
        });

        if (openPositions.length === 0) {
            return NextResponse.json({ message: "No open positions to manage", updated: 0 });
        }

        let updated = 0;
        const assetPriceCache = new Map<string, number>();

        for (const position of openPositions) {
            const sid = position.anonymousId || "global";
            
            let currentPrice = assetPriceCache.get(position.asset.symbol);
            if (currentPrice === undefined) {
                const result = await resolveInput(position.asset.symbol);
                currentPrice = result.success && result.data ? result.data.currentPrice : position.currentPrice;
                assetPriceCache.set(position.asset.symbol, currentPrice);
            }

            const { pnl, pnlPercent } = calculatePnl(
                position.direction,
                position.entryPrice,
                currentPrice,
                position.sizeUsd
            );

            await prisma.position.update({
                where: { id: position.id },
                data: { currentPrice, pnl, pnlPercent },
            });

            // Check stop loss / take profit
            let shouldClose = false;
            let closeReason = "";

            if (position.stopLoss && currentPrice <= position.stopLoss && position.direction === "long") {
                shouldClose = true;
                closeReason = "Stop loss triggered";
            }
            if (position.takeProfit && currentPrice >= position.takeProfit && position.direction === "long") {
                shouldClose = true;
                closeReason = "Take profit triggered";
            }
            if (position.stopLoss && currentPrice >= position.stopLoss && position.direction === "short") {
                shouldClose = true;
                closeReason = "Stop loss triggered";
            }
            if (position.takeProfit && currentPrice <= position.takeProfit && position.direction === "short") {
                shouldClose = true;
                closeReason = "Take profit triggered";
            }

            if (shouldClose) {
                await prisma.position.update({
                    where: { id: position.id },
                    data: {
                        status: "closed",
                        exitPrice: currentPrice,
                        pnl,
                        pnlPercent,
                        closedAt: new Date(),
                    },
                });

                // Get or create user stats for this trader
                const stats = await prisma.userTraderStats.upsert({
                    where: { anonymousId_aiTraderId: { anonymousId: sid, aiTraderId: position.aiTraderId } },
                    update: {},
                    create: {
                        anonymousId: sid,
                        aiTraderId: position.aiTraderId,
                        totalCapital: STARTING_CAPITAL,
                        availableCapital: STARTING_CAPITAL
                    }
                });

                const newAvailable = stats.availableCapital + position.sizeUsd + pnl;
                const newTotal = stats.totalCapital + pnl;

                await prisma.userTraderStats.update({
                    where: { id: stats.id },
                    data: {
                        availableCapital: Math.max(0, newAvailable),
                        totalCapital: Math.max(0, newTotal),
                        realizedPnl: stats.realizedPnl + pnl,
                        winningTrades: pnl > 0 ? { increment: 1 } : undefined,
                        losingTrades: pnl <= 0 ? { increment: 1 } : undefined,
                        lastActionSummary: `Closed ${position.direction} on ${position.asset.symbol}: ${closeReason} ($${pnl.toFixed(2)})`,
                    },
                });
            }

            updated++;
        }

        return NextResponse.json({ message: `Scanned ${updated} positions`, updated });
    } catch (error) {
        console.error("Cron manage positions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
