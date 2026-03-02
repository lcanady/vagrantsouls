/**
 * World Builder Routes — Book 6 Overworld API
 *
 * All routes are under /api/v1/worldbuilder/:id/ (handled via X-Adventurer-Id header).
 * Auth middleware is applied in main.ts.
 *
 * Setup:
 *   POST /setup                   — Initialize world (rolls: initWorldRolls, startingSkills)
 *   POST /setup/hex               — Generate a hex (rolls: generateHexRolls, hexId, adjacentHexIds)
 *
 * State:
 *   GET  /state                   — Full WB state
 *   GET  /hexes                   — All hexes on current sheet
 *   GET  /hexes/:hexId            — Single hex details
 *
 * Calendar:
 *   POST /calendar/mark-day       — Mark 1 day (rolls: MarkDayRolls)
 *
 * Actions:
 *   POST /action/rest
 *   POST /action/scout            { targetHexId, rolls }
 *   POST /action/forage           { method, rolls }
 *   POST /action/fish             { useBait, rolls }
 *   POST /action/move             { targetHexId, rolls }
 *   POST /action/cart             { rolls }
 *   POST /action/ride             { mountSlot, rolls }
 *   POST /action/lay-of-land      { targetHexId, rolls }
 *   POST /action/news-of-quests   { targetHexId, rolls }
 *   POST /action/make-camp
 *
 * Quests:
 *   POST /quests/generate         { rolls }
 *   POST /quests/generate-side    { rolls }
 *   POST /quests/:code/complete   { success, rolls }
 *   GET  /quests                  — List all WB quests
 *
 * Mounts:
 *   POST /mounts/buy              { name, type, cost, value, availabilityRoll? }
 *   POST /mounts/:slot/sell       { settlementType, buyerRoll }
 *   POST /mounts/:slot/feed       { rationsToPay, double? }
 *   POST /mounts/:slot/saddlebag  { cost, availabilityRoll?, availabilityChance? }
 *   POST /mounts/:slot/stow       { bagIndex, itemName, isStackable, qty? }
 *   POST /mounts/:slot/unload     { bagIndex, itemName, isTrackItem }
 *   POST /mounts/check-leaving    { questTimePips, mountRolls }
 *   GET  /mounts                  — List all mounts
 *
 * Events:
 *   POST /events/roll             { roll, context, modifier? }
 *   POST /events/resolve/:event   { rolls }
 *
 * Settlement:
 *   POST /settlement/law          { settlementType, d10Roll }
 *   POST /settlement/heal         { settlementType, hpToHeal, rolls }
 *   POST /settlement/repair       { settlementType, baseRepairCost, pips, rolls }
 *   POST /settlement/sell         { settlementType, items, rolls }
 *   POST /settlement/buy          { settlementType, nTableRange, baseItemPrice, rolls }
 *   POST /settlement/search       { settlementType, table, rolls }
 *   POST /settlement/train        { settlementType, target, rolls }
 *   POST /settlement/magic        { settlementType, spellName, rolls }
 *   POST /settlement/empire       { settlementType, rolls }
 *   POST /settlement/witchery     { settlementType, rolls }
 *   POST /settlement/artisan      { settlementType, rolls }
 *   POST /settlement/rumour       { settlementType, d100Roll }
 *   POST /settlement/event        { settlementType, d100Roll }
 *
 * Maps (SVG image generation — Content-Type: image/svg+xml):
 *   GET  /map/world               — Full Valoria world overview
 *   GET  /map/current             — Current hex sheet (continent)
 *   GET  /map/sheet/:sheetId      — Specific hex sheet by ID
 *   Query params: ?hexSize=36     — Hex size in pixels (default 36)
 */

import { Hono, Context } from "hono";
import { z } from "zod";
import { Repository } from "../repository.ts";
import { GameState } from "../models/gamestate.ts";
import { Adventurer, WorldBuilderState } from "../models/adventurer.ts";
import { loadAdventurer } from "../middleware/adventurer.ts";
import { WorldBuilderSetupService } from "../services/WorldBuilderSetupService.ts";
import { WorldBuilderCalendarService } from "../services/WorldBuilderCalendarService.ts";
import { WorldBuilderActionService } from "../services/WorldBuilderActionService.ts";
import { WorldBuilderQuestService } from "../services/WorldBuilderQuestService.ts";
import { WorldBuilderSettlementService } from "../services/WorldBuilderSettlementService.ts";
import { WorldBuilderMountService } from "../services/WorldBuilderMountService.ts";
import { WorldBuilderEventService } from "../services/WorldBuilderEventService.ts";
import { renderWorldMap, renderHexSheet } from "../services/WorldMapRenderService.ts";

