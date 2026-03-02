// AmmunitionService — Book 8: Curious Rules
// Manages ammunition holders (pouch, quiver, bandolier) and their combat bonuses.
//
// Holders and ammo types:
//   Pouch     → Smooth Stones (no bonus), Lead Shot (+1 Dmg)
//   Quiver    → Bodkin Arrows (-3 DEF vs monster), Broadhead Arrows (+2 Dmg)
//   Bandolier → Crossbow Bolts (no bonus), Heavy Quarrels (+3 Dmg)

import type { Adventurer } from "../models/adventurer.ts";

export type AmmoHolder = "pouch" | "quiver" | "bandolier";

export type AmmoType =
  | "smoothStones"
  | "leadShot"
  | "bodkinArrows"
  | "broadheadArrows"
  | "crossbowBolts"
  | "heavyQuarrels";

export interface AmmoCombatBonus {
  dmgBonus: number;
  defPenaltyToMonster: number;
  description: string;
}

export interface AmmunitionResult {
  success: boolean;
  message: string;
  combatBonus?: AmmoCombatBonus;
  remaining?: number;
}

/** Combat bonuses per ammo type */
export const AMMO_BONUSES: Record<AmmoType, AmmoCombatBonus> = {
  smoothStones:    { dmgBonus: 0, defPenaltyToMonster: 0, description: "Smooth Stone — no bonus." },
  leadShot:        { dmgBonus: 1, defPenaltyToMonster: 0, description: "Lead Shot — +1 Dmg." },
  bodkinArrows:    { dmgBonus: 0, defPenaltyToMonster: 3, description: "Bodkin Arrow — -3 DEF to monster (armour piercing)." },
  broadheadArrows: { dmgBonus: 2, defPenaltyToMonster: 0, description: "Broadhead Arrow — +2 Dmg." },
  crossbowBolts:   { dmgBonus: 0, defPenaltyToMonster: 0, description: "Crossbow Bolt — no bonus." },
  heavyQuarrels:   { dmgBonus: 3, defPenaltyToMonster: 0, description: "Heavy Quarrel — +3 Dmg." },
};

/** Map ammo type to its holder */
const AMMO_TO_HOLDER: Record<AmmoType, AmmoHolder> = {
  smoothStones:    "pouch",
  leadShot:        "pouch",
  bodkinArrows:    "quiver",
  broadheadArrows: "quiver",
  crossbowBolts:   "bandolier",
  heavyQuarrels:   "bandolier",
};

export class AmmunitionService {
  /** Equip an ammo holder (creates it with zero stock). */
  equipHolder(
    adv: Adventurer,
    holder: AmmoHolder,
  ): { adventurer: Adventurer; result: AmmunitionResult } {
    const current = adv.ammunition ?? {};

    if (holder === "pouch" && current.pouch) {
      return { adventurer: adv, result: { success: false, message: "Pouch already equipped." } };
    }
    if (holder === "quiver" && current.quiver) {
      return { adventurer: adv, result: { success: false, message: "Quiver already equipped." } };
    }
    if (holder === "bandolier" && current.bandolier) {
      return { adventurer: adv, result: { success: false, message: "Bandolier already equipped." } };
    }

    const patch =
      holder === "pouch"
        ? { pouch: { smoothStones: 0, leadShot: 0 } }
        : holder === "quiver"
        ? { quiver: { bodkinArrows: 0, broadheadArrows: 0 } }
        : { bandolier: { crossbowBolts: 0, heavyQuarrels: 0 } };

    const adventurer: Adventurer = {
      ...adv,
      ammunition: { ...current, ...patch },
    };

    return {
      adventurer,
      result: { success: true, message: `${holder} equipped.` },
    };
  }

  /** Load ammo into its holder. */
  loadAmmo(
    adv: Adventurer,
    ammoType: AmmoType,
    quantity: number,
  ): { adventurer: Adventurer; result: AmmunitionResult } {
    const holder = AMMO_TO_HOLDER[ammoType];
    const ammo = adv.ammunition ?? {};

    if (!ammo[holder]) {
      return {
        adventurer: adv,
        result: { success: false, message: `No ${holder} equipped. Equip it first.` },
      };
    }

    const updatedHolder = { ...(ammo[holder] as Record<string, number>), [ammoType]: (ammo[holder] as Record<string, number>)[ammoType] + quantity };

    const adventurer: Adventurer = {
      ...adv,
      ammunition: { ...ammo, [holder]: updatedHolder },
    };

    return {
      adventurer,
      result: {
        success: true,
        remaining: updatedHolder[ammoType],
        message: `Loaded ${quantity}× ${ammoType}. Total: ${updatedHolder[ammoType]}.`,
      },
    };
  }

  /**
   * Use one ammo of the given type (decrements count).
   * Returns the combat bonus for this ammo.
   */
  useAmmo(
    adv: Adventurer,
    ammoType: AmmoType,
  ): { adventurer: Adventurer; result: AmmunitionResult } {
    const holder = AMMO_TO_HOLDER[ammoType];
    const ammo = adv.ammunition ?? {};

    if (!ammo[holder]) {
      return {
        adventurer: adv,
        result: { success: false, message: `No ${holder} equipped.` },
      };
    }

    const current = (ammo[holder] as Record<string, number>)[ammoType] ?? 0;
    if (current <= 0) {
      return {
        adventurer: adv,
        result: { success: false, message: `No ${ammoType} remaining.` },
      };
    }

    const updatedHolder = { ...(ammo[holder] as Record<string, number>), [ammoType]: current - 1 };

    const adventurer: Adventurer = {
      ...adv,
      ammunition: { ...ammo, [holder]: updatedHolder },
    };

    return {
      adventurer,
      result: {
        success: true,
        combatBonus: AMMO_BONUSES[ammoType],
        remaining: updatedHolder[ammoType],
        message: `Used 1× ${ammoType}. Remaining: ${updatedHolder[ammoType]}. ${AMMO_BONUSES[ammoType].description}`,
      },
    };
  }
}
