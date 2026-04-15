/**
 * Capital management logic for AI traders
 */

export function calculatePnl(
    direction: string,
    entryPrice: number,
    currentPrice: number,
    sizeUsd: number
): { pnl: number; pnlPercent: number } {
    let pnlPercent = 0;

    switch (direction) {
        case "long":
            pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
            break;
        case "short":
            pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
            break;
        case "yes":
            // For prediction markets, price is probability (0-1)
            // PnL based on probability change
            pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
            break;
        case "no":
            pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
            break;
        default:
            pnlPercent = 0;
    }

    const pnl = sizeUsd * (pnlPercent / 100);

    return {
        pnl: parseFloat(pnl.toFixed(2)),
        pnlPercent: parseFloat(pnlPercent.toFixed(2)),
    };
}

export function canOpenPosition(
    availableCapital: number,
    requestedSize: number,
    currentOpenPositions: number,
    maxOpenPositions: number = 3
): { allowed: boolean; reason?: string } {
    if (currentOpenPositions >= maxOpenPositions) {
        return { allowed: false, reason: `Maximum ${maxOpenPositions} open positions reached` };
    }

    if (requestedSize > availableCapital) {
        return { allowed: false, reason: `Requested size ($${requestedSize}) exceeds available capital ($${availableCapital})` };
    }

    if (requestedSize <= 0) {
        return { allowed: false, reason: "Position size must be positive" };
    }

    return { allowed: true };
}

export function reserveCapital(
    availableCapital: number,
    sizeUsd: number
): number {
    return parseFloat((availableCapital - sizeUsd).toFixed(2));
}

export function releaseCapital(
    availableCapital: number,
    sizeUsd: number,
    pnl: number
): { newAvailable: number; newTotal: number } {
    const returned = sizeUsd + pnl;
    return {
        newAvailable: parseFloat((availableCapital + returned).toFixed(2)),
        newTotal: 0, // caller should compute from all positions
    };
}
