import { Hono, Context } from "hono";
import { loadAdventurer } from "../middleware/adventurer.ts";
import { DowntimeService } from "../services/DowntimeService.ts";
import { WitcheryService } from "../services/WitcheryService.ts";
import { Book1TableService } from "../services/table_service.ts";
import { Repository } from "../repository.ts";
import { GameState } from "../models/gamestate.ts";
import { z } from "zod";

const downtimeRoutes = new Hono<{ Variables: { repository: Repository, gameState: GameState, adventurerId: string } }>();
const downtimeService = new DowntimeService(new Book1TableService());
const witcheryService = new WitcheryService();

downtimeRoutes.use("*", loadAdventurer);

// POST /api/v1/downtime/refresh
downtimeRoutes.post("/refresh", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");

    const newState = downtimeService.refreshTracks(gameState);
    await repo.saveAdventurer(adventurerId, newState);

    return c.json({ message: "Tracks refreshed", state: newState });
});

// POST /api/v1/downtime/heal
downtimeRoutes.post("/heal", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");
    const body = await c.req.json();

    const { amount } = z.object({ amount: z.number().int().min(1) }).parse(body);
    
    try {
        const newState = downtimeService.heal(gameState, amount);
        await repo.saveAdventurer(adventurerId, newState);
        return c.json({ message: `Healed ${amount} HP`, state: newState });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 400);
    }
});

// POST /api/v1/downtime/repair
downtimeRoutes.post("/repair", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");
    const body = await c.req.json();

    const schema = z.object({ itemId: z.string(), pips: z.number().int().min(1) });
    const { itemId, pips } = schema.parse(body);

    try {
        const newState = downtimeService.repairItem(gameState, itemId, pips);
        await repo.saveAdventurer(adventurerId, newState);
        return c.json({ message: "Item repaired", state: newState });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 400);
    }
});

// POST /api/v1/downtime/sell
downtimeRoutes.post("/sell", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");
    const body = await c.req.json();

    const { itemId } = z.object({ itemId: z.string() }).parse(body);

    try {
        const newState = downtimeService.sellItem(gameState, itemId);
        await repo.saveAdventurer(adventurerId, newState);
        return c.json({ message: "Item sold", state: newState });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 400);
    }
});

// POST /api/v1/downtime/buy-needed
downtimeRoutes.post("/buy-needed", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");
    const body = await c.req.json();

    const { itemName } = z.object({ itemName: z.string() }).parse(body);

    try {
        const newState = downtimeService.buyNeededItem(gameState, itemName);
        await repo.saveAdventurer(adventurerId, newState);
        return c.json({ message: `Bought ${itemName}`, state: newState });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 400);
    }
});

// POST /api/v1/downtime/search-market
downtimeRoutes.post("/search-market", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");
    const body = await c.req.json();

    const schema = z.object({ table: z.enum(["A", "W"]), roll: z.number().int().min(1).max(100) });
    const { table, roll } = schema.parse(body);

    try {
        const newState = downtimeService.buyMarketItem(gameState, table, roll);
        await repo.saveAdventurer(adventurerId, newState);
        return c.json({ message: "Market item bought", state: newState });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 400);
    }
});

// POST /api/v1/downtime/train
downtimeRoutes.post("/train", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");
    const body = await c.req.json();

    const schema = z.object({ target: z.string(), pips: z.number().int().min(1) });
    const { target, pips } = schema.parse(body);

    try {
        const newState = downtimeService.train(gameState, target, pips);
        await repo.saveAdventurer(adventurerId, newState);
        return c.json({ message: `Trained ${target}`, state: newState });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 400);
    }
});

// POST /api/v1/downtime/magic-tuition
downtimeRoutes.post("/magic-tuition", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");
    const body = await c.req.json();

    const schema = z.object({ spellName: z.string(), pips: z.number().int().min(1) });
    const { spellName, pips } = schema.parse(body);

    try {
        const newState = downtimeService.magicTuition(gameState, spellName, pips);
        await repo.saveAdventurer(adventurerId, newState);
        return c.json({ message: `Received tuition for ${spellName}`, state: newState });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 400);
    }
});

// POST /api/v1/downtime/empire-building
downtimeRoutes.post("/empire-building", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");
    const body = await c.req.json();

    // Map of investment name to 1d100 roll
    const rolls = z.record(z.string(), z.number().int().min(1).max(100)).parse(body);

    try {
        const newState = downtimeService.processInvestments(gameState, rolls);
        await repo.saveAdventurer(adventurerId, newState);
        return c.json({ message: "Empire building processed", state: newState });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 400);
    }
});

// POST /api/v1/downtime/witchery
// WITCHERY — combine 3 monster parts to create a potion/anointment
downtimeRoutes.post("/witchery", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");
    const body = await c.req.json();

    const schema = z.object({
        parts:     z.tuple([z.string(), z.string(), z.string()]),
        roll:      z.number().int().min(1).max(100),
        tableRoll: z.number().int().min(1).max(100),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error }, 400);

    const { adventurer: updatedAdv, result } = witcheryService.attempt(
        gameState.adventurer,
        parsed.data
    );

    const newState: GameState = { ...gameState, adventurer: updatedAdv };
    await repo.saveAdventurer(adventurerId, newState);

    return c.json({ result, state: newState });
});

// POST /api/v1/downtime/witchery/clear
// Clear witchery effects and mishaps at end of quest
downtimeRoutes.post("/witchery/clear", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");

    const updatedAdv = witcheryService.clearQuestEffects(gameState.adventurer);
    const newState: GameState = { ...gameState, adventurer: updatedAdv };
    await repo.saveAdventurer(adventurerId, newState);

    return c.json({ message: "Witchery effects cleared.", state: newState });
});

export default downtimeRoutes;
