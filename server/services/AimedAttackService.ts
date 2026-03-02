// AimedAttackService — Book 8: Curious Rules
// Aimed attacks target a specific body location, applying a penalty to the
// attack roll but granting a bonus effect on hit.
//
// Location table (penalty to d100 attack / effect on hit):
//   Head   — -15 AV, +3 Dmg on hit
//   Torso  — -5 AV,  no special (centre-mass, easiest)
//   Arms   — -10 AV, weapon knocked from hand on max damage roll
//   Groin  — -10 AV, monster -2 reaction (reduced DEF next round)
//   Feet   — -10 AV, -1 Dmg, monster reaction -2

import type { Adventurer } from "../models/adventurer.ts";

export type AimLocation = "head" | "torso" | "arms" | "groin" | "feet";

export interface LocationModifier {
  attackPenalty: number;   // subtracted from effective AV (positive = harder to hit)
  dmgBonus: number;        // added to damage on hit
  dmgPenalty: number;      // subtracted from damage on hit
  monsterDefPenalty: number; // monster DEF reduced for this attack
  reactionPenalty: number; // monster reaction reduced for this round
  description: string;
}

export const AIMED_LOCATIONS: Record<AimLocation, LocationModifier> = {
  head:  { attackPenalty: 15, dmgBonus: 3,  dmgPenalty: 0, monsterDefPenalty: 0, reactionPenalty: 0, description: "Head shot — +3 Dmg on hit." },
  torso: { attackPenalty: 5,  dmgBonus: 0,  dmgPenalty: 0, monsterDefPenalty: 0, reactionPenalty: 0, description: "Torso — no special effect." },
  arms:  { attackPenalty: 10, dmgBonus: 0,  dmgPenalty: 0, monsterDefPenalty: 0, reactionPenalty: 0, description: "Arms — disarm chance on max damage." },
  groin: { attackPenalty: 10, dmgBonus: 0,  dmgPenalty: 0, monsterDefPenalty: 2, reactionPenalty: 2, description: "Groin — monster -2 reaction this round." },
  feet:  { attackPenalty: 10, dmgBonus: 0,  dmgPenalty: 1, monsterDefPenalty: 0, reactionPenalty: 2, description: "Feet — -1 Dmg, monster -2 reaction." },
};

export interface AimResult {
  location: AimLocation;
  modifier: LocationModifier;
  effectiveStat: number;
  roll: number;
  hit: boolean;
  damage?: number;
  effectApplied?: string;
  message: string;
}

export class AimedAttackService {
  /**
   * Resolve an aimed attack.
   * `baseStat` is the adventurer's effective attack stat (Str or Dex).
   * `attackRoll` is d100; `damageRoll` is the weapon's damage die result.
   * `weaponBonus` is the item's +bonus field.
   * `monsterDef` is the monster's current DEF value.
   */
  aim(
    adv: Adventurer,
    location: AimLocation,
    baseStat: number,
    attackRoll: number,
    damageRoll: number,
    weaponBonus = 0,
    monsterDef = 0,
  ): { adventurer: Adventurer; result: AimResult } {
    const mod = AIMED_LOCATIONS[location];
    const effectiveStat = baseStat - mod.attackPenalty;
    const effectiveDef = Math.max(0, monsterDef - mod.monsterDefPenalty);
    const hit = attackRoll <= effectiveStat;

    if (!hit) {
      return {
        adventurer: adv,
        result: {
          location,
          modifier: mod,
          effectiveStat,
          roll: attackRoll,
          hit: false,
          message: `Aimed attack at ${location} missed (${attackRoll} > ${effectiveStat}).`,
        },
      };
    }

    const rawDmg = damageRoll + weaponBonus + mod.dmgBonus - mod.dmgPenalty - effectiveDef;
    const damage = Math.max(1, rawDmg);

    let effectApplied: string | undefined;
    if (location === "groin" || location === "feet") {
      effectApplied = `Monster reaction reduced by ${mod.reactionPenalty} this round.`;
    }

    return {
      adventurer: adv,
      result: {
        location,
        modifier: mod,
        effectiveStat,
        roll: attackRoll,
        hit: true,
        damage,
        effectApplied,
        message: `Aimed attack at ${location} hits for ${damage} dmg! ${mod.description}${effectApplied ? " " + effectApplied : ""}`,
      },
    };
  }
}
