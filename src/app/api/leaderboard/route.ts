import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AI_MODELS, STARTING_CAPITAL } from "@/lib/config";
import { syncAiTraders, updateAllActivePositions } from "@/lib/pnl";
import { getAnonymousId } from "@/lib/auth-anonymous";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const anonymousId = await getAnonymousId();

        // Sync models and update PnL on every request
        await syncAiTraders();
        await updateAllActivePositions(anonymousId);

        // Fetch user-specific stats joined with global trader info
        const traders = await prisma.aiTrader.findMany({
            where: { enabled: true },
        });

        const leaderboardResults = [];

        for (const trader of traders) {
            // Find user stats for this trader
            const stats = await prisma.userTraderStats.findUnique({
                where: { anonymousId_aiTraderId: { anonymousId, aiTraderId: trader.id } }
            });

            // Count open positions for this user
            const openPositionsCount = await prisma.position.count({
                where: { anonymousId, aiTraderId: trader.id, status: "open" }
            });

            const currentTotalCapital = stats?.totalCapital ?? STARTING_CAPITAL;
            const currentAvailableCapital = stats?.availableCapital ?? STARTING_CAPITAL;
            const currentRealizedPnl = stats?.realizedPnl ?? 0;
            const currentUnrealizedPnl = stats?.unrealizedPnl ?? 0;
            const currentTotalTrades = stats?.totalTrades ?? 0;
            const currentWinningTrades = stats?.winningTrades ?? 0;

            const config = AI_MODELS.find(m => m.slug === trader.slug);

            leaderboardResults.push({
                id: trader.id,
                slug: trader.slug,
                name: trader.name,
                provider: trader.provider,
                iconUrl: config?.iconUrl,
                totalCapital: currentTotalCapital,
                availableCapital: currentAvailableCapital,
                startingCapital: STARTING_CAPITAL,
                roi: ((currentTotalCapital - STARTING_CAPITAL) / STARTING_CAPITAL) * 100,
                realizedPnl: currentRealizedPnl,
                unrealizedPnl: currentUnrealizedPnl,
                totalTrades: currentTotalTrades,
                winningTrades: currentWinningTrades,
                winRate: currentTotalTrades > 0
                    ? (currentWinningTrades / currentTotalTrades) * 100
                    : 0,
                openPositions: openPositionsCount,
                lastAction: stats?.lastActionSummary || "Awaiting trade...",
            });
        }

        // Sort by total capital
        leaderboardResults.sort((a, b) => b.totalCapital - a.totalCapital);

        // Add rank
        const ranked = leaderboardResults.map((item, index) => ({
            ...item,
            rank: index + 1
        }));

        return NextResponse.json(ranked);
    } catch (error) {
        console.error("Leaderboard error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
