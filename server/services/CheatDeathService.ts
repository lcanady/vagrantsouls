// CheatDeathService — Book 8: Curious Rules
// Adventurers may visit a shrine before a quest to activate Cheat Death.
// If they die (HP = 0) they survive once but suffer permanent stat penalties.
// Cost: 1500g. Only one CD marker can be active at a time.

import type { Adventurer } from "../models/adventurer.ts";

export type SettlementType = "camp" | "village" | "town" | "city";

export interface CheatDeathResult {
  success: boolean;
  message: string;
  shrineFound?: boolean;
  goldRemaining?: number;
  strLost?: number;
  dexLost?: number;
  intLost?: number;
  hpLost?: number;
}

const ACTIVATION_COST = 1500;

/** Chance of finding a shrine by settlement type (d100 ≤ threshold) */
const SHRINE_CHANCE: Record<SettlementType, number> = {
  camp:    0,
  village: 20,
  town:    40,
  city:    70,
};

export class CheatDeathService {
  /**
   * Attempt to activate Cheat Death at a settlement shrine.
   * `shrineRoll` is a d100 rolled by the caller.
   */
  activate(
    adv: Adventurer,
    settlementType: SettlementType,
    shrineRoll: number,
  ): { adventurer: Adventurer; result: CheatDeathResult } {
    if (adv.cheatDeath === "active") {
      return {
        adventurer: adv,
        result: { success: false, message: "Cheat Death is already active." },
      };
    }
    if (adv.gold < ACTIVATION_COST) {
      return {
        adventurer: adv,
        result: {
          success: false,
          message: `Insufficient gold. Cheat Death costs ${ACTIVATION_COST}g (have ${adv.gold}g).`,
        },
      };
    }

    const threshold = SHRINE_CHANCE[settlementType];
    const shrineFound = shrineRoll <= threshold;

    if (!shrineFound) {
      return {
        adventurer: adv,
        result: {
          success: false,
          shrineFound: false,
          message: `No shrine found in this ${settlementType} (rolled ${shrineRoll}, needed ≤ ${threshold}).`,
        },
      };
    }

    const adventurer: Adventurer = {
      ...adv,
      gold: adv.gold - ACTIVATION_COST,
      cheatDeath: "active",
    };

    return {
      adventurer,
      result: {
        success: true,
        shrineFound: true,
        goldRemaining: adventurer.gold,
        message: `Shrine found! Cheat Death activated for ${ACTIVATION_COST}g.`,
      },
    };
  }

  /**
   * Trigger Cheat Death after the adventurer would die.
   * Caller provides three d6 rolls (STR/DEX/INT loss) and one d3 roll (HP loss).
   * Restores HP to 1 and applies permanent penalties.
   */
  useCheatDeath(
    adv: Adventurer,
    strRoll: number,   // 1d6 STR loss
    dexRoll: number,   // 1d6 DEX loss
    intRoll: number,   // 1d6 INT loss
    hpRoll: number,    // 1d3 max HP loss
  ): { adventurer: Adventurer; result: CheatDeathResult } {
    if (adv.cheatDeath !== "active") {
      return {
        adventurer: adv,
        result: { success: false, message: "Cheat Death is not active." },
      };
    }

    const adventurer: Adventurer = {
      ...adv,
      hp: 1,
      str: Math.max(1, adv.str - strRoll),
      dex: Math.max(1, adv.dex - dexRoll),
      int: Math.max(1, adv.int - intRoll),
      maxHp: Math.max(1, adv.maxHp - hpRoll),
      cheatDeath: null,
    };

    return {
      adventurer,
      result: {
        success: true,
        strLost: strRoll,
        dexLost: dexRoll,
        intLost: intRoll,
        hpLost: hpRoll,
        message: `Cheat Death triggered! Restored to 1 HP. Lost ${strRoll} Str, ${dexRoll} Dex, ${intRoll} Int, ${hpRoll} max HP permanently.`,
      },
    };
  }
}