const worldBuilderRoutes = new Hono<{
  Variables: { repository: Repository; gameState: GameState; adventurerId: string };
}>();

worldBuilderRoutes.use("*", loadAdventurer);

// Service instances
const setupSvc = new WorldBuilderSetupService();
const calendarSvc = new WorldBuilderCalendarService();
const actionSvc = new WorldBuilderActionService();
const questSvc = new WorldBuilderQuestService();
const settlementSvc = new WorldBuilderSettlementService();
const mountSvc = new WorldBuilderMountService();
const eventSvc = new WorldBuilderEventService();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWBState(adventurer: Adventurer): WorldBuilderState {
  if (!adventurer.worldBuilder) throw new Error("World Builder not initialized for this adventurer");
  return adventurer.worldBuilder;
}

async function saveAndReturn(c: Context, adventurer: Adventurer, extra?: Record<string, unknown>) {
  const repo = c.get("repository") as Repository;
  const adventurerId = c.get("adventurerId") as string;
  const gameState = c.get("gameState") as GameState;
  const newState: GameState = { ...gameState, adventurer };
  await repo.saveAdventurer(adventurerId, newState);
  return c.json({ adventurer, ...extra });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

worldBuilderRoutes.post("/setup", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const body = await c.req.json();
  const schema = z.object({
    startingSkills: z.array(z.string()).length(2),
    rolls: z.record(z.unknown()),
  });
  const { startingSkills, rolls } = schema.parse(body);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { adventurer, result } = setupSvc.initializeWorld(gs.adventurer, { startingSkills: startingSkills as [string, string], rolls } as any);
  return saveAndReturn(c, adventurer, { result });
});

worldBuilderRoutes.post("/setup/hex", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const schema = z.object({
    hexId: z.string(),
    adjacentHexIds: z.array(z.string()).optional(),
    rolls: z.record(z.unknown()),
  });
  const { hexId, adjacentHexIds, rolls } = schema.parse(body);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { state: newState, result } = setupSvc.generateHex(state, hexId, rolls as any, adjacentHexIds);
  const updatedAdventurer = { ...gs.adventurer, worldBuilder: newState };
  return saveAndReturn(c, updatedAdventurer, { hex: result.hex });
});

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

worldBuilderRoutes.get("/state", (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  return c.json({ state });
});

worldBuilderRoutes.get("/hexes", (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const sheet = state.hexSheets[state.currentSheetIndex];
  return c.json({ hexes: sheet?.hexes ?? {} });
});

worldBuilderRoutes.get("/hexes/:hexId", (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const sheet = state.hexSheets[state.currentSheetIndex];
  const hexId = c.req.param("hexId");
  const hex = sheet?.hexes[hexId];
  if (!hex) return c.json({ error: "Hex not found" }, 404);
  return c.json({ hex });
});

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

