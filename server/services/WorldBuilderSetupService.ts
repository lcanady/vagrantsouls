/**
 * WorldBuilderSetupService
 *
 * Handles initialization of the World Builder game:
 * - initializeWorld: full 12-step world setup (home hex, calendar, quests)
 * - generateHex: procedural hex generation for any blank hex
 * - generateSettlementName: prefix+suffix from names table
 *
 * All dice rolls are passed in as parameters to keep the service deterministic
 * and testable (same pattern as BeastService, ArcanistService, etc.).
 */

import { Adventurer, WorldBuilderState, HexData, HexSheet, WBQuestRecord } from "../models/adventurer.ts";
import { NAMES_TABLE, NamesEntry, buildHexName, buildSettlementName } from "../data/world_builder/names_table.ts";
import { getTerrainByRoll, getTerrainByType, RACE_HOME_TERRAIN, DIRECTION_VECTORS, OPPOSITE_EDGE, TerrainType } from "../data/world_builder/terrain_table.ts";
import { getWBQuestTemplate } from "../data/world_builder/quests_table.ts";
import { getQuestReward } from "../data/world_builder/quest_rewards_table.ts";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface InitWorldRolls {
  /** d100 roll for home terrain (or override with preferred terrain) */
  terrainRoll: number;
  /** d100 roll for home hex name */
  hexNameRoll: number;
  /** d6 for settlement type (1-3=village, 4-5=town, 6=city) */
  settlementTypeRoll: number;
  /** d100 for settlement prefix name */
  settlementPrefixRoll: number;
  /** d100 for settlement suffix name */
  settlementSuffixRoll: number;
  /** d100 for road presence (vs road%) */
  roadRoll: number;
  /** d6 for road direction */
  roadDirRoll: number;
  /** d6 for road split */
  roadSplitRoll: number;
  /** d100 for river presence (vs river%) */
  riverRoll: number;
  /** d6 for river direction */
  riverDirRoll: number;
  /** d6 for river split */
  riverSplitRoll: number;
  /** d6 directions for Q1, Q2, Q3 quest hexes */
  questDirRolls: [number, number, number];
  /** d100 rolls for Q1, Q2, Q3 quest entries */
  questTableRolls: [[number], [number], [number]];
  /** d100 rolls for Q1, Q2, Q3 NPC names */
  questNpcRolls: [number, number, number];
  /** d6 for Q1, Q2, Q3 quest reward */
  questRewardRolls: [number, number, number];
  /** d100 rolls for Q1, Q2, Q3 quest hex terrain */
  questHexTerrainRolls: [number, number, number];
  /** d100 rolls for Q1, Q2, Q3 quest hex names */
  questHexNameRolls: [number, number, number];
  /** Starting year: 1072 (new adventurer), 1074, or 1075 */
  startYear: number;
}

export interface GenerateHexRolls {
  /** d100 for terrain */
  terrainRoll: number;
  /** d100 for hex name */
  hexNameRoll: number;
  /** d100 for settlement presence (vs terrain.settlementChance) */
  settlementPresenceRoll: number;
  /** d6 for settlement type (1-3=village, 4-5=town, 6=city) */
  settlementTypeRoll: number;
  /** d100 for settlement prefix name */
  settlementPrefixRoll: number;
  /** d100 for settlement suffix name */
  settlementSuffixRoll: number;
  /** d100 for road presence */
  roadRoll: number;
  /** d6 for road direction */
  roadDirRoll: number;
  /** d6 for road split */
  roadSplitRoll: number;
  /** d6 for extra road split direction (if split=6) */
  roadSplitDir2Roll: number;
  /** d100 for river presence */
  riverRoll: number;
  /** d6 for river direction */
  riverDirRoll: number;
  /** d6 for river split */
  riverSplitRoll: number;
  /** d6 for extra river split direction (if split=6) */
  riverSplitDir2Roll: number;
}

