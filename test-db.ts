import { createClient } from "@libsql/client";
import { join } from "path";

const dbPath = join(process.cwd(), "dev.db");
console.log("DB path:", dbPath);

const client = createClient({ url: `file:${dbPath}` });

async function main() {
    try {
        console.log("--- POSITIONS ---");
        const positions = await client.execute("SELECT id, direction, status, sizeUsd, entryPrice, currentPrice, pnl, openedAt, aiTraderId FROM Position ORDER BY openedAt DESC LIMIT 20");
        console.table(positions.rows);

        console.log("\n--- AI TRADERS ---");
        const traders = await client.execute("SELECT name, slug, availableCapital, totalCapital, unrealizedPnl FROM AiTrader");
        console.table(traders.rows);

        console.log("\n--- TRADES LOG ---");
        const decisions = await client.execute("SELECT createdAt, aiTraderId, action, direction, sizeUsd FROM TradeDecision ORDER BY createdAt DESC LIMIT 10");
        console.table(decisions.rows);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
