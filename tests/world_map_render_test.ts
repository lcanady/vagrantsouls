/**
 * WorldMapRenderService tests
 * Verifies that SVG output contains the expected structural elements for the
 * Valoria world map and individual hex sheet renderers.
 */
import { assertEquals, assertExists, assert } from "@std/assert";
import {
  renderWorldMap,
  renderHexSheet,
} from "../server/services/WorldMapRenderService.ts";
import {
  WORLD_CONTINENTS,
  WORLD_NAME,
  getContinentById,
  STARTING_CONTINENT,
} from "../server/data/world_builder/world_data.ts";
import type { HexSheet, WorldBuilderState, HexData } from "../server/models/adventurer.ts";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeHex(id: string, overrides: Partial<HexData> = {}): HexData {
  return {
    id,
    sheetId: 1,
    terrain: "Grasslands",
    name: "Green Plains",
    rewardAdjustment: 0,
    roads: [],
    rivers: [],
    atWar: false,
    hasCamp: false,
    ...overrides,
  };
}

function makeSheet(overrides: Partial<HexSheet> = {}): HexSheet {
  return {
    sheetId: 1,
    hexes: {
      "q:0,r:0": makeHex("q:0,r:0"),
      "q:1,r:0": makeHex("q:1,r:0", { terrain: "Hills" }),
      "q:0,r:1": makeHex("q:0,r:1", { terrain: "Forests" }),
    },
    quests: [],
    questsCompleted: 3,
    isComplete: false,
    continentId: 1,
    continentName: "Caldoria",
    ...overrides,
  };
}

function makeWBState(overrides: Partial<WorldBuilderState> = {}): WorldBuilderState {
  const sheet = makeSheet();
  return {
    hexSheets: [sheet],
    currentSheetIndex: 0,
    currentHexId: "q:0,r:0",
    calendar: {
      year: 1072,
      month: 3,
      day: 15,
      rations: 12,
      fatigue: 1,
      questTimePips: 0,
      circledDates: [],
    },
    mounts: [],
    lawlessPoints: 0,
    witchSuspicion: 0,
    wbStartingSkills: [],
    uniqueTreasuresFound: [],
    hasBandOfUnity: false,
    ...overrides,
  };
}

// ─── World Data Tests ─────────────────────────────────────────────────────────

Deno.test("world_data: WORLD_NAME is Valoria", () => {
  assertEquals(WORLD_NAME, "Valoria");
});

Deno.test("world_data: has exactly 6 continents", () => {
  assertEquals(WORLD_CONTINENTS.length, 6);
});

Deno.test("world_data: continent IDs are 1 through 6", () => {
  const ids = WORLD_CONTINENTS.map((c) => c.id);
  assertEquals(ids, [1, 2, 3, 4, 5, 6]);
});

Deno.test("world_data: each continent has required fields", () => {
  for (const c of WORLD_CONTINENTS) {
    assertExists(c.name, `continent ${c.id} missing name`);
    assertExists(c.colour, `continent ${c.id} missing colour`);
    assertExists(c.svgPoints, `continent ${c.id} missing svgPoints`);
    assertExists(c.sacredSite, `continent ${c.id} missing sacredSite`);
    assert(c.towns.length >= 1, `continent ${c.id} has no towns`);
    assert(c.dungeons.length >= 1, `continent ${c.id} has no dungeons`);
  }
});

Deno.test("world_data: getContinentById returns correct continent", () => {
  const caldoria = getContinentById(1);
  assertExists(caldoria);
  assertEquals(caldoria.name, "Caldoria");
});

Deno.test("world_data: getContinentById returns undefined for unknown id", () => {
  assertEquals(getContinentById(99), undefined);
});

Deno.test("world_data: STARTING_CONTINENT is Caldoria (id 1)", () => {
  assertEquals(STARTING_CONTINENT.id, 1);
  assertEquals(STARTING_CONTINENT.name, "Caldoria");
});

// ─── World Map SVG Tests ───────────────────────────────────────────────────────

Deno.test("renderWorldMap: returns a valid SVG string", () => {
  const state = makeWBState();
  const svg = renderWorldMap(state);
  assert(svg.startsWith("<svg"), "should start with <svg");
  assert(svg.includes("</svg>"), "should end with </svg>");
  assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'), "should have SVG namespace");
});

Deno.test("renderWorldMap: contains world title Valoria", () => {
  const svg = renderWorldMap(makeWBState());
  assert(svg.includes("Valoria"), "SVG should contain world name");
});

Deno.test("renderWorldMap: contains continent polygons", () => {
  const svg = renderWorldMap(makeWBState());
  assert(svg.includes("<polygon"), "SVG should contain polygon elements for continents");
});

Deno.test("renderWorldMap: visited continent (Caldoria) appears in colour", () => {
  const state = makeWBState();
  // Caldoria (id 1) is visited since hexSheets[0].continentId = 1
  const caldoria = getContinentById(1)!;
  const svg = renderWorldMap(state);
  assert(svg.includes(caldoria.colour), "Caldoria colour should appear for visited continent");
  assert(svg.includes("Caldoria"), "Caldoria name label should appear for visited continent");
});

Deno.test("renderWorldMap: unvisited continent does not show label", () => {
  const state = makeWBState();
  // No sheet has continentId = 2 (Pyrethum), so it should be fog-of-war
  const svg = renderWorldMap(state);
  assert(!svg.includes("Pyrethum"), "Pyrethum should not appear as a label when unvisited");
});

Deno.test("renderWorldMap: contains compass rose", () => {
  const svg = renderWorldMap(makeWBState());
  // Compass rose is at translate(740, 550)
  assert(svg.includes("740"), "SVG should include compass rose elements");
});

