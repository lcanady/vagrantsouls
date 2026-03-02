// PursuitService — Book 8: Curious Rules
// When a monster flees, the adventurer may pursue it.
// Test: d100 ≤ Int - 10 (+ Aware and Hunting skill bonuses).
// Success: monster is caught and combat resumes.
// Failure: monster escapes permanently.

import type { Adventurer } from "../models/adventurer.ts";

export interface PursuitMonster {
  name: string;
  av: number;
  def: number;
  dmg: number;
  hp: string | number;
  [key: string]: unknown;
}

export interface PursuitResult {
  success: boolean;
  targetNumber: number;
  roll: number;
  monster?: PursuitMonster;
  message: string;
}

export class PursuitService {
  /**
   * Attempt to pursue a fleeing monster.
   * `roll` is a d100 rolled by the caller.
   */
  pursue(
    adv: Adventurer,
    monster: PursuitMonster,
    roll: number,
  ): { adventurer: Adventurer; result: PursuitResult } {
    const awareBonus = adv.skills?.["Aware"] ?? 0;
    const huntingBonus = adv.skills?.["Hunting"] ?? 0;
    const targetNumber = adv.int - 10 + awareBonus + huntingBonus;

    const success = roll <= targetNumber;

    return {
      adventurer: adv,
      result: {
        success,
        targetNumber,
        roll,
        monster: success ? monster : undefined,
        message: success
          ? `Pursuit successful (rolled ${roll} ≤ ${targetNumber})! Monster cornered — combat resumes.`
          : `Pursuit failed (rolled ${roll} > ${targetNumber}). Monster escapes.`,
      },
    };
  }
}