worldBuilderRoutes.post("/calendar/mark-day", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const rolls = body.rolls ?? {};

  const { adventurer, state: newState, report, pendingEvents } = calendarSvc.markDay(gs.adventurer, state, rolls);
  const updatedAdventurer = { ...adventurer, worldBuilder: newState };
  return saveAndReturn(c, updatedAdventurer, { report, pendingEvents });
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

worldBuilderRoutes.post("/action/rest", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json().catch(() => ({}));
  const rolls = body.rolls ?? [{}, {}];
  const { adventurer, state: newState, result } = actionSvc.restAction(gs.adventurer, state, rolls as [object, object]);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/action/scout", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { targetHexId, eventRoll, rollsPerDay } = z.object({
    targetHexId: z.string(),
    eventRoll: z.number().int().min(1).max(100),
    rollsPerDay: z.tuple([z.record(z.unknown()), z.record(z.unknown())]).optional(),
  }).parse(body);
  const { adventurer, state: newState, result } = actionSvc.scoutAction(gs.adventurer, state, targetHexId, eventRoll, rollsPerDay as [object, object] ?? [{}, {}]);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/action/forage", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { method, testRoll, rollsPerDay } = z.object({
    method: z.enum(["harvesting", "trapping", "hunting"]),
    testRoll: z.number().int().min(1).max(100),
    rollsPerDay: z.array(z.record(z.unknown())).optional(),
  }).parse(body);
  const { adventurer, state: newState, result } = actionSvc.forageAction(gs.adventurer, state, method, testRoll, rollsPerDay as [object] ?? [{}]);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/action/fish", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { testRoll, useBait, rollsPerDay } = z.object({
    testRoll: z.number().int().min(1).max(100),
    useBait: z.boolean().optional(),
    rollsPerDay: z.array(z.record(z.unknown())).optional(),
  }).parse(body);
  const { adventurer, state: newState, result } = actionSvc.fishingAction(gs.adventurer, state, testRoll, useBait ?? false, rollsPerDay as [object] ?? [{}]);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/action/move", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { targetHexId, hasRoadBetween, hasRiverCrossing, eventRoll, rollsPerDay } = z.object({
    targetHexId: z.string(),
    hasRoadBetween: z.boolean().optional(),
    hasRiverCrossing: z.boolean().optional(),
    eventRoll: z.number().int().min(1).max(100),
    rollsPerDay: z.array(z.record(z.unknown())).optional(),
  }).parse(body);
  const { adventurer, state: newState, result } = actionSvc.moveAction(
    gs.adventurer, state, targetHexId,
    hasRoadBetween ?? false, hasRiverCrossing ?? false, eventRoll,
    rollsPerDay as object[] ?? [],
  );
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/action/cart", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { cartRoll, haggleRoll, rollsPerDay } = z.object({
    cartRoll: z.number().int().min(1).max(100),
    haggleRoll: z.number().int().optional(),
    rollsPerDay: z.array(z.record(z.unknown())).optional(),
  }).parse(body);
  const { adventurer, state: newState, result } = actionSvc.cartAction(gs.adventurer, state, cartRoll, haggleRoll, rollsPerDay as [object] ?? [{}]);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/action/ride", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { mountIndex, ridingRoll, rollsPerDay } = z.object({
    mountIndex: z.number().int().min(0),
    ridingRoll: z.number().int().min(1).max(100),
    rollsPerDay: z.array(z.record(z.unknown())).optional(),
  }).parse(body);
  const { adventurer, state: newState, result } = actionSvc.rideAction(gs.adventurer, state, mountIndex, ridingRoll, rollsPerDay as [object] ?? [{}]);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/action/lay-of-land", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { targetHexId, distance, popRoll, rollsPerDay } = z.object({
    targetHexId: z.string(),
    distance: z.number().int().min(1),
    popRoll: z.number().int().min(1).max(100),
    rollsPerDay: z.array(z.record(z.unknown())).optional(),
  }).parse(body);
  const { adventurer, state: newState, result } = actionSvc.layOfTheLandAction(gs.adventurer, state, targetHexId, distance, popRoll, rollsPerDay as [object] ?? [{}]);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/action/news-of-quests", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { targetHexId, distance, popRoll, rollsPerDay } = z.object({
    targetHexId: z.string(),
    distance: z.number().int().min(1),
    popRoll: z.number().int().min(1).max(100),
    rollsPerDay: z.array(z.record(z.unknown())).optional(),
  }).parse(body);
  const { adventurer, state: newState, result } = actionSvc.newsOfQuestsAction(gs.adventurer, state, targetHexId, distance, popRoll, rollsPerDay as [object] ?? [{}]);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/action/make-camp", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json().catch(() => ({}));
  const rolls = body.rolls ?? [{}, {}];
  const { adventurer, state: newState, result } = actionSvc.makeCampAction(gs.adventurer, state, rolls as [object, object]);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------

worldBuilderRoutes.get("/quests", (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const sheet = state.hexSheets[state.currentSheetIndex];
  return c.json({ quests: sheet?.quests ?? [] });
});

worldBuilderRoutes.post("/quests/generate", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { adventurer, state: newState, quest } = questSvc.generateQuest(gs.adventurer, state, body.rolls ?? {} as any);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { quest });
});

