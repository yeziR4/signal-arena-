import prisma from "./prisma";
import { AI_MODELS, STARTING_CAPITAL } from "./config";
import { resolveInput } from "./providers/resolver";
import { calculatePnl } from "./capital";

/**
 * Ensures the database aiTraders match the official AI_MODELS roster.
 */
export async function syncAiTraders() {
    const configSlugs = AI_MODELS.map(m => m.slug);

    // 1. Deactivate or delete traders not in config
    await prisma.aiTrader.updateMany({
        where: {
            slug: { notIn: configSlugs },
            enabled: true
        },
        data: { enabled: false }
    });

    // 2. Ensure all config models exist and are updated
    for (const model of AI_MODELS) {
        await prisma.aiTrader.upsert({
            where: { slug: model.slug },
            update: {
                name: model.name,
                modelKey: model.modelKey,
                provider: model.provider,
                enabled: true
            },
            create: {
                slug: model.slug,
                name: model.name,
                modelKey: model.modelKey,
                provider: model.provider,
                enabled: true,
                startingCapital: STARTING_CAPITAL,
                totalCapital: STARTING_CAPITAL,
                availableCapital: STARTING_CAPITAL,
            }
        });
    }
}

/**
 * Updates prices and PnL for all active positions.
 */
export async function updateAllActivePositions(targetAnonymousId?: string) {
    const whereClause: any = { status: "open" };
    if (targetAnonymousId) {
        whereClause.anonymousId = targetAnonymousId;
    }

    const openPositions = await prisma.position.findMany({
        where: whereClause,
        include: {
            asset: true,
            aiTrader: true,
        },
    });

    if (openPositions.length === 0) return;

    const assetPriceCache = new Map<string, { price: number, iconUrl?: string }>();

    // 1. Update individual positions
    for (const position of openPositions) {
        let currentData = assetPriceCache.get(position.asset.symbol);
        
        if (!currentData) {
            const result = await resolveInput(position.asset.symbol);
            if (result.success && result.data) {
                currentData = { 
                    price: result.data.currentPrice, 
                    iconUrl: result.data.iconUrl 
                };
                assetPriceCache.set(position.asset.symbol, currentData);
            }
        }

        if (currentData) {
            try {
                const { pnl, pnlPercent } = calculatePnl(
                    position.direction,
                    position.entryPrice,
                    currentData.price,
                    position.sizeUsd
                );

                await prisma.position.update({
                    where: { id: position.id },
                    data: { 
                        currentPrice: currentData.price, 
                        pnl, 
                        pnlPercent 
                    },
                });

                if (currentData.iconUrl) {
                    const currentMetadata = JSON.parse(position.asset.metadata || "{}");
                    if (!currentMetadata.iconUrl) {
                        await prisma.asset.update({
                            where: { id: position.assetId },
                            data: { 
                                metadata: JSON.stringify({ ...currentMetadata, iconUrl: currentData.iconUrl })
                            }
                        });
                    }
                }
            } catch (posError: any) {
                console.error(`Failed to update position ${position.id}:`, posError.message);
            }
        }
    }

    // 2. Identify unique (anonymousId, aiTraderId) pairs that need stat updates
    const userTraderPairs = new Set<string>();
    for (const pos of openPositions) {
        const sid = pos.anonymousId || "global";
        userTraderPairs.add(`${sid}|${pos.aiTraderId}`);
    }

    // 3. Update UserTraderStats
    for (const pair of userTraderPairs) {
        const [anonymousId, aiTraderId] = pair.split("|");
        
        try {
            // Get all open positions for this user/trader pair
            const activePositions = await prisma.position.findMany({
                where: { anonymousId, aiTraderId, status: "open" }
            });

            // Get the current persistent stats for this user/trader
            const stats = await prisma.userTraderStats.upsert({
                where: { anonymousId_aiTraderId: { anonymousId, aiTraderId } },
                update: {},
                create: { 
                    anonymousId, 
                    aiTraderId,
                    totalCapital: STARTING_CAPITAL,
                    availableCapital: STARTING_CAPITAL
                }
            });

            const unrealizedPnl = activePositions.reduce((sum, p) => sum + p.pnl, 0);
            const totalCapital = STARTING_CAPITAL + stats.realizedPnl + unrealizedPnl;

            await prisma.userTraderStats.update({
                where: { id: stats.id },
                data: { 
                    unrealizedPnl,
                    totalCapital: Math.max(0, totalCapital)
                }
            });
        } catch (err: any) {
            console.error(`Failed to update UserTraderStats for ${pair}:`, err.message);
        }
    }
}