export interface InitWorldInput {
  /** Starting skill choices (2 skills from the allowed list) */
  startingSkills: [string, string];
  /**
   * Preferred terrain type for home hex.
   * If null, use terrainRoll vs terrain table (but validated against race).
   */
  preferredTerrain?: TerrainType;
  rolls: InitWorldRolls;
}

export interface WorldBuilderSetupResult {
  message: string;
  hexId: string;
  terrainType: TerrainType;
  hexName: string;
  settlementType: "village" | "town" | "city";
  settlementName: string;
  roads: number[];
  rivers: number[];
  startingQuests: Array<{
    code: string;
    hexId: string;
    name: string;
    details: string;
    qc: number;
    pc: number;
    rv: number;
    npcName?: string;
  }>;
  calendar: { year: number; month: number; day: number; rations: number };
}

export interface GenerateHexResult {
  hex: HexData;
  message: string;
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function hexIdFromAxial(q: number, r: number): string {
  return `q:${q},r:${r}`;
}

function axialFromHexId(id: string): { q: number; r: number } {
  const match = id.match(/^q:(-?\d+),r:(-?\d+)$/);
  if (!match) throw new Error(`Invalid hex ID: ${id}`);
  return { q: parseInt(match[1]), r: parseInt(match[2]) };
}

function addAxial(a: [number, number], b: [number, number]): [number, number] {
  return [a[0] + b[0], a[1] + b[1]];
}

/**
 * Calculate the edges of a hex that connect to a given adjacent hex.
 * Returns the edge number (1-6) for the current hex that faces toward targetHexId.
 */
function edgeToward(fromId: string, toId: string): number | null {
  const from = axialFromHexId(fromId);
  const to = axialFromHexId(toId);
  const dq = to.q - from.q;
  const dr = to.r - from.r;
  for (const [dir, vec] of Object.entries(DIRECTION_VECTORS)) {
    if (vec[0] === dq && vec[1] === dr) return parseInt(dir);
  }
  return null;
}

/**
 * Determine road/river edges for a hex.
 * adjacentEdges: edges that already have a road/river in adjacent hexes pointing toward this hex.
 * d6DirRoll: primary direction roll (1-6)
 * d6SplitRoll: split roll (5 = 1 extra split, 6 = 2 extra splits)
 * d6ExtraDirRoll: direction for the extra split road/river
 */
function determineRoadRiverEdges(
  adjacentEdges: number[],
  d6DirRoll: number,
  d6SplitRoll: number,
  d6ExtraDirRoll: number,
): number[] {
  const edges = new Set<number>();

  if (adjacentEdges.length === 0) {
    // No adjacent — start fresh from direction roll
    const entry = d6DirRoll as 1 | 2 | 3 | 4 | 5 | 6;
    const vec = DIRECTION_VECTORS[entry];
    if (vec) {
      // Enter from direction, exit through opposite
      edges.add(d6DirRoll);
      edges.add(OPPOSITE_EDGE[d6DirRoll]);
    }
  } else if (adjacentEdges.length === 1) {
    // Enter from the one adjacent edge's opposite, flow to opposite of our entry
    const entryEdge = OPPOSITE_EDGE[adjacentEdges[0]];
    edges.add(entryEdge);
    const exitEdge = OPPOSITE_EDGE[entryEdge];
    edges.add(exitEdge);
  } else if (adjacentEdges.length === 2) {
    // Join the two
    adjacentEdges.forEach((e) => edges.add(OPPOSITE_EDGE[e]));
  } else if (adjacentEdges.length === 3) {
    // Join all three, only add split if roll=6
    adjacentEdges.forEach((e) => edges.add(OPPOSITE_EDGE[e]));
  } else {
    // 4+ adjacent: join 4, no splits
    adjacentEdges.slice(0, 4).forEach((e) => edges.add(OPPOSITE_EDGE[e]));
  }

  // Apply splits (only when adjacentEdges.length <= 2)
  if (adjacentEdges.length <= 2) {
    if (d6SplitRoll >= 5) {
      // 5 = 1 extra split, 6 = 2 extra splits
      const extraCount = d6SplitRoll === 6 ? 2 : 1;
      let splitEdge = d6ExtraDirRoll;
      if (!edges.has(splitEdge)) edges.add(splitEdge);
      if (extraCount === 2) {
        splitEdge = (splitEdge % 6) + 1;
        if (!edges.has(splitEdge)) edges.add(splitEdge);
      }
    }
  } else if (adjacentEdges.length === 3 && d6SplitRoll === 6) {
    const splitEdge = d6ExtraDirRoll;
    if (!edges.has(splitEdge)) edges.add(splitEdge);
  }

  return Array.from(edges).sort();
}

function rollsNamesEntry(roll: number): NamesEntry {
  const entry = NAMES_TABLE.find((e) => e.roll === roll);
  if (!entry) throw new Error(`Invalid names table roll: ${roll}`);
  return entry;
}

/**
 * Find the next available quest hex position along a direction.
 * direction: 1-6; distance: number of hexes from origin
 */
function questHexId(originId: string, dirRoll: number, distance: number): string {
  const origin = axialFromHexId(originId);
  const vec = DIRECTION_VECTORS[dirRoll as 1 | 2 | 3 | 4 | 5 | 6];
  if (!vec) throw new Error(`Invalid direction roll: ${dirRoll}`);
  const q = origin.q + vec[0] * distance;
  const r = origin.r + vec[1] * distance;
  return hexIdFromAxial(q, r);
}

// ---------------------------------------------------------------------------
// WorldBuilderSetupService
// ---------------------------------------------------------------------------

export class WorldBuilderSetupService {

