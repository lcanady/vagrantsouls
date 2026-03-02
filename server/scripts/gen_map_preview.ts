/**
 * Generates preview SVGs for the Valoria world map and a sample hex sheet.
 * Run: deno run -A server/scripts/gen_map_preview.ts
 */
import { renderWorldMap, renderHexSheet } from "../services/WorldMapRenderService.ts";
import type { WorldBuilderState, HexSheet, HexData } from "../models/adventurer.ts";

// ─── Sample world state (two visited continents) ─────────────────────────────

function makeHex(id: string, terrain: HexData["terrain"], opts: Partial<HexData> = {}): HexData {
  return {
    id, sheetId: 1, terrain,
    name: `${terrain} Reach`,
    rewardAdjustment: 0,
    roads: [], rivers: [],
    atWar: false, hasCamp: false,
    ...opts,
  };
}

const sheet1: HexSheet = {
  sheetId: 1,
  continentId: 1,
  continentName: "Caldoria",
  questsCompleted: 7,
  isComplete: false,
  quests: [],
  hexes: {
    "q:0,r:0":  makeHex("q:0,r:0",  "Grasslands", { settlement: { type: "city", name: "Millhaven" }, roads: [2, 4] }),
    "q:1,r:0":  makeHex("q:1,r:0",  "Hills",      { roads: [5] }),
    "q:-1,r:0": makeHex("q:-1,r:0", "Forests",    { rivers: [2, 3] }),
    "q:0,r:1":  makeHex("q:0,r:1",  "Grasslands", { questCode: "Q1", roads: [1] }),
    "q:1,r:-1": makeHex("q:1,r:-1", "Hills",      { settlement: { type: "village", name: "Fernbrook" } }),
    "q:-1,r:1": makeHex("q:-1,r:1", "Marshlands", { rivers: [1, 4] }),
    "q:0,r:-1": makeHex("q:0,r:-1", "Forests",    { questCode: "Q2" }),
    "q:2,r:0":  makeHex("q:2,r:0",  "Mountains",  { hasCamp: true }),
    "q:-1,r:-1":makeHex("q:-1,r:-1","Hills",       {}),
    "q:0,r:2":  makeHex("q:0,r:2",  "Seas",        { questCode: "Q3" }),
    "q:1,r:1":  makeHex("q:1,r:1",  "Grasslands",  { settlement: { type: "town", name: "Millgate" }, roads: [6, 2] }),
    "q:2,r:-1": makeHex("q:2,r:-1", "Mountains",   {}),
    "q:-2,r:1": makeHex("q:-2,r:1", "Swamps",      {}),
  },
};

const sheet2: HexSheet = {
  sheetId: 2,
  continentId: 2,
  continentName: "Pyrethum",
  questsCompleted: 2,
  isComplete: false,
  quests: [],
  hexes: {
    "q:0,r:0": makeHex("q:0,r:0", "Deserts",   { settlement: { type: "city", name: "Ashenveil" } }),
    "q:1,r:0": makeHex("q:1,r:0", "Mountains", {}),
  },
};

const state: WorldBuilderState = {
  hexSheets: [sheet1, sheet2],
  currentSheetIndex: 0,
  currentHexId: "q:1,r:0",
  calendar: { year: 1072, month: 6, day: 14, rations: 10, fatigue: 2, questTimePips: 3, circledDates: [] },
  mounts: [],
  lawlessPoints: 2,
  witchSuspicion: 0,
  wbStartingSkills: ["Riding", "Survival"],
  uniqueTreasuresFound: [],
  hasBandOfUnity: false,
};

// ─── Render ───────────────────────────────────────────────────────────────────

const worldSvg = renderWorldMap(state);
const hexSvg   = renderHexSheet(sheet1, state.currentHexId, { hexSize: 40 });

await Deno.writeTextFile("/tmp/valoria_world.svg",  worldSvg);
await Deno.writeTextFile("/tmp/valoria_hexsheet.svg", hexSvg);

console.log("✓ /tmp/valoria_world.svg");
console.log("✓ /tmp/valoria_hexsheet.svg");
