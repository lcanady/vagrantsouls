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
// Book 8 services
import { ButcheryService } from "../services/ButcheryService.ts";
import { DualWieldService } from "../services/DualWieldService.ts";
import { WeaponProficiencyService } from "../services/WeaponProficiencyService.ts";
import { CheatDeathService } from "../services/CheatDeathService.ts";
import { PursuitService } from "../services/PursuitService.ts";
import { SecretPassagewayService } from "../services/SecretPassagewayService.ts";
import { MonsterVariantService } from "../services/MonsterVariantService.ts";
import { HonourPointsService } from "../services/HonourPointsService.ts";
import { AccoladeService } from "../services/AccoladeService.ts";
import { HeroicItemService } from "../services/HeroicItemService.ts";
import { EpicDungeonService } from "../services/EpicDungeonService.ts";
import { IdentifyService } from "../services/IdentifyService.ts";
import { YellowEventService } from "../services/YellowEventService.ts";
import { AmmunitionService } from "../services/AmmunitionService.ts";
import { ThrowService } from "../services/ThrowService.ts";
import { AimedAttackService, type AimLocation } from "../services/AimedAttackService.ts";
import { EquipmentModService } from "../services/EquipmentModService.ts";
import { SpellManaService } from "../services/SpellManaService.ts";

const extraRulesRoutes = new Hono<{
  Variables: { repository: Repository; gameState: GameState; adventurerId: string };
}>();

extraRulesRoutes.use("*", loadAdventurer);

const beastSvc = new BeastService();
const arcanistSvc = new ArcanistService();
const artisanSvc = new ArtisanService();
const combatXpSvc = new CombatExperienceService();
// Book 8
const butcherySvc = new ButcheryService();
const dualWieldSvc = new DualWieldService();
const weaponProfSvc = new WeaponProficiencyService();
const cheatDeathSvc = new CheatDeathService();
const pursuitSvc = new PursuitService();
const secretPassageSvc = new SecretPassagewayService();
const monsterVariantSvc = new MonsterVariantService();
const honourSvc = new HonourPointsService();
const accoladeSvc = new AccoladeService();
const heroicItemSvc = new HeroicItemService();
const epicDungeonSvc = new EpicDungeonService();
const identifySvc = new IdentifyService();
const yellowEventSvc = new YellowEventService();
const ammoSvc = new AmmunitionService();
const throwSvc = new ThrowService();
const aimedAttackSvc = new AimedAttackService();
const equipModSvc = new EquipmentModService();
const spellManaSvc = new SpellManaService();

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

// ── Book 8: Butchery ──────────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/butchery/shade", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const { adventurer, result } = butcherySvc.shadePip(gameState.adventurer);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ ...result, butchery: newState.adventurer.butchery });
});

extraRulesRoutes.post("/:id/butchery/loot", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { tableId, rolls } = z.object({
    tableId: z.string(),
    rolls: z.array(z.number().int().min(1).max(100)),
  }).parse(body);
  const { adventurer, result } = butcherySvc.rollLoot(gameState.adventurer, tableId, rolls);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ ...result, butchery: newState.adventurer.butchery });
});

// ── Book 8: Dual Wield ────────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/dual-wield/train", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const { adventurer, result } = dualWieldSvc.trainDualWield(gameState.adventurer);
  if (!result.success) return c.json({ error: result.message }, 400);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, dualWield: newState.adventurer.dualWield, gold: newState.adventurer.gold });
});

// ── Book 8: Weapon Proficiency ────────────────────────────────────────────────

extraRulesRoutes.post("/:id/weapon-proficiency/:weapon/pip", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const weapon = decodeURIComponent(c.req.param("weapon"));
  const { adventurer, result } = weaponProfSvc.shadeProficiencyPip(gameState.adventurer, weapon);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ ...result, weaponProficiency: newState.adventurer.weaponProficiency });
});

extraRulesRoutes.get("/:id/weapon-proficiency/:weapon", (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const weapon = decodeURIComponent(c.req.param("weapon"));
  const mods = weaponProfSvc.getProficiencyModifiers(gameState.adventurer, weapon);
  return c.json(mods);
});