worldBuilderRoutes.post("/quests/generate-side", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { d10Roll, monsterName } = z.object({ d10Roll: z.number().int().min(1).max(10), monsterName: z.string() }).parse(body);
  const sideQuest = questSvc.generateSideQuest(gs.adventurer, state, { d10Roll, monsterName });
  return c.json({ sideQuest });
});

worldBuilderRoutes.post("/quests/:code/complete", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const questCode = c.req.param("code");
  const body = await c.req.json();
  const { success, rolls } = z.object({ success: z.boolean(), rolls: z.record(z.unknown()).optional() }).parse(body);
  const { adventurer, state: newState, result } = questSvc.completeQuest(gs.adventurer, state, questCode, success, rolls ?? {});
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

// ---------------------------------------------------------------------------
// Mounts
// ---------------------------------------------------------------------------

worldBuilderRoutes.get("/mounts", (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  return c.json({ mounts: state.mounts });
});

worldBuilderRoutes.post("/mounts/buy", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const input = z.object({
    name: z.string(),
    type: z.string(),
    cost: z.number().int(),
    value: z.number().int(),
    availabilityRoll: z.number().int().optional(),
    availabilityChance: z.number().int().optional(),
  }).parse(body);
  const { adventurer, state: newState, result } = mountSvc.buyMount(gs.adventurer, state, input);
  if (!result.success) return c.json({ error: result.message }, 400);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/mounts/:slot/sell", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const slot = parseInt(c.req.param("slot"), 10);
  const body = await c.req.json();
  const { settlementType, buyerRoll } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    buyerRoll: z.number().int(),
  }).parse(body);
  const { adventurer, state: newState, result } = mountSvc.sellMount(gs.adventurer, state, slot, settlementType, buyerRoll);
  if (!result.success) return c.json({ error: result.message }, 400);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/mounts/:slot/feed", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const slot = parseInt(c.req.param("slot"), 10);
  const body = await c.req.json();
  const { rationsToPay, double: dbl } = z.object({
    rationsToPay: z.number().int().min(1).max(2),
    double: z.boolean().optional(),
  }).parse(body);
  const { adventurer, state: newState, result } = mountSvc.feedMount(gs.adventurer, state, slot, rationsToPay, dbl ?? false);
  if (!result.success) return c.json({ error: result.message }, 400);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/mounts/:slot/saddlebag", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const slot = parseInt(c.req.param("slot"), 10);
  const body = await c.req.json();
  const { cost, availabilityRoll, availabilityChance } = z.object({
    cost: z.number().int(),
    availabilityRoll: z.number().int().optional(),
    availabilityChance: z.number().int().optional(),
  }).parse(body);
  const { adventurer, state: newState, result } = mountSvc.addSaddlebag(gs.adventurer, state, slot, cost, availabilityRoll, availabilityChance);
  if (!result.success) return c.json({ error: result.message }, 400);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/mounts/:slot/stow", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const slot = parseInt(c.req.param("slot"), 10);
  const body = await c.req.json();
  const { bagIndex, itemName, isStackable, qty } = z.object({
    bagIndex: z.number().int().min(0).max(3),
    itemName: z.string(),
    isStackable: z.boolean(),
    qty: z.number().int().optional(),
  }).parse(body);
  const { adventurer, state: newState, result } = mountSvc.stowItem(gs.adventurer, state, slot, bagIndex, itemName, isStackable, qty);
  if (!result.success) return c.json({ error: result.message }, 400);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/mounts/:slot/unload", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const slot = parseInt(c.req.param("slot"), 10);
  const body = await c.req.json();
  const { bagIndex, itemName, isTrackItem } = z.object({
    bagIndex: z.number().int().min(0).max(3),
    itemName: z.string(),
    isTrackItem: z.boolean(),
  }).parse(body);
  const { adventurer, state: newState, result } = mountSvc.unloadItem(gs.adventurer, state, slot, bagIndex, itemName, isTrackItem);
  if (!result.success) return c.json({ error: result.message }, 400);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/mounts/check-leaving", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { questTimePips, mountRolls } = z.object({
    questTimePips: z.number().int().min(0),
    mountRolls: z.array(z.number().int()),
  }).parse(body);
  const { adventurer, state: newState, result } = mountSvc.checkLeavingMounts(gs.adventurer, state, questTimePips, mountRolls);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