  /**
   * Full 12-step World Builder initialization.
   * Returns the updated adventurer and a result summary.
   */
  initializeWorld(
    adventurer: Adventurer,
    input: InitWorldInput,
  ): { adventurer: Adventurer; result: WorldBuilderSetupResult } {
    const { rolls, startingSkills, preferredTerrain } = input;
    const homeHexId = hexIdFromAxial(0, 0);

    // Step 1: Determine home terrain (race-based preference or roll)
    const raceTerrain = RACE_HOME_TERRAIN[adventurer.race ?? "Human"] ?? ["Grasslands", "Hills"];
    let homeTerrain: TerrainType;
    if (preferredTerrain && raceTerrain.includes(preferredTerrain)) {
      homeTerrain = preferredTerrain;
    } else if (preferredTerrain) {
      // Use preferred even if not race-native (GM discretion)
      homeTerrain = preferredTerrain;
    } else {
      // Roll on terrain table, but re-roll if not in race terrains
      const terrainEntry = getTerrainByRoll(rolls.terrainRoll);
      homeTerrain = raceTerrain.includes(terrainEntry.terrain)
        ? terrainEntry.terrain
        : raceTerrain[0];
    }
    const homeTerrainEntry = getTerrainByType(homeTerrain);

    // Step 2: Home hex name
    const hexNameEntry = rollsNamesEntry(rolls.hexNameRoll);
    const hexName = buildHexName(hexNameEntry.hexName, homeTerrain);
    const hexRewardAdj = hexNameEntry.hexRewardAdj;

    // Step 3: Home settlement (home hex always has a settlement — city by default)
    const settlementTypeRoll = rolls.settlementTypeRoll;
    const settlementType: "village" | "town" | "city" =
      settlementTypeRoll <= 3 ? "village" : settlementTypeRoll <= 5 ? "town" : "city";

    // Step 4: Settlement name
    const settlementName = buildSettlementName(rolls.settlementPrefixRoll, rolls.settlementSuffixRoll);

    // Step 5: Roads
    const roadChance = homeTerrainEntry.roadChance;
    const roads: number[] = [];
    if (rolls.roadRoll <= roadChance) {
      const roadEdges = determineRoadRiverEdges([], rolls.roadDirRoll, rolls.roadSplitRoll, rolls.roadDirRoll);
      roads.push(...roadEdges);
    }

    // Step 6: Rivers
    const riverChance = homeTerrainEntry.riverChance;
    const rivers: number[] = [];
    if (rolls.riverRoll <= riverChance) {
      const riverEdges = determineRoadRiverEdges([], rolls.riverDirRoll, rolls.riverSplitRoll, rolls.riverDirRoll);
      rivers.push(...riverEdges);
    }

    // Build home hex
    const homeHex: HexData = {
      id: homeHexId,
      sheetId: 1,
      terrain: homeTerrain,
      name: hexName,
      rewardAdjustment: hexRewardAdj,
      settlement: { type: settlementType, name: settlementName },
      roads,
      rivers,
      hasCamp: false,
      atWar: false,
    };

    // Step 7–9: Generate Q1 (dir, 1 hex), Q2 (dir, 2 hexes), Q3 (dir, 3 hexes)
    const startingQuests: WorldBuilderSetupResult["startingQuests"] = [];
    const questHexes: Record<string, HexData> = { [homeHexId]: homeHex };
    const questRecords: WBQuestRecord[] = [];

    const questCodes = ["Q1", "Q2", "Q3"] as const;
    for (let i = 0; i < 3; i++) {
      const dirRoll = rolls.questDirRolls[i];
      const distance = i + 1; // Q1=1, Q2=2, Q3=3
      const qHexId = questHexId(homeHexId, dirRoll, distance);

      // Generate basic quest hex (simplified for startup)
      const qTerrainEntry = getTerrainByRoll(rolls.questHexTerrainRolls[i]);
      const qHexNameEntry = rollsNamesEntry(rolls.questHexNameRolls[i]);
      const qHexName = buildHexName(qHexNameEntry.hexName, qTerrainEntry.terrain);

      const qHex: HexData = {
        id: qHexId,
        sheetId: 1,
        terrain: qTerrainEntry.terrain,
        name: qHexName,
        rewardAdjustment: qHexNameEntry.hexRewardAdj,
        questCode: questCodes[i],
        roads: [],
        rivers: [],
        hasCamp: false,
        atWar: false,
      };
      questHexes[qHexId] = qHex;

      // Generate quest details
      const questTableRoll = rolls.questTableRolls[i][0];
      const template = getWBQuestTemplate(Math.min(Math.max(questTableRoll, 1), 100));
      const npcEntry = template.requiresNpc ? rollsNamesEntry(rolls.questNpcRolls[i]) : null;
      const npcName = npcEntry ? npcEntry.person : undefined;
      const pc = npcEntry ? npcEntry.personRewardAdj : 0;
      const hc = qHexNameEntry.hexRewardAdj;
      const rv = template.qc + pc + hc;
      const rewardEntry = getQuestReward(rv, rolls.questRewardRolls[i]);

      const questRecord: WBQuestRecord = {
        code: questCodes[i],
        hexId: qHexId,
        tableRoll: questTableRoll,
        name: template.name,
        details: npcName
          ? template.details.replace(/\[PERSON\]/g, npcName)
          : template.details,
        qc: template.qc,
        pc,
        hc,
        rv,
        successText: `+${rewardEntry.successGold}gp${rewardEntry.successRep ? ` +${rewardEntry.successRep} REP` : ""}`,
        failureText: rewardEntry.failureType === "halfGold"
          ? "Lose half the reward"
          : rewardEntry.failureStat
          ? `${rewardEntry.failureStat} -${rewardEntry.failureStatLoss}${rewardEntry.failureRep ? `, REP -${rewardEntry.failureRep}` : ""}`
          : `Skill -${rewardEntry.failureSkillLoss}${rewardEntry.failureRep ? `, REP -${rewardEntry.failureRep}` : ""}`,
        encMod: rewardEntry.encMod,
        npcName,
        isUnique: template.isUnique,
        requiresHandIn: template.requiresHandIn,
        status: "active",
      };
      questRecords.push(questRecord);

      startingQuests.push({
        code: questCodes[i],
        hexId: qHexId,
        name: template.name,
        details: questRecord.details,
        qc: template.qc,
        pc,
        rv,
        npcName,
      });
    }

    // Build initial hex sheet (Continent 1: Caldoria)
    const hexSheet: HexSheet = {
      sheetId: 1,
      hexes: questHexes,
      quests: questRecords,
      questsCompleted: 0,
      isComplete: false,
      continentId: 1,
      continentName: "Caldoria",
    };

    // Step 10: Calendar
    const calendar = {
      year: rolls.startYear,
      month: 1,
      day: 1,
      rations: 15,
      fatigue: 0,
      questTimePips: 0,
      circledDates: [],
    };

    // Step 11: Starting skills (+5 to each chosen skill)
    const updatedSkills = { ...adventurer.skills };
    for (const skill of startingSkills) {
      updatedSkills[skill] = (updatedSkills[skill] ?? 0) + 5;
    }

    // Build WorldBuilderState
    const wbState: WorldBuilderState = {
      hexSheets: [hexSheet],
      currentSheetIndex: 0,
      currentHexId: homeHexId,
      calendar,
      mounts: [],
      lawlessPoints: 0,
      witchSuspicion: 0,
      wbStartingSkills: [...startingSkills],
      uniqueTreasuresFound: [],
      hasBandOfUnity: false,
    };

    const updatedAdventurer: Adventurer = {
      ...adventurer,
      skills: updatedSkills,
      worldBuilder: wbState,
    };

    return {
      adventurer: updatedAdventurer,
      result: {
        message: `World Builder initialized. Welcome to ${hexName}!`,
        hexId: homeHexId,
        terrainType: homeTerrain,
        hexName,
        settlementType,
        settlementName,
        roads,
        rivers,
        startingQuests,
        calendar,
      },
    };
  }