// ── Book 8: Cheat Death ───────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/cheat-death/activate", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { settlementType, shrineRoll } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    shrineRoll: z.number().int().min(1).max(100),
  }).parse(body);
  const { adventurer, result } = cheatDeathSvc.activate(gameState.adventurer, settlementType, shrineRoll);
  if (!result.success) return c.json({ error: result.message }, 400);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, cheatDeath: newState.adventurer.cheatDeath, gold: newState.adventurer.gold });
});

extraRulesRoutes.post("/:id/cheat-death/use", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { strRoll, dexRoll, intRoll, hpRoll } = z.object({
    strRoll: z.number().int().min(1).max(6),
    dexRoll: z.number().int().min(1).max(6),
    intRoll: z.number().int().min(1).max(6),
    hpRoll: z.number().int().min(1).max(3),
  }).parse(body);
  const { adventurer, result } = cheatDeathSvc.useCheatDeath(gameState.adventurer, strRoll, dexRoll, intRoll, hpRoll);
  if (!result.success) return c.json({ error: result.message }, 400);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, adventurer: newState.adventurer });
});

// ── Book 8: Pursuit ───────────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/pursuit", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { monster, roll } = z.object({
    monster: z.object({ name: z.string(), av: z.number(), def: z.number(), dmg: z.number(), hp: z.union([z.string(), z.number()]) }),
    roll: z.number().int().min(1).max(100),
  }).parse(body);
  const { adventurer, result } = pursuitSvc.pursue(gameState.adventurer, monster, roll);
  await saveAndReturn(c, adventurer);
  return c.json(result);
});

// ── Book 8: Secret Passageway ─────────────────────────────────────────────────

extraRulesRoutes.post("/:id/secret-passage/search", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { areaId, roll, dangerRoll, boostRoll } = z.object({
    areaId: z.string(),
    roll: z.number().int().min(1).max(10),
    dangerRoll: z.number().int().min(1).max(6).optional(),
    boostRoll: z.number().int().min(1).max(6).optional(),
  }).parse(body);
  const { adventurer, result } = secretPassageSvc.search(gameState.adventurer, areaId, roll, dangerRoll, boostRoll);
  await saveAndReturn(c, adventurer);
  return c.json(result);
});

// ── Book 8: Monster Variant ───────────────────────────────────────────────────

extraRulesRoutes.post("/:id/monster-variant", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { monster, triggerRoll, variantRoll } = z.object({
    monster: z.object({ name: z.string(), av: z.number(), def: z.number(), dmg: z.number(), hp: z.number() }),
    triggerRoll: z.number().int().min(1).max(10),
    variantRoll: z.number().int().min(1).max(10),
  }).parse(body);
  const { adventurer, result } = monsterVariantSvc.rollVariant(gameState.adventurer, monster, triggerRoll, variantRoll);
  await saveAndReturn(c, adventurer);
  return c.json(result);
});

// ── Book 8: Honour Points ─────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/honour/award", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { points } = z.object({ points: z.number().int().min(1) }).parse(body);
  const { adventurer, result } = honourSvc.award(gameState.adventurer, points);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ ...result, honourPoints: newState.adventurer.honourPoints });
});

extraRulesRoutes.post("/:id/honour/spend", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { action } = z.object({
    action: z.enum(["reroll_attack", "reroll_damage", "reroll_location", "reroll_test", "reroll_table"]),
  }).parse(body);
  const { adventurer, result } = honourSvc.spend(gameState.adventurer, action);
  if (!result.success) return c.json({ error: result.message }, 400);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ ...result, honourPoints: newState.adventurer.honourPoints });
});

// ── Book 8: Accolades ─────────────────────────────────────────────────────────

extraRulesRoutes.get("/:id/accolades", (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  return c.json({ accolades: gameState.adventurer.accolades ?? {} });
});

extraRulesRoutes.post("/:id/accolades/check", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const { adventurer, result } = accoladeSvc.checkAccolades(gameState.adventurer);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ ...result, accolades: newState.adventurer.accolades });
});

// ── Book 8: Heroic Items ──────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/heroic-item/check", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { d6Roll, d10Roll1, d10Roll2 } = z.object({
    d6Roll: z.number().int().min(1).max(6),
    d10Roll1: z.number().int().min(1).max(10),
    d10Roll2: z.number().int().min(1).max(10),
  }).parse(body);
  const { adventurer, result } = heroicItemSvc.checkHeroicDrop(gameState.adventurer, d6Roll, d10Roll1, d10Roll2);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ ...result, heroicItemTracker: newState.adventurer.heroicItemTracker });
});