worldBuilderRoutes.post("/events/roll", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { roll, context, modifier } = z.object({
    roll: z.number().int().min(1).max(100),
    context: z.enum(["settlement", "Deserts", "Forests", "Grasslands", "Hills", "Jungles", "Marshlands", "Mountains", "Seas", "Swamps", "Tundras"]),
    modifier: z.number().int().optional(),
  }).parse(body);

  // Use current hex terrain as context if not overridden
  const sheet = state.hexSheets[state.currentSheetIndex];
  const currentHex = sheet?.hexes[state.currentHexId];
  const resolvedContext = context ?? currentHex?.terrain ?? "Grasslands";

  const eventName = eventSvc.rollEvent(roll, resolvedContext as Parameters<typeof eventSvc.rollEvent>[1], modifier);
  return c.json({ eventName, roll, context: resolvedContext });
});

worldBuilderRoutes.post("/events/resolve/:event", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const eventName = c.req.param("event");
  const body = await c.req.json();
  const rolls = body.rolls ?? {};

  const { adventurer, state: newState, result } = eventSvc.resolveEvent(
    gs.adventurer,
    state,
    eventName as Parameters<typeof eventSvc.resolveEvent>[2],
    rolls,
  );
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------

worldBuilderRoutes.post("/settlement/law", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, d10Roll } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    d10Roll: z.number().int().min(1).max(10),
  }).parse(body);
  const result = settlementSvc.checkLawless(gs.adventurer, state, settlementType, d10Roll);
  return c.json({ result });
});

worldBuilderRoutes.post("/settlement/heal", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, hpToHeal, rolls } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    hpToHeal: z.number().int().min(0),
    rolls: z.record(z.unknown()).optional(),
  }).parse(body);
  const { adventurer, result } = settlementSvc.heal(gs.adventurer, state, settlementType, hpToHeal, rolls ?? {});
  return saveAndReturn(c, { ...adventurer, worldBuilder: state }, { result });
});

worldBuilderRoutes.post("/settlement/repair", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, baseRepairCost, pips, rolls } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    baseRepairCost: z.number().int(),
    pips: z.number().int().min(1),
    rolls: z.record(z.unknown()).optional(),
  }).parse(body);
  const { adventurer, result } = settlementSvc.repairItem(gs.adventurer, state, settlementType, baseRepairCost, pips, rolls ?? {});
  if (!result.success) return c.json({ error: result.message }, 400);
  return saveAndReturn(c, { ...adventurer, worldBuilder: state }, { result });
});

worldBuilderRoutes.post("/settlement/sell", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, items, rolls } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    items: z.array(z.object({ name: z.string(), value: z.number().int() })),
    rolls: z.object({ buyerRolls: z.array(z.number().int()) }),
  }).parse(body);
  const { adventurer, result, soldItems, unsoldItems } = settlementSvc.sellItems(gs.adventurer, state, settlementType, items, rolls);
  return saveAndReturn(c, { ...adventurer, worldBuilder: state }, { result, soldItems, unsoldItems });
});

worldBuilderRoutes.post("/settlement/buy", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, nTableRange, baseItemPrice, rolls } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    nTableRange: z.enum(["1-45", "46-70", "71-97", "98-100"]),
    baseItemPrice: z.number().int(),
    rolls: z.record(z.unknown()).optional(),
  }).parse(body);
  const { adventurer, result } = settlementSvc.buyNeeded(gs.adventurer, state, settlementType, nTableRange, baseItemPrice, rolls ?? {});
  if (!result.success) return c.json({ error: result.message }, 400);
  return saveAndReturn(c, { ...adventurer, worldBuilder: state }, { result });
});

worldBuilderRoutes.post("/settlement/search", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, table, rolls } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    table: z.enum(["aAndW", "tableP", "taTbTc"]),
    rolls: z.record(z.unknown()).optional(),
  }).parse(body);
  const { adventurer, result } = settlementSvc.searchMarket(gs.adventurer, state, settlementType, table, rolls ?? {});
  if (!result.success) return c.json({ error: result.message }, 400);
  return saveAndReturn(c, { ...adventurer, worldBuilder: state }, { result });
});

