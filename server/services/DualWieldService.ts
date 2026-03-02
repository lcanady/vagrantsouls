// DualWieldService — Book 8: Curious Rules
// Adventurers may train to fight with two weapons simultaneously.
// Cost: 1000g. When dual wielding, roll damage twice and use the higher result.

import type { Adventurer } from "../models/adventurer.ts";

export interface DualWieldResult {
  success: boolean;
  message: string;
  goldRemaining?: number;
  damage1?: number;
  damage2?: number;
  highestDamage?: number;
}

const TRAINING_COST = 1000;

export class DualWieldService {
  /** Pay 1000g to learn dual wield. */
  trainDualWield(adv: Adventurer): { adventurer: Adventurer; result: DualWieldResult } {
    if (adv.dualWield) {
      return {
        adventurer: adv,
        result: { success: false, message: "Already trained in dual wield." },
      };
    }
    if (adv.gold < TRAINING_COST) {
      return {
        adventurer: adv,
        result: {
          success: false,
          message: `Insufficient gold. Training costs ${TRAINING_COST}g (have ${adv.gold}g).`,
        },
      };
    }

    const adventurer: Adventurer = {
      ...adv,
      gold: adv.gold - TRAINING_COST,
      dualWield: true,
    };

    return {
      adventurer,
      result: {
        success: true,
        message: "Dual wield training complete.",
        goldRemaining: adventurer.gold,
      },
    };
  }

  /**
   * Roll two damage dice (caller provides both rolls).
   * Returns both values and the higher of the two.
   */
  rollDualWieldDamage(
    adv: Adventurer,
    roll1: number,
    roll2: number,
  ): { adventurer: Adventurer; result: DualWieldResult } {
    if (!adv.dualWield) {
      return {
        adventurer: adv,
        result: { success: false, message: "Not trained in dual wield." },
      };
    }

    const highestDamage = Math.max(roll1, roll2);

    return {
      adventurer: adv,
      result: {
        success: true,
        damage1: roll1,
        damage2: roll2,
        highestDamage,
        message: `Dual wield damage: ${roll1} and ${roll2} → use ${highestDamage}.`,
      },
    };
  }
}
