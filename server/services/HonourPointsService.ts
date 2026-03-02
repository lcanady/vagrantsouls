// HonourPointsService — Book 8: Curious Rules
// Honour Points (HP) are earned by defeating variant monsters and completing
// special actions. They can be spent mid-combat or mid-quest to re-roll dice.

import type { Adventurer } from "../models/adventurer.ts";

export type HonourAction =
  | "reroll_attack"      // cost 1 — re-roll your attack roll
  | "reroll_damage"      // cost 1 — re-roll your damage roll
  | "reroll_location"    // cost 1 — re-roll hit location
  | "reroll_test"        // cost 2 — re-roll any skill/stat test
  | "reroll_table";      // cost 3 — re-roll any table result

export interface HonourResult {
  success: boolean;
  action?: HonourAction;
  cost?: number;
  pointsRemaining?: number;
  message: string;
}

const HONOUR_COSTS: Record<HonourAction, number> = {
  reroll_attack:   1,
  reroll_damage:   1,
  reroll_location: 1,
  reroll_test:     2,
  reroll_table:    3,
};

export class HonourPointsService {
  /** Award honour points to an adventurer (called when a variant monster is defeated). */
  award(
    adv: Adventurer,
    points: number,
  ): { adventurer: Adventurer; result: HonourResult } {
    const current = adv.honourPoints ?? 0;
    const adventurer: Adventurer = { ...adv, honourPoints: current + points };
    return {
      adventurer,
      result: {
        success: true,
        pointsRemaining: adventurer.honourPoints ?? 0,
        message: `+${points} Honour Points awarded. Total: ${adventurer.honourPoints}.`,
      },
    };
  }

  /** Spend honour points to perform a re-roll action. */
  spend(
    adv: Adventurer,
    action: HonourAction,
  ): { adventurer: Adventurer; result: HonourResult } {
    const cost = HONOUR_COSTS[action];
    const current = adv.honourPoints ?? 0;

    if (current < cost) {
      return {
        adventurer: adv,
        result: {
          success: false,
          action,
          cost,
          pointsRemaining: current,
          message: `Insufficient Honour Points. "${action}" costs ${cost} (have ${current}).`,
        },
      };
    }

    const adventurer: Adventurer = { ...adv, honourPoints: current - cost };

    return {
      adventurer,
      result: {
        success: true,
        action,
        cost,
        pointsRemaining: adventurer.honourPoints ?? 0,
        message: `Spent ${cost} Honour Point(s) on "${action}". Remaining: ${adventurer.honourPoints}.`,
      },
    };
  }
}
