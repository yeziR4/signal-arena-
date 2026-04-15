import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const proofs = await prisma.testSpriteProof.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(proofs);
    } catch (error) {
        console.error("Proofs error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