  /**
   * Generate a single hex at the given coordinates.
   * adjacentHexes: list of already-generated hex IDs adjacent to this one (for road/river joining).
   */
  generateHex(
    state: WorldBuilderState,
    hexId: string,
    rolls: GenerateHexRolls,
    adjacentHexIds: string[] = [],
  ): { state: WorldBuilderState; result: GenerateHexResult } {
    const sheet = state.hexSheets[state.currentSheetIndex];
    if (!sheet) throw new Error("No active hex sheet");

    // Existing hexes set for name uniqueness check
    const existingHexNames = new Set(
      Object.values(sheet.hexes).map((h) => h.name)
    );
    const existingSettlementNames = new Set(
      Object.values(sheet.hexes)
        .filter((h) => h.settlement)
        .map((h) => h.settlement!.name)
    );

    // Step 1: Terrain
    const terrainEntry = getTerrainByRoll(rolls.terrainRoll);
    const terrain = terrainEntry.terrain;

    // Step 2: Hex name (ensure unique on sheet)
    let hexNameEntry = rollsNamesEntry(rolls.hexNameRoll);
    let hexName = buildHexName(hexNameEntry.hexName, terrain);
    // If duplicate, use hexId as fallback suffix
    if (existingHexNames.has(hexName)) {
      hexName = `${hexName} (${hexId})`;
    }

    // Step 3: Settlement presence
    const settlementChance = this._calcSettlementChance(terrainEntry.settlementChance, adjacentHexIds, sheet);
    const hasSettlement = rolls.settlementPresenceRoll <= settlementChance;

    let settlement: HexData["settlement"] | undefined;
    if (hasSettlement) {
      const stRoll = rolls.settlementTypeRoll;
      const stType: "village" | "town" | "city" =
        stRoll <= 3 ? "village" : stRoll <= 5 ? "town" : "city";

      let stName = buildSettlementName(rolls.settlementPrefixRoll, rolls.settlementSuffixRoll);
      if (existingSettlementNames.has(stName)) {
        stName = `${stName} (${terrain})`;
      }
      settlement = { type: stType, name: stName };
    }

    // Steps 5–6: Roads and rivers
    const roadChance = this._calcRoadChance(terrainEntry.roadChance, adjacentHexIds, sheet);
    const riverChance = this._calcRiverChance(terrainEntry.riverChance, adjacentHexIds, sheet);

    const adjacentRoadEdges = this._findAdjacentEdges("road", hexId, adjacentHexIds, sheet);
    const adjacentRiverEdges = this._findAdjacentEdges("river", hexId, adjacentHexIds, sheet);

    let roads: number[] = [];
    if (adjacentRoadEdges.length > 0 || rolls.roadRoll <= roadChance) {
      roads = determineRoadRiverEdges(
        adjacentRoadEdges,
        rolls.roadDirRoll,
        rolls.roadSplitRoll,
        rolls.roadSplitDir2Roll,
      );
    }

    let rivers: number[] = [];
    if (adjacentRiverEdges.length > 0 || rolls.riverRoll <= riverChance) {
      rivers = determineRoadRiverEdges(
        adjacentRiverEdges,
        rolls.riverDirRoll,
        rolls.riverSplitRoll,
        rolls.riverSplitDir2Roll,
      );
    }

    const hex: HexData = {
      id: hexId,
      sheetId: sheet.sheetId,
      terrain,
      name: hexName,
      rewardAdjustment: hexNameEntry.hexRewardAdj,
      settlement,
      roads,
      rivers,
      hasCamp: false,
      atWar: false,
    };

    // Update sheet
    const updatedSheet: HexSheet = {
      ...sheet,
      hexes: { ...sheet.hexes, [hexId]: hex },
    };
    const updatedSheets = [...state.hexSheets];
    updatedSheets[state.currentSheetIndex] = updatedSheet;

    const updatedState: WorldBuilderState = { ...state, hexSheets: updatedSheets };

    return {
      state: updatedState,
      result: {
        hex,
        message: `Generated ${terrain} hex "${hexName}"${settlement ? ` with a ${settlement.type} called "${settlement.name}"` : ""}.`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _calcSettlementChance(base: number, adjacentIds: string[], sheet: HexSheet): number {
    let chance = base;
    for (const adjId of adjacentIds) {
      const adj = sheet.hexes[adjId];
      if (!adj?.settlement) continue;
      if (adj.settlement.type === "village") chance += 5;
      else if (adj.settlement.type === "town") chance += 10;
      else if (adj.settlement.type === "city") chance += 20;
    }
    return Math.min(chance, 95);
  }

  private _calcRoadChance(base: number, adjacentIds: string[], sheet: HexSheet): number {
    let chance = base;
    for (const adjId of adjacentIds) {
      const adj = sheet.hexes[adjId];
      if (adj?.roads && adj.roads.length > 0) chance += 10;
    }
    return Math.min(chance, 95);
  }

  private _calcRiverChance(base: number, adjacentIds: string[], sheet: HexSheet): number {
    let chance = base;
    for (const adjId of adjacentIds) {
      const adj = sheet.hexes[adjId];
      if (adj?.rivers && adj.rivers.length > 0) chance += 10;
    }
    return Math.min(chance, 95);
  }

  /** Find edges in adjacent hexes that point toward hexId (for road/river joining) */
  private _findAdjacentEdges(
    type: "road" | "river",
    hexId: string,
    adjacentIds: string[],
    sheet: HexSheet,
  ): number[] {
    const edges: number[] = [];
    for (const adjId of adjacentIds) {
      const adj = sheet.hexes[adjId];
      if (!adj) continue;
      const edgeFromAdj = edgeToward(adjId, hexId);
      if (edgeFromAdj === null) continue;
      const adjEdges = type === "road" ? adj.roads : adj.rivers;
      if (adjEdges.includes(edgeFromAdj)) {
        edges.push(OPPOSITE_EDGE[edgeFromAdj]);
      }
    }
    return edges;
  }
}
