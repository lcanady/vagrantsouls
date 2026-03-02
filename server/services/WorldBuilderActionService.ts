/**
 * WorldBuilderActionService
 *
 * Handles all overworld actions, each costing 1 or more Action Points (AP).
 * Each AP spent = 1 day crossed off the calendar.
 *
 * Actions:
 * - restAction (2 AP)
 * - scoutAction (2 AP)
 * - forageAction (1 AP, up to x3)
 * - fishingAction (1 AP, up to x3)
 * - moveAction (variable AP = terrain base ± modifiers)
 * - cartAction (1 AP)
 * - rideAction (1 AP)
 * - layOfTheLandAction (1 AP)
 * - newsOfQuestsAction (1 AP)
 * - makeCampAction (2 AP)
 */

import { Adventurer, WorldBuilderState, HexData } from "../models/adventurer.ts";
import { WorldBuilderCalendarService, MarkDayRolls } from "./WorldBuilderCalendarService.ts";
import { getTerrainByType } from "../data/world_builder/terrain_table.ts";

const calendarService = new WorldBuilderCalendarService();

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ActionResult {
  success: boolean;
  message: string;
  apSpent: number;
  pendingEvents?: Array<{ eventName: string; modifier: number }>;
  /** Extra data specific to each action */
  data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helper: spend N days and collect pending events
// ---------------------------------------------------------------------------

function spendDays(
  adventurer: Adventurer,
  state: WorldBuilderState,
  days: number,
  rollsPerDay: MarkDayRolls[],
): { adventurer: Adventurer; state: WorldBuilderState; pendingEvents: Array<{ eventName: string; modifier: number }> } {
  const { adventurer: a, state: s, result } =
    calendarService.markDays(adventurer, state, days, rollsPerDay);
  return { adventurer: a, state: s, pendingEvents: result.pendingEvents };
}

function currentHex(state: WorldBuilderState): HexData | undefined {
  const sheet = state.hexSheets[state.currentSheetIndex];
  return sheet?.hexes[state.currentHexId];
}

// ---------------------------------------------------------------------------
// WorldBuilderActionService
// ---------------------------------------------------------------------------

export class WorldBuilderActionService {

  /**
   * REST ACTION (2 AP)
   * Remove 1 fatigue pip. Mark 2 days.
   */
  restAction(
    adventurer: Adventurer,
    state: WorldBuilderState,
    rollsPerDay: [MarkDayRolls, MarkDayRolls],
  ): { adventurer: Adventurer; state: WorldBuilderState; result: ActionResult } {
    const newFatigue = Math.max(0, state.calendar.fatigue - 1);
    let s: WorldBuilderState = {
      ...state,
      calendar: { ...state.calendar, fatigue: newFatigue },
    };

    const { adventurer: a, state: s2, pendingEvents } = spendDays(adventurer, s, 2, rollsPerDay);

    return {
      adventurer: a,
      state: s2,
      result: {
        success: true,
        message: `Rested for 2 days. Fatigue removed: 1 pip. Remaining fatigue: ${newFatigue}.`,
        apSpent: 2,
        pendingEvents,
      },
    };
  }

  /**
   * SCOUT ACTION (2 AP)
   * Scout an adjacent blank hex (hex generation handled by SetupService).
   * Rolls an event check vs population% of current terrain.
   */
  scoutAction(
    adventurer: Adventurer,
    state: WorldBuilderState,
    targetHexId: string,
    eventRoll: number,
    rollsPerDay: [MarkDayRolls, MarkDayRolls],
  ): { adventurer: Adventurer; state: WorldBuilderState; result: ActionResult } {
    const hex = currentHex(state);
    const pendingEvents: Array<{ eventName: string; modifier: number }> = [];

    // Check event vs population chance
    if (hex) {
      const terrainEntry = getTerrainByType(hex.terrain);
      const popChance = this._calcPopChance(terrainEntry.populationChance, hex);
      if (eventRoll <= popChance) {
        pendingEvents.push({ eventName: "event_check", modifier: 0 });
      }
    }

    const { adventurer: a, state: s2, pendingEvents: dayEvents } = spendDays(adventurer, state, 2, rollsPerDay);
    pendingEvents.push(...dayEvents);

    return {
      adventurer: a,
      state: s2,
      result: {
        success: true,
        message: `Scouted hex ${targetHexId}. Hex generation required — call setup/hex endpoint.`,
        apSpent: 2,
        pendingEvents,
        data: { targetHexId },
      },
    };
  }

  /**
   * FORAGE ACTION (1 AP, up to x3 per hex)
   * Methods: HARVESTING (Test Int-FP), TRAPPING (Test Dex-FP), HUNTING (Test Str-FP)
   *
   * @param method "harvesting" | "trapping" | "hunting"
   * @param testRoll d100 roll for the stat test
   * @param preyMonsterRoll If trapping/hunting fails, this determines if the PREY MONSTER is encountered
   */
  forageAction(
    adventurer: Adventurer,
    state: WorldBuilderState,
    method: "harvesting" | "trapping" | "hunting",
    testRoll: number,
    rollsPerDay: [MarkDayRolls],
    preyMonsterEncountered?: boolean,
  ): { adventurer: Adventurer; state: WorldBuilderState; result: ActionResult } {
    const hex = currentHex(state);
    if (!hex) throw new Error("No current hex data");

    const terrainEntry = getTerrainByType(hex.terrain);
    const fp = terrainEntry.foragePenalty; // negative number e.g. -30
    const baseRations = terrainEntry.forageRations;
    const seasonBonus = calendarService.getSeasonBonus(state.calendar.month);

    // Determine which stat to test
    const statMap = {
      harvesting: adventurer.int ?? 30,
      trapping: adventurer.dex ?? 40,
      hunting: adventurer.str ?? 50,
    };
    const baseStat = statMap[method];
    const threshold = baseStat + fp; // fp is already negative

    // Skills bonus
    const skillBonus = method === "harvesting"
      ? (adventurer.skills["Survival"] ?? 0) + (adventurer.skills["Aware"] ?? 0)
      : (adventurer.skills["Traps"] ?? 0) + (adventurer.skills["Hunting"] ?? 0) + (adventurer.skills["Agility"] ?? 0);

    const finalThreshold = threshold + skillBonus;
    const success = testRoll <= finalThreshold;
    const pendingEvents: Array<{ eventName: string; modifier: number }> = [];

    let message: string;
    const updatedState = { ...state };

    if (success) {
      const rationGain = baseRations + seasonBonus;
      const newRations = Math.min(30, state.calendar.rations + rationGain);
      updatedState.calendar = { ...state.calendar, rations: newRations };
      message = `${method.toUpperCase()} successful! Gained ${rationGain} rations (ç${seasonBonus >= 0 ? "+" : ""}${seasonBonus}).`;
    } else {
      if (method === "harvesting") {
        // Poisoned: +1d3 poison pips
        message = `HARVESTING failed — Poisoned! Poison pips increased.`;
        pendingEvents.push({ eventName: "POISON_FROM_FORAGE", modifier: 0 });
      } else {
        // PREY MONSTER attacked
        message = `${method.toUpperCase()} failed — PREY MONSTER attacks! (AV 30, Def 0, Dmg -1, HP 10, Surprise)`;
        pendingEvents.push({ eventName: "PREY_MONSTER", modifier: 0 });
      }
    }

    const { adventurer: a, state: s2, pendingEvents: dayEvents } = spendDays(adventurer, updatedState, 1, rollsPerDay);
    pendingEvents.push(...dayEvents);

    return {
      adventurer: a,
      state: s2,
      result: {
        success,
        message,
        apSpent: 1,
        pendingEvents,
        data: { method, testRoll, threshold: finalThreshold, success },
      },
    };
  }

  /**
   * FISHING ACTION (1 AP, up to x3 per hex)
   * Requires fishing rod. Test Dex-FP.
   * Failure: rod damage pip. Bait: +5 to threshold.
   */
  fishingAction(
    adventurer: Adventurer,
    state: WorldBuilderState,
    testRoll: number,
    useBait: boolean,
    rollsPerDay: [MarkDayRolls],
  ): { adventurer: Adventurer; state: WorldBuilderState; result: ActionResult } {
    const hex = currentHex(state);
    if (!hex) throw new Error("No current hex data");

    const terrainEntry = getTerrainByType(hex.terrain);
    const fp = terrainEntry.foragePenalty;
    const baseRations = terrainEntry.forageRations;
    const seasonBonus = calendarService.getSeasonBonus(state.calendar.month);

    const baitBonus = useBait ? 5 : 0;
    const threshold = (adventurer.dex ?? 40) + fp + baitBonus + (adventurer.skills["Fishing"] ?? 0);

    const success = testRoll <= threshold;
    const pendingEvents: Array<{ eventName: string; modifier: number }> = [];
    let message: string;

    if (success) {
      const rationGain = baseRations + seasonBonus;
      const updatedState = {
        ...state,
        calendar: { ...state.calendar, rations: Math.min(30, state.calendar.rations + rationGain) },
      };
      const { adventurer: a, state: s2, pendingEvents: dayEvents } = spendDays(adventurer, updatedState, 1, rollsPerDay);
      pendingEvents.push(...dayEvents);
      message = `FISHING successful! Gained ${rationGain} rations.`;
      return {
        adventurer: a,
        state: s2,
        result: { success, message, apSpent: 1, pendingEvents, data: { threshold } },
      };
    } else {
      // Failure: fishing rod gets 1 damage pip
      message = `FISHING failed — fishing rod takes 1 damage pip.`;
      pendingEvents.push({ eventName: "ROD_DAMAGE", modifier: 0 });
    }

    const { adventurer: a, state: s2, pendingEvents: dayEvents } = spendDays(adventurer, state, 1, rollsPerDay);
    pendingEvents.push(...dayEvents);

    return {
      adventurer: a,
      state: s2,
      result: { success, message, apSpent: 1, pendingEvents, data: { threshold } },
    };
  }

  /**
   * MOVE ACTION (variable AP)
   * Move to an adjacent generated hex.
   * AP cost = terrain base ± road bonus (-2) ± river crossing (+2) ± sea cost (8 AP + 60gp).
   *
   * @param targetHexId Must be already generated
   * @param hasRoadBetween Whether the edge between hexes has a road
   * @param hasRiverCrossing Whether crossing a river without a road
   * @param eventRoll d100 for event check during move
   * @param rollsPerDay One set per day spent moving
   */
  moveAction(
    adventurer: Adventurer,
    state: WorldBuilderState,
    targetHexId: string,
    hasRoadBetween: boolean,
    hasRiverCrossing: boolean,
    eventRoll: number,
    rollsPerDay: MarkDayRolls[],
  ): { adventurer: Adventurer; state: WorldBuilderState; result: ActionResult } {
    const sheet = state.hexSheets[state.currentSheetIndex];
    const targetHex = sheet?.hexes[targetHexId];
    if (!targetHex) throw new Error(`Hex ${targetHexId} has not been generated yet`);

    const terrainEntry = getTerrainByType(targetHex.terrain);
    let apCost = terrainEntry.moveAP;
    let goldCost = 0;

    if (hasRoadBetween) apCost = Math.max(1, apCost - 2);
    if (hasRiverCrossing && !hasRoadBetween) apCost += 2;
    if (targetHex.terrain === "Seas") {
      apCost = 8;
      goldCost = 60; // per hex sea crossing
    }

    // Deduct gold for sea crossing
    let updatedAdventurer = adventurer;
    if (goldCost > 0) {
      if (adventurer.gold < goldCost) {
        return {
          adventurer,
          state,
          result: {
            success: false,
            message: `Cannot cross sea — need ${goldCost}gp but only have ${adventurer.gold}gp.`,
            apSpent: 0,
          },
        };
      }
      updatedAdventurer = { ...adventurer, gold: adventurer.gold - goldCost };
    }

    // Event check vs current terrain population
    const pendingEvents: Array<{ eventName: string; modifier: number }> = [];
    const currentHexData = sheet?.hexes[state.currentHexId];
    if (currentHexData) {
      const popChance = this._calcPopChance(
        getTerrainByType(currentHexData.terrain).populationChance,
        currentHexData,
      );
      if (eventRoll <= popChance) {
        pendingEvents.push({ eventName: "event_check", modifier: 0 });
      }
    }

    // Move
    const updatedState: WorldBuilderState = {
      ...state,
      currentHexId: targetHexId,
    };

    const { adventurer: a, state: s2, pendingEvents: dayEvents } = spendDays(
      updatedAdventurer,
      updatedState,
      apCost,
      rollsPerDay,
    );
    pendingEvents.push(...dayEvents);

    return {
      adventurer: a,
      state: s2,
      result: {
        success: true,
        message: `Moved to ${targetHex.name} (${targetHex.terrain}). Cost: ${apCost} AP${goldCost > 0 ? ` + ${goldCost}gp` : ""}.`,
        apSpent: apCost,
        pendingEvents,
        data: { targetHexId, apCost, goldCost, terrain: targetHex.terrain },
      },
    };
  }

  /**
   * CART ACTION (1 AP)
   * Roll vs population% to hitch a cart.
   * Success: move at -3 AP cost. Fail: event.
   */
  cartAction(
    adventurer: Adventurer,
    state: WorldBuilderState,
    cartRoll: number,
    haggleRoll: number | undefined,
    rollsPerDay: [MarkDayRolls],
  ): { adventurer: Adventurer; state: WorldBuilderState; result: ActionResult } {
    const hex = currentHex(state);
    if (!hex) throw new Error("No current hex data");

    const terrainEntry = getTerrainByType(hex.terrain);
    const popChance = this._calcPopChance(terrainEntry.populationChance, hex);
    const success = cartRoll <= popChance;
    const pendingEvents: Array<{ eventName: string; modifier: number }> = [];

    const { adventurer: a, state: s2, pendingEvents: dayEvents } = spendDays(adventurer, state, 1, rollsPerDay);
    pendingEvents.push(...dayEvents);

    let message: string;
    if (success) {
      message = `Cart found! Next MOVE action costs -3 AP.`;
      pendingEvents.push({ eventName: "CART_BONUS", modifier: -3 });
    } else {
      message = `No cart found — event triggered.`;
      pendingEvents.push({ eventName: "event_check", modifier: 0 });
    }

    return {
      adventurer: a,
      state: s2,
      result: { success, message, apSpent: 1, pendingEvents, data: { cartRoll, popChance } },
    };
  }

  /**
   * RIDE ACTION (1 AP)
   * Test Dex-RP. Success: next MOVE costs -3 AP. Fail: next MOVE costs -2 AP + HP damage.
   */
  rideAction(
    adventurer: Adventurer,
    state: WorldBuilderState,
    mountIndex: number,
    ridingRoll: number,
    rollsPerDay: [MarkDayRolls],
  ): { adventurer: Adventurer; state: WorldBuilderState; result: ActionResult } {
    const hex = currentHex(state);
    if (!hex) throw new Error("No current hex data");
    const mount = state.mounts[mountIndex];
    if (!mount) throw new Error(`No mount at slot ${mountIndex}`);

    const terrainEntry = getTerrainByType(hex.terrain);
    // Dragon and flying carpet ignore RP
    const rp = (mount.type === "dragon" || mount.type === "flying_carpet") ? 0 : terrainEntry.ridePenalty;
    // Flying carpet uses Int instead of Dex
    const baseStat = mount.type === "flying_carpet" ? (adventurer.int ?? 30) : (adventurer.dex ?? 40);
    const threshold = baseStat + rp + (adventurer.skills["Riding"] ?? 0);

    const success = ridingRoll <= threshold;
    const pendingEvents: Array<{ eventName: string; modifier: number }> = [];

    const { adventurer: a, state: s2, pendingEvents: dayEvents } = spendDays(adventurer, state, 1, rollsPerDay);
    pendingEvents.push(...dayEvents);

    let message: string;
    if (success) {
      message = `RIDING successful on ${mount.name}! Next MOVE costs -3 AP.`;
      pendingEvents.push({ eventName: "RIDE_SUCCESS_BONUS", modifier: -3 });
    } else {
      message = `RIDING failed on ${mount.name}! Next MOVE costs -2 AP and adventurer takes damage.`;
      pendingEvents.push({ eventName: "RIDE_FAIL_DAMAGE", modifier: -2 });
    }

    return {
      adventurer: a,
      state: s2,
      result: { success, message, apSpent: 1, pendingEvents, data: { mount: mount.name, threshold, ridingRoll } },
    };
  }

  /**
   * LAY OF THE LAND ACTION (1 AP)
   * Roll vs population% - 5% per hex distance.
   * Success: caller should generateHex for targetHexId.
   * Fail: event.
   */
  layOfTheLandAction(
    adventurer: Adventurer,
    state: WorldBuilderState,
    targetHexId: string,
    distance: number,
    popRoll: number,
    rollsPerDay: [MarkDayRolls],
  ): { adventurer: Adventurer; state: WorldBuilderState; result: ActionResult } {
    const hex = currentHex(state);
    if (!hex) throw new Error("No current hex data");

    const terrainEntry = getTerrainByType(hex.terrain);
    const popChance = Math.max(0, this._calcPopChance(terrainEntry.populationChance, hex) - 5 * distance);
    const success = popRoll <= popChance;
    const pendingEvents: Array<{ eventName: string; modifier: number }> = [];

    const { adventurer: a, state: s2, pendingEvents: dayEvents } = spendDays(adventurer, state, 1, rollsPerDay);
    pendingEvents.push(...dayEvents);

    let message: string;
    if (success) {
      message = `Lay of the Land successful! Hex ${targetHexId} can be generated (call setup/hex).`;
    } else {
      message = `Lay of the Land failed — event triggered.`;
      pendingEvents.push({ eventName: "event_check", modifier: 0 });
    }

    return {
      adventurer: a,
      state: s2,
      result: { success, message, apSpent: 1, pendingEvents, data: { targetHexId, distance, popChance, popRoll } },
    };
  }

  /**
   * NEWS OF QUESTS ACTION (1 AP)
   * Roll vs population% - 5% per hex distance.
   * Success: new quest generated at targetHexId.
   * Fail: event.
   */
  newsOfQuestsAction(
    adventurer: Adventurer,
    state: WorldBuilderState,
    targetHexId: string,
    distance: number,
    popRoll: number,
    rollsPerDay: [MarkDayRolls],
  ): { adventurer: Adventurer; state: WorldBuilderState; result: ActionResult } {
    const hex = currentHex(state);
    if (!hex) throw new Error("No current hex data");

    const terrainEntry = getTerrainByType(hex.terrain);
    const popChance = Math.max(0, this._calcPopChance(terrainEntry.populationChance, hex) - 5 * distance);
    const success = popRoll <= popChance;
    const pendingEvents: Array<{ eventName: string; modifier: number }> = [];

    const { adventurer: a, state: s2, pendingEvents: dayEvents } = spendDays(adventurer, state, 1, rollsPerDay);
    pendingEvents.push(...dayEvents);

    let message: string;
    if (success) {
      message = `News of Quests! A quest has been placed at hex ${targetHexId} — call quests/generate.`;
      pendingEvents.push({ eventName: "GENERATE_QUEST", modifier: 0 });
    } else {
      message = `News of Quests failed — event triggered.`;
      pendingEvents.push({ eventName: "event_check", modifier: 0 });
    }

    return {
      adventurer: a,
      state: s2,
      result: { success, message, apSpent: 1, pendingEvents, data: { targetHexId, distance, popChance } },
    };
  }

  /**
   * MAKE CAMP ACTION (2 AP)
   * Mark current hex with a camp (▲).
   */
  makeCampAction(
    adventurer: Adventurer,
    state: WorldBuilderState,
    rollsPerDay: [MarkDayRolls, MarkDayRolls],
  ): { adventurer: Adventurer; state: WorldBuilderState; result: ActionResult } {
    const sheet = state.hexSheets[state.currentSheetIndex];
    if (!sheet) throw new Error("No active hex sheet");

    const hex = sheet.hexes[state.currentHexId];
    if (!hex) throw new Error("Not in a generated hex");

    const updatedHex: HexData = { ...hex, hasCamp: true };
    const updatedSheet = {
      ...sheet,
      hexes: { ...sheet.hexes, [state.currentHexId]: updatedHex },
    };
    const updatedSheets = [...state.hexSheets];
    updatedSheets[state.currentSheetIndex] = updatedSheet;

    const updatedState: WorldBuilderState = { ...state, hexSheets: updatedSheets };
    const { adventurer: a, state: s2, pendingEvents } = spendDays(adventurer, updatedState, 2, rollsPerDay);

    return {
      adventurer: a,
      state: s2,
      result: {
        success: true,
        message: `Camp (▲) made at ${hex.name}. You may now use camp settlement actions here.`,
        apSpent: 2,
        pendingEvents,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _calcPopChance(base: number, hex: HexData): number {
    let pop = base;
    if (hex.roads.length > 0) pop += 10;
    if (hex.rivers.length > 0) pop += 10;
    if (hex.settlement) {
      if (hex.settlement.type === "village") pop += 5;
      else if (hex.settlement.type === "town") pop += 10;
      else if (hex.settlement.type === "city") pop += 20;
    }
    return Math.min(pop, 95);
  }
}
