/**
 * Extra Rules Routes — Beast Mastery, Arcanist, Artisan, Combat Experience
 *
 * All routes require auth (applied in main.ts) and adventurer middleware.
 *
 * Beast:
 *   POST /api/v1/extra/:id/beast/buy          { roll }
 *   POST /api/v1/extra/:id/beast/tame         { monsterName, roll }
 *   POST /api/v1/extra/:id/beast/train        { roll }
 *   POST /api/v1/extra/:id/beast/sell
 *   POST /api/v1/extra/:id/beast/ability      { ability, usesThisQuest }
 *   POST /api/v1/extra/:id/beast/deflect      { incomingDamage }
 *   POST /api/v1/extra/:id/beast/resurrect
 *
 * Arcanist:
 *   POST /api/v1/extra/:id/arcanist/become    { order }
 *   POST /api/v1/extra/:id/arcanist/learn     { spellTableRoll, cost? }
 *   POST /api/v1/extra/:id/arcanist/donate
 *   POST /api/v1/extra/:id/arcanist/conceal   { roll }
 *   POST /api/v1/extra/:id/arcanist/prism     { strRoll, dexRoll, intRoll }
 *
 * Artisan:
 *   POST /api/v1/extra/:id/artisan/unlock
 *   POST /api/v1/extra/:id/artisan/salvage    { itemName, roll, prefix? }
 *   POST /api/v1/extra/:id/artisan/craft      { itemName, roll }
 *   POST /api/v1/extra/:id/artisan/convert    { from, to, quantity }
 *   POST /api/v1/extra/:id/artisan/storage
 *   POST /api/v1/extra/:id/artisan/train      { type, contactsUsed }
 *
 * Combat Experience:
 *   POST /api/v1/extra/:id/combat-xp/kill     { monsterName, packDefeated? }
 *   GET  /api/v1/extra/:id/combat-xp          list all combat xp
 *   GET  /api/v1/extra/:id/combat-xp/:monster status for one monster
 */

import { Hono, Context } from "hono";
import { z } from "zod";
import { Repository } from "../repository.ts";
import { GameState } from "../models/gamestate.ts";
import { loadAdventurer } from "../middleware/adventurer.ts";
import { BeastService } from "../services/BeastService.ts";
import { ArcanistService } from "../services/ArcanistService.ts";
import { ArtisanService } from "../services/ArtisanService.ts";
import { CombatExperienceService } from "../services/CombatExperienceService.ts";

const extraRulesRoutes = new Hono<{
  Variables: { repository: Repository; gameState: GameState; adventurerId: string };
}>();

extraRulesRoutes.use("*", loadAdventurer);

const beastSvc = new BeastService();
const arcanistSvc = new ArcanistService();
const artisanSvc = new ArtisanService();
const combatXpSvc = new CombatExperienceService();

// ── Helpers ──────────────────────────────────────────────────────────────────

import { Adventurer } from "../models/adventurer.ts";

async function saveAndReturn(c: Context, adventurer: Adventurer) {
  const repo = c.get("repository") as Repository;
  const adventurerId = c.get("adventurerId") as string;
  const gameState = c.get("gameState") as GameState;
  const newState: GameState = { ...gameState, adventurer };
  await repo.saveAdventurer(adventurerId, newState);
  return newState;
}

// ── Beast ────────────────────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/beast/buy", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { roll } = z.object({ roll: z.number().int().min(1).max(100) }).parse(body);

  const { adventurer, result } = beastSvc.buyBeast(gameState.adventurer, { roll });
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, beast: newState.adventurer.beast });
});

extraRulesRoutes.post("/:id/beast/tame", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { monsterName, roll } = z.object({
    monsterName: z.string(),
    roll: z.number().int().min(1).max(100),
  }).parse(body);

  const { adventurer, result } = beastSvc.tameBeast(gameState.adventurer, { monsterName, roll });
  if (!result.success) return c.json({ error: result.message, extraDamageDice: result.extraDamageDice }, result.extraDamageDice ? 200 : 400);

  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, beast: newState.adventurer.beast });
});

extraRulesRoutes.post("/:id/beast/train", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { roll } = z.object({ roll: z.number().int().min(1).max(100) }).parse(body);

  const { adventurer, result } = beastSvc.trainBeast(gameState.adventurer, { roll });
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, leveledUp: result.leveledUp, beast: newState.adventurer.beast });
});

extraRulesRoutes.post("/:id/beast/sell", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const { adventurer, result } = beastSvc.sellBeast(gameState.adventurer);
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, goldGained: result.goldGained, gold: newState.adventurer.gold });
});

extraRulesRoutes.post("/:id/beast/ability", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { ability, usesThisQuest } = z.object({
    ability: z.string(),
    usesThisQuest: z.number().int().min(0),
  }).parse(body);

  const { adventurer: _adv, result } = beastSvc.useBeastAbility(gameState.adventurer, { ability, usesThisQuest });
  if (!result.success) return c.json({ error: result.message }, 400);
  return c.json({ message: result.message, effect: result.effect });
});

extraRulesRoutes.post("/:id/beast/deflect", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { incomingDamage } = z.object({ incomingDamage: z.number().int().min(0) }).parse(body);

  const { adventurer, beastDamage, adventurerDamage } = beastSvc.deflectDamage(gameState.adventurer, { incomingDamage });
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ beastDamage, adventurerDamage, beast: newState.adventurer.beast });
});

extraRulesRoutes.post("/:id/beast/resurrect", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const { adventurer, result } = beastSvc.dragonResurrect(gameState.adventurer);
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, dragon: newState.adventurer.beast });
});

