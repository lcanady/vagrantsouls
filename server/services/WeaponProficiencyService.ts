// WeaponProficiencyService — Book 8: Curious Rules
// Track pip-based proficiency with specific weapons.
// Each pip gives -1 to the adventurer's attack roll (easier to hit) and
// +1 effective modifier against that monster type (harder for them to defend).
// At 5 pips: -5 attack roll, +5 monster modifier.

import type { Adventurer } from "../models/adventurer.ts";

export interface WeaponProficiencyResult {
  weaponName: string;
  newPips: number;
  message: string;
}

export interface WeaponProficiencyModifiers {
  attackMod: number;   // negative value subtracted from d100 attack roll (beneficial)
  monsterMod: number;  // positive value; applied as bonus vs monster DEF
  pips: number;
}

export class WeaponProficiencyService {
  /** Shade one proficiency pip for the given weapon. */
  shadeProficiencyPip(
    adv: Adventurer,
    weaponName: string,
  ): { adventurer: Adventurer; result: WeaponProficiencyResult } {
    const current = adv.weaponProficiency ?? {};
    const currentPips = current[weaponName] ?? 0;
    const newPips = currentPips + 1;

    const adventurer: Adventurer = {
      ...adv,
      weaponProficiency: { ...current, [weaponName]: newPips },
    };

    return {
      adventurer,
      result: {
        weaponName,
        newPips,
        message: `${weaponName} proficiency: ${newPips} pip(s). Modifiers: attack ${-newPips}, monster +${newPips}.`,
      },
    };
  }

  /**
   * Get current combat modifiers for a weapon.
   * Each pip = -1 attack roll modifier, +1 monster modifier.
   */
  getProficiencyModifiers(
    adv: Adventurer,
    weaponName: string,
  ): WeaponProficiencyModifiers {
    const pips = adv.weaponProficiency?.[weaponName] ?? 0;
    return {
      attackMod: -pips,
      monsterMod: pips,
      pips,
    };
  }
}
