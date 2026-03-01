import { Hono, Context } from "hono";
import { z } from "zod";
import { loadAdventurer } from "../middleware/adventurer.ts";
import { Repository } from "../repository.ts";
import { GameState } from "../models/gamestate.ts";
import { QuestMakerService } from "../services/QuestMakerService.ts";
import { CAMPAIGN_QUESTS, getCampaignQuest, getNextCampaignQuest } from "../data/campaign_quests.ts";
import { SIDE_QUESTS, lookupSideQuest, getSideQuest } from "../data/side_quests.ts";

const questRoutes = new Hono<{ Variables: { repository: Repository; gameState: GameState; adventurerId: string } }>();
const questMakerService = new QuestMakerService();

questRoutes.use("*", loadAdventurer);

// ── Quest Maker ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/quests/generate
 * Procedurally generate a new quest using the Quest Maker table.
 * Body: { objectiveRolls: number[], modifierRoll: number, rewardRoll: number }
 * All rolls are provided by the client (deterministic, testable).
 */
questRoutes.post("/generate", async (c: Context) => {
    const body = await c.req.json();

    const schema = z.object({
        objectiveRolls: z.array(z.number().int().min(1).max(100)).min(1).max(5),
        modifierRoll:   z.number().int().min(1).max(100),
        rewardRoll:     z.number().int().min(1).max(10),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error }, 400);

    const quest = questMakerService.generate(parsed.data);
    return c.json({ quest });
});

// ── Campaign Quests ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/quests/campaign
 * List all 20 campaign quests with their definitions.
 */
questRoutes.get("/campaign", (c: Context) => {
    return c.json({ quests: CAMPAIGN_QUESTS });
});

/**
 * GET /api/v1/quests/campaign/:id
 * Get a specific campaign quest definition (e.g. CQ1 through CQ20).
 */
questRoutes.get("/campaign/:id", (c: Context) => {
    const id = c.req.param("id").toUpperCase();
    const quest = getCampaignQuest(id);
    if (!quest) return c.json({ error: `Campaign quest '${id}' not found` }, 404);
    return c.json({ quest });
});

/**
 * GET /api/v1/quests/campaign/status
 * Get the current adventurer's campaign quest progress.
 */
questRoutes.get("/campaign/status", (c: Context) => {
    const gameState = c.get("gameState");
    return c.json({ campaignQuests: gameState.adventurer.campaignQuests ?? {} });
});

/**
 * POST /api/v1/quests/campaign/:id/complete
 * Mark a campaign quest as complete or failed for the current adventurer.
 * Body: { outcome: "complete" | "failed" }
 */
questRoutes.post("/campaign/:id/complete", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");

    const id = c.req.param("id").toUpperCase();
    const quest = getCampaignQuest(id);
    if (!quest) return c.json({ error: `Campaign quest '${id}' not found` }, 404);

    const body = await c.req.json();
    const { outcome } = z.object({ outcome: z.enum(["complete", "failed"]) }).parse(body);

    const updatedAdventurer = {
        ...gameState.adventurer,
        campaignQuests: {
            ...(gameState.adventurer.campaignQuests ?? {}),
            [id]: outcome,
        },
    };

    // Also track total quests completed/failed
    const questsCompleted = (gameState.adventurer.questsCompleted ?? 0) + (outcome === "complete" ? 1 : 0);
    const questsFailed    = (gameState.adventurer.questsFailed    ?? 0) + (outcome === "failed"   ? 1 : 0);

    const finalAdventurer = { ...updatedAdventurer, questsCompleted, questsFailed };
    const newState: GameState = { ...gameState, adventurer: finalAdventurer };
    await repo.saveAdventurer(adventurerId, newState);

    const next = outcome === "complete" ? getNextCampaignQuest(quest.order) : null;

    return c.json({
        message: `Campaign quest ${id} marked as ${outcome}.`,
        state: newState,
        nextQuest: next ?? null,
    });
});

// ── Side Quests ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/quests/side
 * List all 25 side quests.
 */
questRoutes.get("/side", (c: Context) => {
    return c.json({ quests: SIDE_QUESTS });
});

/**
 * GET /api/v1/quests/side/roll?roll=<1-100>
 * Look up a side quest by a d100 roll (or return the rolled quest).
 * If `roll` query param is omitted, the server rolls for the client.
 */
questRoutes.get("/side/roll", (c: Context) => {
    const rollParam = c.req.query("roll");
    const roll = rollParam ? parseInt(rollParam, 10) : Math.ceil(Math.random() * 100);

    if (isNaN(roll) || roll < 1 || roll > 100) {
        return c.json({ error: "roll must be an integer between 1 and 100" }, 400);
    }

    const quest = lookupSideQuest(roll);
    if (!quest) return c.json({ error: "No side quest found for that roll" }, 404);

    return c.json({ roll, quest });
});

/**
 * GET /api/v1/quests/side/:id
 * Get a specific side quest by its id (e.g. QAA through QAY).
 */
questRoutes.get("/side/:id", (c: Context) => {
    const id = c.req.param("id").toUpperCase();
    const quest = getSideQuest(id);
    if (!quest) return c.json({ error: `Side quest '${id}' not found` }, 404);
    return c.json({ quest });
});

/**
 * POST /api/v1/quests/side/:id/complete
 * Mark a side quest as complete or failed for the current adventurer.
 * Body: { outcome: "complete" | "failed" }
 */
questRoutes.post("/side/:id/complete", async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");

    const id = c.req.param("id").toUpperCase();
    const quest = getSideQuest(id);
    if (!quest) return c.json({ error: `Side quest '${id}' not found` }, 404);

    const body = await c.req.json();
    const { outcome } = z.object({ outcome: z.enum(["complete", "failed"]) }).parse(body);

    const updatedAdventurer = {
        ...gameState.adventurer,
        sideQuests: {
            ...(gameState.adventurer.sideQuests ?? {}),
            [id]: outcome,
        },
        questsCompleted: (gameState.adventurer.questsCompleted ?? 0) + (outcome === "complete" ? 1 : 0),
        questsFailed:    (gameState.adventurer.questsFailed    ?? 0) + (outcome === "failed"   ? 1 : 0),
    };

    const newState: GameState = { ...gameState, adventurer: updatedAdventurer };
    await repo.saveAdventurer(adventurerId, newState);

    return c.json({
        message: `Side quest ${id} marked as ${outcome}.`,
        state: newState,
    });
});

export default questRoutes;
