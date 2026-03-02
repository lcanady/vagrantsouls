// MonsterVariantService — Book 8: Curious Rules
// 1-in-10 chance a monster is a variant. Roll d10 = 10 to trigger, then
// d10 again to determine variant type (1-10). Variant monsters award
// bonus Honour Points when defeated.

import type { Adventurer } from "../models/adventurer.ts";

export interface MonsterInput {
  name: string;
  av: number;
  def: number;
  dmg: number;
  hp: number;
  abilities?: string[];
  [key: string]: unknown;
}

export type VariantType =
  | "Cursed" | "Undead" | "Demon" | "Lair"
  | "Feasting" | "Treasure" | "Chewed" | "Bitten"
  | "CombatSkills" | "Enhanced";

export interface MonsterVariantResult {
  isVariant: boolean;
  variantType?: VariantType;
  monster: MonsterInput;
  honourPointsAwarded: number;
  message: string;
}

const VARIANT_TYPES: VariantType[] = [
  "Cursed", "Undead", "Demon", "Lair",
  "Feasting", "Treasure", "Chewed", "Bitten",
  "CombatSkills", "Enhanced",
];

/** Honour points awarded per variant type */
const VARIANT_HONOUR: Record<VariantType, number> = {
  Cursed:       2,
  Undead:       2,
  Demon:        3,
  Lair:         1,
  Feasting:     1,
  Treasure:     1,
  Chewed:       1,
  Bitten:       2,
  CombatSkills: 2,
  Enhanced:     3,
};

function applyVariant(monster: MonsterInput, variant: VariantType): MonsterInput {
  const m = { ...monster, abilities: [...(monster.abilities ?? [])] };
  switch (variant) {
    case "Cursed":
      m.abilities.push("Cursed");
      break;
    case "Undead":
      m.abilities.push("Undead", "Immune: Poison");
      break;
    case "Demon":
      m.abilities.push("Daemonic", "Dark Magic");
      break;
    case "Lair":
      // Double loot — noted in abilities; route layer doubles loot table roll count
      m.abilities.push("Lair (double loot)");
      break;
    case "Feasting":
      m.hp += 2;
      m.abilities.push("Feasting (+2 HP)");
      break;
    case "Treasure":
      // x3 gold reward — noted in abilities
      m.abilities.push("Treasure (triple gold)");
      break;
    case "Chewed":
      m.def = Math.max(0, m.def - 2);
      m.abilities.push("Chewed (-2 DEF)");
      break;
    case "Bitten":
      m.abilities.push("Disease");
      break;
    case "CombatSkills":
      m.av += 5;
      m.abilities.push("Combat Skills (+5 AV)");
      break;
    case "Enhanced":
      m.hp += Math.floor(Math.random() * 6) + 1; // 1d6 added to HP
      m.dmg += 1;
      m.abilities.push("Enhanced (+1d6 HP, +1 Dmg)");
      break;
  }
  return m;
}

export class MonsterVariantService {
  /**
   * Check for and apply a monster variant.
   * `triggerRoll` is d10 — equals 10 to trigger.
   * `variantRoll` is d10 (1-10) for variant type selection.
   */
  rollVariant(
    adv: Adventurer,
    monster: MonsterInput,
    triggerRoll: number,
    variantRoll: number,
  ): { adventurer: Adventurer; result: MonsterVariantResult } {
    if (triggerRoll !== 10) {
      return {
        adventurer: adv,
        result: {
          isVariant: false,
          monster,
          honourPointsAwarded: 0,
          message: "Standard monster (no variant).",
        },
      };
    }

    const variantIndex = Math.min(variantRoll - 1, VARIANT_TYPES.length - 1);
    const variantType = VARIANT_TYPES[variantIndex];
    const modifiedMonster = applyVariant(monster, variantType);
    const honour = VARIANT_HONOUR[variantType];

    // Honour points are banked when the variant is defeated (route layer adds to honourPoints)
    return {
      adventurer: adv,
      result: {
        isVariant: true,
        variantType,
        monster: modifiedMonster,
        honourPointsAwarded: honour,
        message: `Variant: ${variantType}! ${monster.name} is now a ${variantType} variant. Awards ${honour} Honour Points on defeat.`,
      },
    };
  }
}
