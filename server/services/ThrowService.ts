// ThrowService — Book 8: Curious Rules
// Thrown weapon attacks use Dex instead of Str.
// After throwing, the weapon leaves the adventurer's equipped slot.
// Retrieval requires a RETRIEVE test (d100 ≤ Dex) after combat.
// Exception: Chakram auto-returns if total damage dealt < 3.

import type { Adventurer } from "../models/adventurer.ts";
import type { Item } from "../models/item.ts";

export interface ThrowResult {
  success: boolean;
  hit: boolean;
  roll: number;
  targetNumber: number;
  damage?: number;
  autoReturned?: boolean;
  requiresRetrieval?: boolean;
  message: string;
}

export interface RetrieveResult {
  success: boolean;
  roll: number;
  targetNumber: number;
  message: string;
}

const CHAKRAM_AUTO_RETURN_THRESHOLD = 3;

export class ThrowService {
  /**
   * Throw a weapon at the current target.
   * Attack uses Dex. Weapon is removed from `weaponSlot` on throw.
   * `attackRoll` is d100; `damageRoll` is the weapon's damage die roll.
   */
  throwWeapon(
    adv: Adventurer,
    weaponSlot: "mainHand" | "offHand",
    attackRoll: number,
    damageRoll: number,
  ): { adventurer: Adventurer; result: ThrowResult } {
    const weapon = adv[weaponSlot] as Item | null | undefined;

    if (!weapon) {
      return {
        adventurer: adv,
        result: {
          success: false,
          hit: false,
          roll: attackRoll,
          targetNumber: adv.dex,
          message: `No weapon in ${weaponSlot} to throw.`,
        },
      };
    }

    const hit = attackRoll <= adv.dex;
    const damage = hit ? Math.max(1, damageRoll + (weapon.bonus ?? 0)) : 0;

    const isChakram = weapon.name.toLowerCase().includes("chakram");
    const autoReturned = isChakram && damage < CHAKRAM_AUTO_RETURN_THRESHOLD;
    const requiresRetrieval = !autoReturned;

    // Remove weapon from slot if it doesn't auto-return
    const slotUpdate = autoReturned ? {} : { [weaponSlot]: null };

    const adventurer: Adventurer = { ...adv, ...slotUpdate };

    let msg: string;
    if (!hit) {
      msg = `Thrown ${weapon.name} misses! (${attackRoll} > Dex ${adv.dex}).`;
      if (!autoReturned) msg += " Must retrieve after combat.";
    } else if (autoReturned) {
      msg = `Thrown ${weapon.name} hits for ${damage} dmg and returns! (chakram, damage < ${CHAKRAM_AUTO_RETURN_THRESHOLD}).`;
    } else {
      msg = `Thrown ${weapon.name} hits for ${damage} dmg. Retrieve after combat with Dex test.`;
    }

    return {
      adventurer,
      result: {
        success: true,
        hit,
        roll: attackRoll,
        targetNumber: adv.dex,
        damage,
        autoReturned,
        requiresRetrieval,
        message: msg,
      },
    };
  }

  /**
   * Attempt to retrieve a thrown weapon after combat.
   * Test: d100 ≤ Dex. On success, weapon is returned to backpack.
   * On failure, weapon is lost permanently.
   */
  retrieveWeapon(
    adv: Adventurer,
    weapon: Item,
    dexRoll: number,
  ): { adventurer: Adventurer; result: RetrieveResult } {
    const success = dexRoll <= adv.dex;

    if (success) {
      const adventurer: Adventurer = {
        ...adv,
        backpack: [...(adv.backpack ?? []), weapon],
      };
      return {
        adventurer,
        result: {
          success: true,
          roll: dexRoll,
          targetNumber: adv.dex,
          message: `${weapon.name} retrieved and returned to backpack (${dexRoll} ≤ Dex ${adv.dex}).`,
        },
      };
    }

    return {
      adventurer: adv,
      result: {
        success: false,
        roll: dexRoll,
        targetNumber: adv.dex,
        message: `Failed to retrieve ${weapon.name}. It is lost (${dexRoll} > Dex ${adv.dex}).`,
      },
    };
  }
}