extraRulesRoutes.post("/:id/heroic-item/generate", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { typeRoll, la1Roll, la2Roll } = z.object({
    typeRoll: z.number().int().min(1).max(4),
    la1Roll: z.number().int().min(1).max(100),
    la2Roll: z.number().int().min(1).max(100),
  }).parse(body);
  const { adventurer, result } = heroicItemSvc.generateHeroicItem(gameState.adventurer, typeRoll, la1Roll, la2Roll);
  if (!result.success) return c.json({ error: result.message }, 400);
  await saveAndReturn(c, adventurer);
  return c.json(result);
});

// ── Book 8: Epic Dungeon ──────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/epic-dungeon/begin", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { questId } = z.object({ questId: z.string() }).parse(body);
  const { adventurer, result } = epicDungeonSvc.beginEpicDungeon(gameState.adventurer, questId);
  if (!result.success) return c.json({ error: result.message }, 400);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, monsterModifiers: result.monsterModifiers, campaignQuests: newState.adventurer.campaignQuests });
});

// ── Book 8: Identify ──────────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/identify/:itemId", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { itemType, roll, cursedRoll } = z.object({
    itemType: z.enum([
      "brew_lesser", "brew_finer", "brew_greater", "brew_superior", "brew_exceptional",
      "potion_lesser", "potion_finer", "potion_greater", "potion_superior", "potion_exceptional",
      "elixir_finer", "elixir_greater", "elixir_superior", "elixir_exceptional",
      "legendary",
    ]),
    roll: z.number().int().min(1).max(100),
    cursedRoll: z.number().int().min(1).max(100).optional(),
  }).parse(body);
  const { adventurer, result } = identifySvc.identifyItem(gameState.adventurer, itemType, roll, cursedRoll);
  const newState = await saveAndReturn(c, adventurer);
  return c.json(result);
});

extraRulesRoutes.post("/:id/remove-curse/:curseIndex", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const curseIndex = parseInt(c.req.param("curseIndex"), 10);
  const { adventurer, result } = identifySvc.removeItemCurse(gameState.adventurer, curseIndex);
  if (!result.success) return c.json({ error: result.message }, 400);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, gold: newState.adventurer.gold });
});

// ── Book 8: Yellow Events ─────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/yellow-event/shade", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { d10Roll1, d10Roll2, eventRoll, d6Roll, d100SubRoll } = z.object({
    d10Roll1: z.number().int().min(1).max(10),
    d10Roll2: z.number().int().min(1).max(10),
    eventRoll: z.number().int().min(1).max(100),
    d6Roll: z.number().int().min(1).max(6).default(1),
    d100SubRoll: z.number().int().min(1).max(100).default(1),
  }).parse(body);
  const { adventurer, result } = yellowEventSvc.rollYellowEvent(gameState.adventurer, d10Roll1, d10Roll2, eventRoll, d6Roll, d100SubRoll);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ ...result, tracker: newState.adventurer.yellowEventTracker });
});

// ── Book 8: Ammunition ────────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/ammunition/:holder/equip", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const holder = c.req.param("holder") as "pouch" | "quiver" | "bandolier";
  const { adventurer, result } = ammoSvc.equipHolder(gameState.adventurer, holder);
  if (!result.success) return c.json({ error: result.message }, 400);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, ammunition: newState.adventurer.ammunition });
});

extraRulesRoutes.post("/:id/ammunition/:holder/load", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { ammoType, quantity } = z.object({
    ammoType: z.enum(["smoothStones", "leadShot", "bodkinArrows", "broadheadArrows", "crossbowBolts", "heavyQuarrels"]),
    quantity: z.number().int().min(1),
  }).parse(body);
  const { adventurer, result } = ammoSvc.loadAmmo(gameState.adventurer, ammoType, quantity);
  if (!result.success) return c.json({ error: result.message }, 400);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, remaining: result.remaining, ammunition: newState.adventurer.ammunition });
});

extraRulesRoutes.post("/:id/ammunition/:type/use", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const ammoType = c.req.param("type") as "smoothStones" | "leadShot" | "bodkinArrows" | "broadheadArrows" | "crossbowBolts" | "heavyQuarrels";
  const { adventurer, result } = ammoSvc.useAmmo(gameState.adventurer, ammoType);
  if (!result.success) return c.json({ error: result.message }, 400);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, combatBonus: result.combatBonus, remaining: result.remaining });
});