worldBuilderRoutes.post("/settlement/train", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, target, rolls } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    target: z.enum(["skill", "stat", "hp"]),
    rolls: z.record(z.unknown()).optional(),
  }).parse(body);
  const { adventurer, result } = settlementSvc.train(gs.adventurer, state, settlementType, target, rolls ?? {});
  if (!result.success) return c.json({ error: result.message }, 400);
  return saveAndReturn(c, { ...adventurer, worldBuilder: state }, { result });
});

worldBuilderRoutes.post("/settlement/magic", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, spellName, rolls } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    spellName: z.string(),
    rolls: z.record(z.unknown()).optional(),
  }).parse(body);
  const { adventurer, result } = settlementSvc.magicTuition(gs.adventurer, state, settlementType, spellName, rolls ?? {});
  if (!result.success) return c.json({ error: result.message }, 400);
  return saveAndReturn(c, { ...adventurer, worldBuilder: state }, { result });
});

worldBuilderRoutes.post("/settlement/empire", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, rolls } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    rolls: z.record(z.unknown()).optional(),
  }).parse(body);
  const { adventurer, result } = settlementSvc.empireBuilding(gs.adventurer, state, settlementType, rolls ?? {});
  return saveAndReturn(c, { ...adventurer, worldBuilder: state }, { result });
});

worldBuilderRoutes.post("/settlement/witchery", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, rolls } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    rolls: z.object({ suspicionRoll: z.number().int() }),
  }).parse(body);
  const { adventurer, state: newState, result } = settlementSvc.performWitchery(gs.adventurer, state, settlementType, rolls);
  return saveAndReturn(c, { ...adventurer, worldBuilder: newState }, { result });
});

worldBuilderRoutes.post("/settlement/artisan", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, rolls } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    rolls: z.record(z.unknown()).optional(),
  }).parse(body);
  const result = settlementSvc.checkArtisanAvailability(gs.adventurer, state, settlementType, rolls ?? {});
  return c.json({ result });
});

worldBuilderRoutes.post("/settlement/rumour", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, d100Roll } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    d100Roll: z.number().int().min(1).max(100),
  }).parse(body);
  const result = settlementSvc.checkQuestRumour(gs.adventurer, state, settlementType, d100Roll);
  return c.json({ result });
});

worldBuilderRoutes.post("/settlement/event", async (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const body = await c.req.json();
  const { settlementType, d100Roll } = z.object({
    settlementType: z.enum(["camp", "village", "town", "city"]),
    d100Roll: z.number().int().min(1).max(100),
  }).parse(body);
  const result = settlementSvc.checkEvent(gs.adventurer, state, settlementType, d100Roll);
  return c.json({ result });
});

// ---------------------------------------------------------------------------
// Maps — SVG image endpoints
// ---------------------------------------------------------------------------

/** GET /map/world — Full Valoria world overview SVG */
worldBuilderRoutes.get("/map/world", (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const svg = renderWorldMap(state);
  return new Response(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-cache" },
  });
});

/** GET /map/current — Current hex sheet as a hex grid SVG */
worldBuilderRoutes.get("/map/current", (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const sheet = state.hexSheets[state.currentSheetIndex];
  if (!sheet) return c.text("No active hex sheet", 404);
  const hexSize = parseInt(c.req.query("hexSize") ?? "36", 10);
  const svg = renderHexSheet(sheet, state.currentHexId, { hexSize });
  return new Response(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-cache" },
  });
});

/** GET /map/sheet/:sheetId — Specific hex sheet by 1-based sheet ID */
worldBuilderRoutes.get("/map/sheet/:sheetId", (c: Context) => {
  const gs = c.get("gameState") as GameState;
  const state = getWBState(gs.adventurer);
  const sheetId = parseInt(c.req.param("sheetId"), 10);
  const sheet = state.hexSheets.find((s) => s.sheetId === sheetId);
  if (!sheet) return c.text(`Sheet ${sheetId} not found`, 404);
  const hexSize = parseInt(c.req.query("hexSize") ?? "36", 10);
  // Highlight current hex only if this is the active sheet
  const currentHexId =
    state.hexSheets[state.currentSheetIndex]?.sheetId === sheetId
      ? state.currentHexId
      : "";
  const svg = renderHexSheet(sheet, currentHexId, { hexSize });
  return new Response(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-cache" },
  });
});

export default worldBuilderRoutes;
