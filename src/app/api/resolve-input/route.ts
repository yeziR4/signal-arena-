import { NextResponse } from "next/server";
import { resolveInput } from "@/lib/providers/resolver";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { input } = body;

        if (!input || typeof input !== "string") {
            return NextResponse.json(
                { error: "Input is required" },
                { status: 400 }
            );
        }

        const result = await resolveInput(input);

        if (!result.success || !result.data) {
            return NextResponse.json(
                { error: result.error || "Could not resolve market" },
                { status: 404 }
            );
        }

        // Upsert asset in database
        const asset = await prisma.asset.upsert({
            where: {
                symbol_type: {
                    symbol: result.data.symbol,
                    type: result.data.type,
                },
            },
            update: {
                name: result.data.name,
                source: result.data.source,
            },
            create: {
                symbol: result.data.symbol,
                name: result.data.name,
                type: result.data.type,
                source: result.data.source,
                externalId: result.data.id,
            },
        });

        // Create market snapshot
        await prisma.marketSnapshot.create({
            data: {
                assetId: asset.id,
                price: result.data.currentPrice,
                change24h: result.data.change24h,
                volume: result.data.metadata.volume ?? null,
                probabilityYes: result.data.metadata.probabilityYes ?? null,
                probabilityNo: result.data.metadata.probabilityNo ?? null,
            },
        });

        return NextResponse.json({
            asset,
            market: result.data,
        });
    } catch (error) {
        console.error("Resolve input error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
