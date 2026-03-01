/**
 * CombatExperienceService
 *
 * Tracks kills per monster type and unlocks special abilities at 10 and 20 pips.
 */

import { Adventurer } from "../models/adventurer.ts";
import {
  CombatXpAbility,
  getUnlockedAbilities,
  getCombatXpEntry,
} from "../data/combat_experience_table.ts";

export interface RecordKillInput {
  monsterName: string;
  packDefeated?: boolean; // for pack monsters, only awards pip when whole pack is defeated
}

export interface KillResult {
  adventurer: Adventurer;
  pipAwarded: boolean;
  currentPips: number;
  newlyUnlocked: CombatXpAbility[];
}

export interface CombatStatus {
  pips: number;
  unlockedAbilities: CombatXpAbility[];
  reactionModifier: number;
}

export class CombatExperienceService {
  /**
   * Record a monster kill and shade a pip on the combat experience track.
   * Pack monsters only award a pip when packDefeated = true.
   */
  recordKill(
    adventurer: Adventurer,
    input: RecordKillInput,
  ): KillResult {
    const { monsterName, packDefeated = true } = input;

    // Pack monsters need the whole pack defeated
    const isPack = monsterName.toLowerCase().includes("pack") ||
      monsterName.toLowerCase().includes("gang") ||
      monsterName.toLowerCase().includes("horde");

    if (isPack && !packDefeated) {
      return {
        adventurer,
        pipAwarded: false,
        currentPips: adventurer.combatExperience?.[monsterName] ?? 0,
        newlyUnlocked: [],
      };
    }

    const current = adventurer.combatExperience?.[monsterName] ?? 0;
    if (current >= 20) {
      // Already at max
      return { adventurer, pipAwarded: false, currentPips: 20, newlyUnlocked: [] };
    }

    const newPips = current + 1;
    const prevAbilities = getUnlockedAbilities(monsterName, current);
    const nextAbilities = getUnlockedAbilities(monsterName, newPips);
    const newlyUnlocked = nextAbilities.filter(a => !prevAbilities.some(p => p.name === a.name));

    const updated: Adventurer = {
      ...adventurer,
      combatExperience: {
        ...(adventurer.combatExperience ?? {}),
        [monsterName]: newPips,
      },
    };

    return { adventurer: updated, pipAwarded: true, currentPips: newPips, newlyUnlocked };
  }

  /** Return special abilities unlocked at the given pip count for a monster */
  getUnlockedAbilities(monsterName: string, pips: number): CombatXpAbility[] {
    return getUnlockedAbilities(monsterName, pips);
  }

  /** Full combat status for a monster type */
  getCombatStatus(adventurer: Adventurer, monsterName: string): CombatStatus {
    const pips = adventurer.combatExperience?.[monsterName] ?? 0;
    const unlockedAbilities = getUnlockedAbilities(monsterName, pips);
    const entry = getCombatXpEntry(monsterName);
    return {
      pips,
      unlockedAbilities,
      reactionModifier: entry?.reactionModifier ?? 0,
    };
  }

  /** List all monsters with at least one pip */
  getAllMonsterStats(adventurer: Adventurer): Record<string, CombatStatus> {
    const result: Record<string, CombatStatus> = {};
    for (const [name, pips] of Object.entries(adventurer.combatExperience ?? {})) {
      if (pips > 0) {
        result[name] = this.getCombatStatus(adventurer, name);
      }
    }
    return result;
  }
}
