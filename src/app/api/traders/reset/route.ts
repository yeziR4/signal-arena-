import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { STARTING_CAPITAL } from "@/lib/config";
import { getAnonymousId } from "@/lib/auth-anonymous";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const anonymousId = await getAnonymousId();

    // 1. Delete user's positions
    await prisma.position.deleteMany({
      where: { anonymousId }
    });

    // 2. Delete user's trade decisions
    await prisma.tradeDecision.deleteMany({
      where: { anonymousId }
    });

    // 3. Reset user's specific stats
    await prisma.userTraderStats.updateMany({
      where: { anonymousId },
      data: {
        totalCapital: STARTING_CAPITAL,
        availableCapital: STARTING_CAPITAL,
        realizedPnl: 0,
        unrealizedPnl: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        lastActionSummary: "Portfolio reset by user.",
      },
    });

    return NextResponse.json({ success: true, message: "Your portfolio and visitor state have been reset successfully." });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: "Failed to reset portfolio" }, { status: 500 });
  }
}