Deno.test("renderWorldMap: shows calendar year in subtitle", () => {
  const svg = renderWorldMap(makeWBState());
  assert(svg.includes("1072"), "SVG should include current year");
});

// ─── Hex Sheet SVG Tests ──────────────────────────────────────────────────────

Deno.test("renderHexSheet: returns a valid SVG string", () => {
  const sheet = makeSheet();
  const svg = renderHexSheet(sheet, "q:0,r:0");
  assert(svg.startsWith("<svg"), "should start with <svg");
  assert(svg.includes("</svg>"), "should end with </svg>");
});

Deno.test("renderHexSheet: contains hex polygons for each explored hex", () => {
  const sheet = makeSheet();
  const svg = renderHexSheet(sheet, "q:0,r:0");
  // 3 hexes in fixture → at least 3 <polygon> elements
  const polygonCount = (svg.match(/<polygon/g) ?? []).length;
  assert(polygonCount >= 3, `Expected at least 3 polygons, got ${polygonCount}`);
});

Deno.test("renderHexSheet: shows continent name banner", () => {
  const sheet = makeSheet();
  const svg = renderHexSheet(sheet, "q:0,r:0");
  assert(svg.includes("Caldoria"), "SVG should include continent name in header");
});

Deno.test("renderHexSheet: shows quest progress", () => {
  const sheet = makeSheet();
  const svg = renderHexSheet(sheet, "q:0,r:0");
  assert(svg.includes("3/25"), "SVG should show quest progress count");
});

Deno.test("renderHexSheet: current hex has player position indicator", () => {
  const sheet = makeSheet();
  const svg = renderHexSheet(sheet, "q:0,r:0");
  // Player position is an animated circle
  assert(svg.includes("<circle"), "SVG should contain a circle for player position");
  assert(svg.includes("<animate"), "Player circle should have animation");
});

Deno.test("renderHexSheet: quest code appears in SVG when set", () => {
  const sheet = makeSheet({
    hexes: {
      "q:0,r:0": makeHex("q:0,r:0", { questCode: "Q1" }),
    },
  });
  const svg = renderHexSheet(sheet, "q:0,r:0");
  assert(svg.includes("Q1"), "Quest code Q1 should appear in SVG");
});

Deno.test("renderHexSheet: settlement icon appears when hex has settlement", () => {
  const sheet = makeSheet({
    hexes: {
      "q:0,r:0": makeHex("q:0,r:0", {
        settlement: { type: "city", name: "Millhaven" },
      }),
    },
  });
  const svg = renderHexSheet(sheet, "q:0,r:0");
  // City icon is ★
  assert(svg.includes("★"), "City settlement should show star icon");
});

Deno.test("renderHexSheet: road lines rendered when hex has roads", () => {
  const sheet = makeSheet({
    hexes: {
      "q:0,r:0": makeHex("q:0,r:0", { roads: [1, 3] }),
    },
  });
  const svg = renderHexSheet(sheet, "q:0,r:0");
  assert(svg.includes("<line"), "Roads should render as <line> elements");
});

Deno.test("renderHexSheet: river lines rendered when hex has rivers", () => {
  const sheet = makeSheet({
    hexes: {
      "q:0,r:0": makeHex("q:0,r:0", { rivers: [2] }),
    },
  });
  const svg = renderHexSheet(sheet, "q:0,r:0");
  assert(svg.includes("<path"), "Rivers should render as curved <path> elements");
  assert(svg.includes("#64b8f0") || svg.includes("#1a4a7a"), "River should use blue colours");
});

Deno.test("renderHexSheet: shows terrain colours for each terrain type", () => {
  const sheet = makeSheet({
    hexes: {
      "q:0,r:0": makeHex("q:0,r:0", { terrain: "Grasslands" }),
      "q:1,r:0": makeHex("q:1,r:0", { terrain: "Mountains" }),
      "q:0,r:1": makeHex("q:0,r:1", { terrain: "Seas" }),
    },
  });
  const svg = renderHexSheet(sheet, "q:0,r:0");
  // Mountains = #9E9E9E, Seas = #2196F3, Grasslands = #5CB85C
  assert(svg.includes("#5CB85C") || svg.includes("#5cb85c"), "Grasslands colour should appear");
  assert(svg.includes("#2196F3") || svg.includes("#2196f3"), "Seas colour should appear");
});

Deno.test("renderHexSheet: empty sheet returns placeholder SVG", () => {
  const emptySheet: HexSheet = {
    sheetId: 2,
    hexes: {},
    quests: [],
    questsCompleted: 0,
    isComplete: false,
    continentName: "Pyrethum",
  };
  const svg = renderHexSheet(emptySheet, "q:0,r:0");
  assert(svg.includes("<svg"), "should return a valid SVG");
  assert(svg.includes("Pyrethum"), "should mention the continent name");
  assert(svg.includes("No hexes"), "should show empty state message");
});

Deno.test("renderHexSheet: respects custom hexSize option", () => {
  const sheet = makeSheet();
  const svgSmall = renderHexSheet(sheet, "q:0,r:0", { hexSize: 20 });
  const svgLarge = renderHexSheet(sheet, "q:0,r:0", { hexSize: 60 });
  // Larger hex size = larger SVG dimensions
  const widthSmall = parseInt(svgSmall.match(/width="(\d+)"/)?.[1] ?? "0");
  const widthLarge = parseInt(svgLarge.match(/width="(\d+)"/)?.[1] ?? "0");
  assert(widthLarge > widthSmall, "Larger hexSize should produce a wider SVG");
});