// ── Book 8: Thrown Weapons ────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/throw/:weaponSlot", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const weaponSlot = c.req.param("weaponSlot") as "mainHand" | "offHand";
  const body = await c.req.json();
  const { attackRoll, damageRoll } = z.object({
    attackRoll: z.number().int().min(1).max(100),
    damageRoll: z.number().int().min(1),
  }).parse(body);
  const { adventurer, result } = throwSvc.throwWeapon(gameState.adventurer, weaponSlot, attackRoll, damageRoll);
  const newState = await saveAndReturn(c, adventurer);
  return c.json(result);
});

extraRulesRoutes.post("/:id/throw/:weaponSlot/retrieve", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { weapon, dexRoll } = z.object({
    weapon: z.object({ name: z.string(), value: z.number().default(0), fix: z.number().default(0), damagePips: z.number().default(0), twoHanded: z.boolean().default(false), usable: z.boolean().default(false), bonus: z.number().default(0) }),
    dexRoll: z.number().int().min(1).max(100),
  }).parse(body);
  const { adventurer, result } = throwSvc.retrieveWeapon(gameState.adventurer, weapon, dexRoll);
  const newState = await saveAndReturn(c, adventurer);
  return c.json(result);
});

// ── Book 8: Aimed Attack ──────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/aim/:location", (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const location = c.req.param("location") as AimLocation;
  const body = c.req.json();
  return body.then((b) => {
    const { baseStat, attackRoll, damageRoll, weaponBonus, monsterDef } = z.object({
      baseStat: z.number().int(),
      attackRoll: z.number().int().min(1).max(100),
      damageRoll: z.number().int().min(1),
      weaponBonus: z.number().int().default(0),
      monsterDef: z.number().int().default(0),
    }).parse(b);
    const { result } = aimedAttackSvc.aim(gameState.adventurer, location, baseStat, attackRoll, damageRoll, weaponBonus, monsterDef);
    return c.json(result);
  });
});

// ── Book 8: Equipment Mods ────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/reinforce-belt/:itemId", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const itemId = decodeURIComponent(c.req.param("itemId"));
  const { adventurer, result } = equipModSvc.reinforceBelt(gameState.adventurer, itemId);
  if (!result.success) return c.json({ error: result.message }, 400);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, item: result.item, gold: newState.adventurer.gold });
});

extraRulesRoutes.post("/:id/spike-shield/:itemId", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const itemId = decodeURIComponent(c.req.param("itemId"));
  const { adventurer, result } = equipModSvc.spikeShield(gameState.adventurer, itemId);
  if (!result.success) return c.json({ error: result.message }, 400);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, item: result.item, gold: newState.adventurer.gold });
});

extraRulesRoutes.post("/:id/check-belt-rv/:itemId", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const itemId = decodeURIComponent(c.req.param("itemId"));
  const body = await c.req.json();
  const { d10Roll } = z.object({ d10Roll: z.number().int().min(1).max(10) }).parse(body);
  const result = equipModSvc.checkBeltRV(gameState.adventurer, itemId, d10Roll);
  return c.json(result);
});

// ── Book 8: Spell Mana ────────────────────────────────────────────────────────

extraRulesRoutes.post("/:id/spell-mana/enable", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const { adventurer, result } = spellManaSvc.enableMana(gameState.adventurer);
  if (!result.success) return c.json({ error: result.message }, 400);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ message: result.message, spellMana: newState.adventurer.spellMana });
});

extraRulesRoutes.post("/:id/spell-mana/spend", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { cost } = z.object({ cost: z.number().int().min(1) }).parse(body);
  const { adventurer, result } = spellManaSvc.spendMana(gameState.adventurer, cost);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ ...result, spellMana: newState.adventurer.spellMana });
});

extraRulesRoutes.post("/:id/spell-mana/recover", async (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const body = await c.req.json();
  const { d3Roll } = z.object({ d3Roll: z.number().int().min(1).max(3) }).parse(body);
  const { adventurer, result } = spellManaSvc.recoverMana(gameState.adventurer, d3Roll);
  const newState = await saveAndReturn(c, adventurer);
  return c.json({ ...result, spellMana: newState.adventurer.spellMana });
});

export default extraRulesRoutes;
