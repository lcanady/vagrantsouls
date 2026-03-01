// src/routes/guilds.ts
import { Hono, Context } from "hono";
import { z } from "zod";
import { Repository, GuildMemberRecord } from "../repository.ts";
import { GameState } from "../models/gamestate.ts";
import { loadAdventurer } from "../middleware/adventurer.ts";
import { GUILDS, getGuildById, rankForStanding } from "../data/guilds.ts";
import { GuildService } from "../services/GuildService.ts";

const guildService = new GuildService();

const guildsRoutes = new Hono<{
  Variables: {
    repository: Repository;
    gameState: GameState;
    adventurerId: string;
  };
}>();

// ----------------------------------------------------------------
// Public routes — no auth required
// ----------------------------------------------------------------

/** List all guilds with basic info. */
guildsRoutes.get("/", (c: Context) => {
  const summary = GUILDS.map((g) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    description: g.description,
    compatiblePaths: g.compatiblePaths,
  }));
  return c.json({ guilds: summary });
});

/** Guild details including full rank/benefit table and current leaderboard. */
guildsRoutes.get("/:guildId", async (c: Context) => {
  const { guildId } = c.req.param();
  const guild = getGuildById(guildId);
  if (!guild) return c.json({ error: "Guild not found." }, 404);

  const repo = c.get("repository") as Repository;
  const leaderboard = await repo.listGuildMembers(guildId);

  return c.json({ guild, leaderboard: leaderboard.slice(0, 20) });
});

/** Event feed for the Discord bot. Returns last 20 events (newest first). */
guildsRoutes.get("/:guildId/events", async (c: Context) => {
  const { guildId } = c.req.param();
  if (!getGuildById(guildId)) return c.json({ error: "Guild not found." }, 404);

  const repo = c.get("repository") as Repository;
  const events = await repo.getGuildEvents(guildId);
  return c.json({ guildId, events });
});

// ----------------------------------------------------------------
// Protected adventurer routes — auth applied in main.ts
// ----------------------------------------------------------------

guildsRoutes.use("/adventurer/*", loadAdventurer);

/** Get current guild status for this adventurer. */
guildsRoutes.get("/adventurer/:id/status", (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  if (!gameState.adventurer.guildId) {
    return c.json({ guildId: null, message: "Not a member of any guild." });
  }
  const status = guildService.getStatus(gameState.adventurer);
  if (!status) {
    return c.json({ error: "Guild data inconsistency. This adventurer's guildId references an unknown guild." }, 500);
  }
  return c.json(status);
});

/** Join a guild. Body: { guildId: string } */
guildsRoutes.post("/adventurer/:id/join", async (c: Context) => {
  const repo = c.get("repository") as Repository;
  const adventurerId = c.get("adventurerId") as string;
  const gameState = c.get("gameState") as GameState;

  const body = await c.req.json();
  const { guildId } = z.object({ guildId: z.string() }).parse(body);

  const { adventurer, result } = guildService.joinGuild(gameState.adventurer, guildId);
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState: GameState = { ...gameState, adventurer };
  await repo.saveAdventurer(adventurerId, newState);

  const memberRecord: GuildMemberRecord = {
    adventurerId,
    adventurerName: adventurer.name,
    standing: adventurer.guildStanding,
    rank: rankForStanding(adventurer.guildStanding),
  };
  await repo.saveGuildMember(guildId, adventurerId, memberRecord);

  if (result.event) await repo.addGuildEvent(guildId, result.event);

  return c.json({
    message: result.message,
    guildId,
    standing: adventurer.guildStanding,
    rank: rankForStanding(adventurer.guildStanding),
  });
});

/** Leave current guild. Standing resets to 0. */
guildsRoutes.post("/adventurer/:id/leave", async (c: Context) => {
  const repo = c.get("repository") as Repository;
  const adventurerId = c.get("adventurerId") as string;
  const gameState = c.get("gameState") as GameState;

  const { adventurer, result } = guildService.leaveGuild(gameState.adventurer);
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState: GameState = { ...gameState, adventurer };
  await repo.saveAdventurer(adventurerId, newState);

  if (result.previousGuildId) {
    await repo.removeGuildMember(result.previousGuildId, adventurerId);
    if (result.event) await repo.addGuildEvent(result.previousGuildId, result.event);
  }

  return c.json({ message: result.message });
});

/**
 * Contribute gold to gain standing.
 * Body: { gold: number } — must be at least 10.
 */
guildsRoutes.post("/adventurer/:id/contribute", async (c: Context) => {
  const repo = c.get("repository") as Repository;
  const adventurerId = c.get("adventurerId") as string;
  const gameState = c.get("gameState") as GameState;

  const body = await c.req.json();
  const { gold } = z.object({ gold: z.number().int().min(10) }).parse(body);

  const { adventurer, result } = guildService.contribute(gameState.adventurer, gold);
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState: GameState = { ...gameState, adventurer };
  await repo.saveAdventurer(adventurerId, newState);

  if (adventurer.guildId) {
    const memberRecord: GuildMemberRecord = {
      adventurerId,
      adventurerName: adventurer.name,
      standing: adventurer.guildStanding,
      rank: rankForStanding(adventurer.guildStanding),
    };
    await repo.saveGuildMember(adventurer.guildId, adventurerId, memberRecord);

    if (result.event) await repo.addGuildEvent(adventurer.guildId, result.event);
  }

  return c.json({
    message: result.message,
    standing: adventurer.guildStanding,
    rank: rankForStanding(adventurer.guildStanding),
    goldSpent: result.goldSpent,
    standingGained: result.standingGained,
    rankChanged: result.rankChanged ?? false,
    newRank: result.newRank,
  });
});

export default guildsRoutes;
