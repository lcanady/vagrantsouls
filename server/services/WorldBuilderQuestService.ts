/**
 * WorldBuilderQuestService
 *
 * Handles:
 * - generateQuest: place a new WB quest on the hex sheet (Q1-Q25)
 * - generateSideQuest: generate a side quest for the current dungeon
 * - completeQuest: apply [S] or [F] outcomes, check land completion
 * - canCompleteQuest: check if hand-in requirements are met
 */

import { Adventurer, WorldBuilderState, WBQuestRecord, HexData } from "../models/adventurer.ts";
import { getWBQuestTemplate } from "../data/world_builder/quests_table.ts";
import { getQuestReward, QRResult } from "../data/world_builder/quest_rewards_table.ts";
import { getSideQuestTemplate } from "../data/world_builder/side_quests_table.ts";
import { NAMES_TABLE } from "../data/world_builder/names_table.ts";
import { DIRECTION_VECTORS } from "../data/world_builder/terrain_table.ts";
import { getUniqueTreasureByQuest } from "../data/world_builder/unique_treasures_table.ts";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface GenerateQuestRolls {
  /** d6 for direction from current hex */
  dirRoll: number;
  /** d6 for distance (1d6 hexes) */
  distRoll: number;
  /** d100 rolls for quest table (usually just one, but array for flexibility) */
  tableRolls: number[];
  /** d100 for NPC name (if requiresNpc) */
  npcRoll?: number;
  /** d6 for quest reward table */
  rewardRoll: number;
  /** Optional: pre-computed H¢ from hex name (0 if not known yet) */
  hexRewardAdj?: number;
}

export interface GenerateSideQuestRolls {
  /** d10 for side quest table */
  d10Roll: number;
  /** Monster name to substitute for "MONSTER" in name/details */
  monsterName: string;
}

export interface QuestCompletionRolls {
  /** d10 for unique treasure check (unique quests only; 10 = found unique) */
  uniqueTreasureRoll?: number;
  /** d10 for alternative treasure if unique not found */
  alternativeTreasureRoll?: number;
}

export interface QuestResult {
  /** Gold gained or lost */
  goldDelta: number;
  /** Reputation gained or lost */
  repDelta: number;
  /** Stat affected (if failure) */
  statAffected?: "str" | "dex" | "int";
  /** Amount of stat change (negative = loss) */
  statDelta?: number;
  /** Skill bonus points lost (if failure) */
  skillLoss?: number;
  /** Whether this was a success */
  success: boolean;
  /** Whether the land (hex sheet) is now complete */
  landComplete: boolean;
  /** Unique treasure name found (if any) */
  uniqueTreasureFound?: string;
  /** Alternative item description (if unique not found) */
  alternativeItem?: string;
  /** QR table result details */
  qrResult: QRResult;
}