// ── Arcanist ─────────────────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/arcanist/become", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { order } = z.object({
    order: z.enum(["Alchemy", "Elements", "Illusion", "Invocation", "Psyche", "Summoning", "Esoteric"]),
  }).parse(body);

  const { result } = arcanistSvc.becomeArcanist(gameState.adventurer, { order });
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState = await saveAndReturn(c, result.adventurer);
  return c.json({ message: result.message, arcanist: newState.adventurer.arcanist });
});

extraRulesRoutes.post("/:id/arcanist/learn", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { spellTableRoll, cost } = z.object({
    spellTableRoll: z.number().int().min(1).max(100),
    cost: z.number().int().min(0).optional(),
  }).parse(body);

  const { result } = arcanistSvc.learnSpell(gameState.adventurer, { spellTableRoll, cost });
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState = await saveAndReturn(c, result.adventurer);
  return c.json({ message: result.message, arcanist: newState.adventurer.arcanist });
});

extraRulesRoutes.post("/:id/arcanist/donate", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const { result } = arcanistSvc.payDonation(gameState.adventurer);
  if (!result.success) return c.json({ error: result.message, arcaneLawBroken: result.arcaneLawBroken }, 400);

  const newState = await saveAndReturn(c, result.adventurer);
  return c.json({ message: result.message, gold: newState.adventurer.gold });
});

extraRulesRoutes.post("/:id/arcanist/conceal", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { roll } = z.object({ roll: z.number().int().min(1).max(100) }).parse(body);

  const { result } = arcanistSvc.checkArcaneLawConcealment(gameState.adventurer, { roll });
  const newState = await saveAndReturn(c, result.adventurer);
  return c.json({ concealed: result.concealed, sentToPrism: result.sentToPrism, adventurer: newState.adventurer });
});

extraRulesRoutes.post("/:id/arcanist/prism", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { strRoll, dexRoll, intRoll } = z.object({
    strRoll: z.number().int().min(1).max(100),
    dexRoll: z.number().int().min(1).max(100),
    intRoll: z.number().int().min(1).max(100),
  }).parse(body);

  const { result } = arcanistSvc.surviveArcanePrism(gameState.adventurer, { strRoll, dexRoll, intRoll });
  if (result.survived) {
    const newState = await saveAndReturn(c, result.adventurer);
    return c.json({ survived: true, message: result.message, adventurer: newState.adventurer });
  }
  return c.json({ survived: false, message: result.message }, 200);
});

// ── Artisan ──────────────────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/artisan/unlock", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const { adventurer, result } = artisanSvc.unlock(gameState.adventurer);
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, artisan: newState.adventurer.artisan, gold: newState.adventurer.gold });
});

extraRulesRoutes.post("/:id/artisan/salvage", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const input = z.object({
    itemName: z.string(),
    roll: z.number().int().min(1).max(100),
    prefix: z.enum(["standard", "finer", "greater", "superior", "legend"]).optional(),
  }).parse(body);

  const { adventurer, result } = artisanSvc.salvage(gameState.adventurer, input);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({
    success: result.success,
    message: result.message,
    doubled: result.doubled,
    experienceGained: result.experienceGained,
    materials: newState.adventurer.artisan?.materials,
  });
});

extraRulesRoutes.post("/:id/artisan/craft", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { itemName, roll } = z.object({
    itemName: z.string(),
    roll: z.number().int().min(1).max(100),
  }).parse(body);

  const { adventurer, result } = artisanSvc.craft(gameState.adventurer, { itemName, roll });
  const newState = await saveAndReturn(c, adventurer);
  return c.json({
    success: result.success,
    message: result.message,
    craftedItem: result.craftedItem,
    schematicLearned: result.schematicLearned,
    materials: newState.adventurer.artisan?.materials,
  });
});

extraRulesRoutes.post("/:id/artisan/convert", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const input = z.object({
    from: z.string(),
    to: z.string(),
    quantity: z.number().int().min(1),
  }).parse(body);

  const { adventurer, result } = artisanSvc.convertMaterials(gameState.adventurer, input);
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, materials: newState.adventurer.artisan?.materials });
});

extraRulesRoutes.post("/:id/artisan/storage", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const { adventurer, result } = artisanSvc.payGuildStorage(gameState.adventurer);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({
    success: result.success,
    message: result.message,
    gold: newState.adventurer.gold,
    artisan: newState.adventurer.artisan,
  }, result.success ? 200 : 200);
});

extraRulesRoutes.post("/:id/artisan/train", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const input = z.object({
    type: z.enum(["Salvage", "Crafting", "Art"]),
    contactsUsed: z.number().int().min(0),
  }).parse(body);

  const { adventurer, result } = artisanSvc.trainAtGuild(gameState.adventurer, input);
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, artisan: newState.adventurer.artisan, gold: newState.adventurer.gold });
});

// ── Combat Experience ─────────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/combat-xp/kill", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { monsterName, packDefeated } = z.object({
    monsterName: z.string(),
    packDefeated: z.boolean().optional(),
  }).parse(body);

  const killResult = combatXpSvc.recordKill(gameState.adventurer, { monsterName, packDefeated });
  const newState = await saveAndReturn(c, killResult.adventurer);
  return c.json({
    pipAwarded: killResult.pipAwarded,
    pips: killResult.currentPips,
    newlyUnlocked: killResult.newlyUnlocked,
    pipsTotal: newState.adventurer.combatExperience[monsterName] ?? 0,
  });
});

extraRulesRoutes.get("/:id/combat-xp", (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const all = combatXpSvc.getAllMonsterStats(gameState.adventurer);
  return c.json({ combatExperience: all });
});

extraRulesRoutes.get("/:id/combat-xp/:monster", (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const monster = c.req.param("monster");
  const status = combatXpSvc.getCombatStatus(gameState.adventurer, monster);
  return c.json(status);
});

export default extraRulesRoutes;
