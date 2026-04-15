import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AI_MODELS } from "@/lib/config";
import { updateAllActivePositions } from "@/lib/pnl";
import { getAnonymousId } from "@/lib/auth-anonymous";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || undefined;
        const traderId = searchParams.get("traderId") || undefined;
        const type = searchParams.get("type") || undefined;

        // Step 0: Identify user
        const anonymousId = await getAnonymousId();

        // Refresh PnL if looking for open positions
        if (status === "open" || !status) {
            await updateAllActivePositions(anonymousId);
        }

        const positions = await prisma.position.findMany({
            where: {
                anonymousId: anonymousId,
                ...(status && { status }),
                ...(traderId && { aiTraderId: traderId }),
                ...(type && { asset: { type } }),
            },
            include: {
                asset: { select: { symbol: true, name: true, type: true, metadata: true } },
                aiTrader: { select: { name: true, slug: true } },
            },
            orderBy: { openedAt: "desc" },
            take: 100,
        });

        // Add iconUrl to each aiTrader and asset
        const enhanced = positions.map(pos => {
            const config = AI_MODELS.find(m => m.slug === pos.aiTrader.slug);
            const assetMetadata = JSON.parse(pos.asset.metadata || "{}");
            
            return {
                ...pos,
                asset: {
                    ...pos.asset,
                    iconUrl: assetMetadata.iconUrl
                },
                aiTrader: {
                    ...pos.aiTrader,
                    iconUrl: config?.iconUrl
                }
            };
        });

        return NextResponse.json(enhanced);
    } catch (error) {
        console.error("Positions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