export interface SideQuestRecord {
  name: string;
  encMod: number;
  rewardCount: number;
  areasToExplore: number;
  isTrapped: boolean;
  details: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class WorldBuilderQuestService {

  /**
   * Generate and place a new WB quest on the current hex sheet.
   * Finds the next available Q slot (Q1-Q25), moves in the rolled direction
   * by the rolled distance, and places the quest.
   */
  generateQuest(
    adventurer: Adventurer,
    state: WorldBuilderState,
    rolls: GenerateQuestRolls,
  ): { adventurer: Adventurer; state: WorldBuilderState; quest: WBQuestRecord } {
    const sheet = state.hexSheets[state.currentSheetIndex];
    if (!sheet) throw new Error("No current hex sheet");

    // Find next available quest slot (Q1-Q25)
    const existingCodes = new Set(sheet.quests.map((q) => q.code));
    let nextSlot = -1;
    for (let i = 1; i <= 25; i++) {
      if (!existingCodes.has(`Q${i}`)) { nextSlot = i; break; }
    }
    if (nextSlot === -1) throw new Error("All 25 quest slots are filled on this sheet");

    // Determine quest hex location from current position
    const questHexId = this._moveFromHex(state.currentHexId, rolls.dirRoll, rolls.distRoll);

    // Roll on (WB) Q quest table
    const tableRoll = rolls.tableRolls[0] ?? 50;
    const template = getWBQuestTemplate(tableRoll);

    // NPC name (P¢) — only for quests that need an NPC
    let npcName: string | undefined;
    let pc = 0;
    if (template.requiresNpc && rolls.npcRoll !== undefined) {
      const npcEntry = NAMES_TABLE.find((e) => e.roll === rolls.npcRoll) ?? NAMES_TABLE[0];
      npcName = npcEntry.person;
      pc = npcEntry.personRewardAdj;
    }

    // H¢ from hex name reward adjustment
    const hc = rolls.hexRewardAdj ?? 0;

    // RV = Q¢ + P¢ + H¢
    const rv = template.qc + pc + hc;

    // Roll on (WB) QR quest rewards table
    const qrResult = getQuestReward(rv, rolls.rewardRoll);

    const quest: WBQuestRecord = {
      code: `Q${nextSlot}`,
      hexId: questHexId,
      tableRoll,
      name: template.name,
      details: npcName ? template.details.replace(/\[PERSON\]/g, npcName) : template.details,
      qc: template.qc,
      pc,
      hc,
      rv,
      successText: `Gain ${qrResult.successGold}gp${qrResult.successRep > 0 ? ` and +${qrResult.successRep} REP` : ""}`,
      failureText: this._buildFailureText(qrResult),
      encMod: qrResult.encMod,
      npcName,
      isUnique: template.isUnique,
      requiresHandIn: template.requiresHandIn,
      status: "active",
    };

    // Update hex data to mark quest placement
    const updatedSheet = {
      ...sheet,
      quests: [...sheet.quests, quest],
    };

    // Optionally mark the destination hex with the quest code (if already generated)
    const existingHex = sheet.hexes[questHexId];
    const updatedHexes = existingHex
      ? { ...sheet.hexes, [questHexId]: { ...existingHex, questCode: quest.code } }
      : sheet.hexes;

    const updatedSheets = [...state.hexSheets];
    updatedSheets[state.currentSheetIndex] = { ...updatedSheet, hexes: updatedHexes };

    const updatedState: WorldBuilderState = { ...state, hexSheets: updatedSheets };

    return { adventurer, state: updatedState, quest };
  }

  /**
   * Generate a side quest (in-dungeon mini-quest).
   * Rolls d10 on the SQ table and substitutes the monster name.
   */
  generateSideQuest(
    _adventurer: Adventurer,
    _state: WorldBuilderState,
    rolls: GenerateSideQuestRolls,
  ): SideQuestRecord {
    const template = getSideQuestTemplate(rolls.d10Roll);
    const monsterName = rolls.monsterName;

    return {
      name: template.nameTpl.replace("MONSTER", monsterName),
      encMod: template.encMod,
      rewardCount: template.rewardCount,
      areasToExplore: template.areasToExplore,
      isTrapped: template.isTrapped,
      details: template.details.replace(/MONSTER/g, monsterName),
    };
  }

  /**
   * Complete a quest (success or failure).
   * Applies gold/REP/stat outcomes to the adventurer.
   * Checks if all 25 quests are complete → land complete.
   */
  completeQuest(
    adventurer: Adventurer,
    state: WorldBuilderState,
    questCode: string,
    success: boolean,
    rolls: QuestCompletionRolls,
  ): { adventurer: Adventurer; state: WorldBuilderState; result: QuestResult } {
    const sheet = state.hexSheets[state.currentSheetIndex];
    if (!sheet) throw new Error("No current hex sheet");

    const questIndex = sheet.quests.findIndex((q) => q.code === questCode);
    if (questIndex === -1) throw new Error(`Quest ${questCode} not found`);

    const quest = sheet.quests[questIndex];
    const result = this._applyQuestOutcome(adventurer, quest, success, rolls);

    // Update quest status
    const updatedQuests = [...sheet.quests];
    updatedQuests[questIndex] = { ...quest, status: success ? "complete" : "failed" };

    // Check land completion (all 25 quests filled and all complete)
    const completedCount = updatedQuests.filter((q) => q.status === "complete").length;
    const landComplete = completedCount >= 25;

    const updatedSheet = {
      ...sheet,
      quests: updatedQuests,
      questsCompleted: sheet.questsCompleted + (success ? 1 : 0),
      isComplete: landComplete,
    };

    const updatedSheets = [...state.hexSheets];
    updatedSheets[state.currentSheetIndex] = updatedSheet;

    const updatedState: WorldBuilderState = { ...state, hexSheets: updatedSheets };

    return {
      adventurer: result.adventurer,
      state: updatedState,
      result: { ...result.questResult, landComplete },
    };
  }

  /**
   * Check whether the adventurer has the required hand-in items to complete a quest.
   * Returns true if requirements are met (or quest has no hand-in requirement).
   */
  canCompleteQuest(adventurer: Adventurer, state: WorldBuilderState, questCode: string): boolean {
    const sheet = state.hexSheets[state.currentSheetIndex];
    if (!sheet) return false;
    const quest = sheet.quests.find((q) => q.code === questCode);
    if (!quest) return false;
    if (!quest.requiresHandIn) return true;

    // Hand-in quests require items collected during dungeon runs
    // The details text specifies what to collect (e.g. "1d3+1 items from table A")
    // For now, caller is responsible for verifying items; this checks structural flag only
    return true; // actual item verification is done at the route level
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Move from a hex in axial coordinates a given number of steps in a d6 direction.
   * d6→direction: 1=NE, 2=E, 3=SE, 4=SW, 5=W, 6=NW (flat-top hex).
   */
  private _moveFromHex(hexId: string, dirRoll: number, steps: number): string {
    const match = hexId.match(/^q:(-?\d+),r:(-?\d+)$/);
    if (!match) throw new Error(`Invalid hexId: ${hexId}`);
    let q = parseInt(match[1], 10);
    let r = parseInt(match[2], 10);

    const dir = DIRECTION_VECTORS[dirRoll] ?? DIRECTION_VECTORS[1];
    q += dir[0] * steps;
    r += dir[1] * steps;

    return `q:${q},r:${r}`;
  }

  /**
   * Apply quest outcome to adventurer, returning updated adventurer + result.
   */
  private _applyQuestOutcome(
    adventurer: Adventurer,
    quest: WBQuestRecord,
    success: boolean,
    rolls: QuestCompletionRolls,
  ): { adventurer: Adventurer; questResult: Omit<QuestResult, "landComplete"> } {
    // Look up the stored QR result by matching encMod to band
    // Since we stored the encMod, we can find the right band
    const rv = quest.rv;
    // We need a d6 roll to look up the specific row — use reward roll (stored in quest)
    // Since the quest was generated with a specific d6, we need to infer from the stored successText
    // Simplest correct approach: parse successGold from quest.successText
    const goldMatch = quest.successText.match(/(\d+)gp/);
    const successGold = goldMatch ? parseInt(goldMatch[1], 10) : 0;
    const repMatch = quest.successText.match(/\+(\d+) REP/);
    const successRep = repMatch ? parseInt(repMatch[1], 10) : 0;

    // Build a minimal QRResult from stored text (since the d6 was stored at generation time)
    // For failure: parse the type from failureText
    const qrResult = this._parseStoredQRResult(quest, successGold, successRep, quest.encMod);

    let updatedAdventurer = { ...adventurer };
    let goldDelta = 0;
    let repDelta = 0;
    let statAffected: "str" | "dex" | "int" | undefined;
    let statDelta: number | undefined;
    let skillLoss: number | undefined;
    let uniqueTreasureFound: string | undefined;
    let alternativeItem: string | undefined;

    if (success) {
      goldDelta = successGold;
      repDelta = successRep;
      updatedAdventurer = {
        ...updatedAdventurer,
        gold: updatedAdventurer.gold + goldDelta,
        reputation: updatedAdventurer.reputation + repDelta,
        questsCompleted: updatedAdventurer.questsCompleted + 1,
      };

      // Unique treasure check (quests 87-100)
      if (quest.isUnique) {
        const uniqueRoll = rolls.uniqueTreasureRoll ?? 1;
        if (uniqueRoll === 10) {
          const unique = getUniqueTreasureByQuest(quest.tableRoll);
          if (unique) {
            uniqueTreasureFound = unique.name;
            const updatedState_wbState = updatedAdventurer.worldBuilder;
            if (updatedState_wbState) {
              updatedAdventurer = {
                ...updatedAdventurer,
                worldBuilder: {
                  ...updatedState_wbState,
                  uniqueTreasuresFound: [...updatedState_wbState.uniqueTreasuresFound, unique.name],
                },
              };
            }
          }
        } else {
          const unique = getUniqueTreasureByQuest(quest.tableRoll);
          alternativeItem = unique?.alternativeOnFail ?? "Roll on table TC+20";
        }
      }
    } else {
      // Failure outcome
      repDelta = -qrResult.failureRep;
      updatedAdventurer = {
        ...updatedAdventurer,
        reputation: Math.max(0, updatedAdventurer.reputation - qrResult.failureRep),
        questsFailed: updatedAdventurer.questsFailed + 1,
      };

      switch (qrResult.failureType) {
        case "halfGold":
          goldDelta = -Math.floor(successGold / 2);
          updatedAdventurer = {
            ...updatedAdventurer,
            gold: Math.max(0, updatedAdventurer.gold + goldDelta),
          };
          break;
        case "skill":
          skillLoss = qrResult.failureSkillLoss;
          // Reduce the first skill bonus by this amount (caller may pick which skill)
          break;
        case "stat":
        case "statLarge":
          if (qrResult.failureStat) {
            statAffected = qrResult.failureStat.toLowerCase() as "str" | "dex" | "int";
            statDelta = -qrResult.failureStatLoss;
            updatedAdventurer = {
              ...updatedAdventurer,
              [statAffected]: Math.max(0, (updatedAdventurer[statAffected] ?? 0) + statDelta),
            };
          }
          break;
      }
    }

    return {
      adventurer: updatedAdventurer,
      questResult: {
        goldDelta,
        repDelta,
        statAffected,
        statDelta,
        skillLoss,
        success,
        uniqueTreasureFound,
        alternativeItem,
        qrResult,
      },
    };
  }

  /**
   * Parse a stored QR result from quest success/failure text.
   * Used when the original d6 result is not stored separately.
   */
  private _parseStoredQRResult(
    quest: WBQuestRecord,
    successGold: number,
    successRep: number,
    encMod: number,
  ): QRResult {
    const ft = quest.failureText;
    if (ft.includes("skill")) {
      const m = ft.match(/(\d+) skill/);
      return {
        successGold, successRep,
        failureType: "skill",
        failureSkillLoss: m ? parseInt(m[1], 10) : 5,
        failureStat: null, failureStatLoss: 0, failureRep: 0, encMod,
      };
    }
    if (ft.includes("Str") || ft.includes("Dex") || ft.includes("Int")) {
      const statMatch = ft.match(/(Str|Dex|Int)/);
      const lossMatch = ft.match(/(\d+) (Str|Dex|Int)/);
      const statLossVal = lossMatch ? parseInt(lossMatch[1], 10) : 1;
      const stat = (statMatch?.[1] ?? "Str") as "Str" | "Dex" | "Int";
      const repMatch = ft.match(/(\d+) REP/);
      return {
        successGold, successRep,
        failureType: statLossVal > 1 ? "statLarge" : "stat",
        failureSkillLoss: 0,
        failureStat: stat,
        failureStatLoss: statLossVal,
        failureRep: repMatch ? parseInt(repMatch[1], 10) : 0,
        encMod,
      };
    }
    // Default: half gold
    return {
      successGold, successRep,
      failureType: "halfGold",
      failureSkillLoss: 0, failureStat: null, failureStatLoss: 0, failureRep: 0, encMod,
    };
  }

  /**
   * Build a human-readable failure text from a QR result.
   */
  private _buildFailureText(qr: QRResult): string {
    switch (qr.failureType) {
      case "halfGold":
        return `Lose half reward (${Math.floor(qr.successGold / 2)}gp)`;
      case "skill":
        return `Lose ${qr.failureSkillLoss} skill bonus points${qr.failureRep > 0 ? `, -${qr.failureRep} REP` : ""}`;
      case "stat":
      case "statLarge":
        return `Lose ${qr.failureStatLoss} ${qr.failureStat}${qr.failureRep > 0 ? `, -${qr.failureRep} REP` : ""}`;
    }
  }
}
