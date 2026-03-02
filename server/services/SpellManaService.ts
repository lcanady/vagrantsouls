// SpellManaService — Book 8: Curious Rules
// Optional mana system replacing HP costs for spells.
// Primary mana = floor(Int / 10). Adjusted by equipment.
// Spending: deduct from current; if insufficient, overspend from HP (at 2× rate).
// Recovery: +1d3 per clock shade. Blocked if wearing metal armour (mail/plate).
//
// Magic Power mode (opt-in): on CAST SPELL / CAST SCROLL failure,
//   apply -1d3 HP instead of rolling on Table C (curse table).

import type { Adventurer } from "../models/adventurer.ts";

export interface SpellManaResult {
  success: boolean;
  manaSpent?: number;
  hpOverspent?: number;
  manaRecovered?: number;
  newCurrent?: number;
  magicPowerEnabled?: boolean;
  blockedByArmour?: boolean;
  message: string;
}

/** Metal armour names that block mana clock recovery (substring match, case-insensitive) */
const METAL_ARMOUR_PATTERNS = ["mail", "plate", "scale", "ring", "chain", "brigandine"];

function wearsMetalArmour(adv: Adventurer): boolean {
  const torso = adv.torso;
  if (!torso) return false;
  const name = torso.name.toLowerCase();
  return METAL_ARMOUR_PATTERNS.some((p) => name.includes(p));
}

export class SpellManaService {
  /**
   * Enable the mana system for an adventurer.
   * Sets primary mana to floor(Int / 10), total = primary, current = total.
   */
  enableMana(adv: Adventurer): { adventurer: Adventurer; result: SpellManaResult } {
    const primary = Math.floor(adv.int / 10);
    const adventurer: Adventurer = {
      ...adv,
      spellMana: {
        primary,
        adjusted: 0,
        total: primary,
        current: primary,
        magicPower: false,
      },
    };

    return {
      adventurer,
      result: {
        success: true,
        newCurrent: primary,
        message: `Spell Mana enabled. Primary: ${primary} (Int ${adv.int} / 10). Current: ${primary}.`,
      },
    };
  }

  /**
   * Spend mana to cast a spell.
   * If insufficient mana, overspend costs 2 HP per missing mana point.
   */
  spendMana(
    adv: Adventurer,
    cost: number,
  ): { adventurer: Adventurer; result: SpellManaResult } {
    if (!adv.spellMana) {
      return {
        adventurer: adv,
        result: { success: false, message: "Spell Mana is not enabled." },
      };
    }

    const { current } = adv.spellMana;
    const manaAvailable = Math.min(current, cost);
    const manaSpent = manaAvailable;
    const shortage = cost - manaAvailable;
    const hpOverspent = shortage * 2; // 2 HP per missing mana

    if (hpOverspent > adv.hp) {
      return {
        adventurer: adv,
        result: {
          success: false,
          manaSpent: 0,
          hpOverspent: 0,
          newCurrent: current,
          message: `Cannot overspend — not enough HP (need ${hpOverspent} HP, have ${adv.hp}).`,
        },
      };
    }

    const adventurer: Adventurer = {
      ...adv,
      spellMana: { ...adv.spellMana, current: current - manaSpent },
      hp: adv.hp - hpOverspent,
    };

    const msg = shortage > 0
      ? `Spent ${manaSpent} mana + overspent ${shortage} (cost ${hpOverspent} HP). Remaining mana: ${adventurer.spellMana!.current}.`
      : `Spent ${manaSpent} mana. Remaining: ${adventurer.spellMana!.current}.`;

    return {
      adventurer,
      result: { success: true, manaSpent, hpOverspent, newCurrent: adventurer.spellMana!.current, message: msg },
    };
  }

  /**
   * Recover mana on a clock shade (+1d3).
   * Blocked if wearing metal armour.
   * `d3Roll` is 1-3 rolled by the caller.
   */
  recoverMana(
    adv: Adventurer,
    d3Roll: number,
  ): { adventurer: Adventurer; result: SpellManaResult } {
    if (!adv.spellMana) {
      return {
        adventurer: adv,
        result: { success: false, message: "Spell Mana is not enabled." },
      };
    }

    if (wearsMetalArmour(adv)) {
      return {
        adventurer: adv,
        result: {
          success: false,
          blockedByArmour: true,
          message: "Metal armour blocks mana clock recovery.",
        },
      };
    }

    const { current, total } = adv.spellMana;
    const recovered = Math.min(d3Roll, total - current);
    const newCurrent = current + recovered;

    const adventurer: Adventurer = {
      ...adv,
      spellMana: { ...adv.spellMana, current: newCurrent },
    };

    return {
      adventurer,
      result: {
        success: true,
        manaRecovered: recovered,
        newCurrent,
        message: `Recovered ${recovered} mana on clock shade. Current: ${newCurrent}/${total}.`,
      },
    };
  }

  /**
   * Enable or disable Magic Power mode.
   * When enabled, spell failure applies -1d3 HP instead of rolling Table C.
   */
  setMagicPower(
    adv: Adventurer,
    enabled: boolean,
  ): { adventurer: Adventurer; result: SpellManaResult } {
    if (!adv.spellMana) {
      return {
        adventurer: adv,
        result: { success: false, message: "Spell Mana is not enabled." },
      };
    }

    const adventurer: Adventurer = {
      ...adv,
      spellMana: { ...adv.spellMana, magicPower: enabled },
    };

    return {
      adventurer,
      result: {
        success: true,
        magicPowerEnabled: enabled,
        message: `Magic Power mode ${enabled ? "enabled" : "disabled"}. Spell failures now apply -1d3 HP${enabled ? "" : " (reverted to Table C)"}.`,
      },
    };
  }

  /**
   * Apply the Magic Power spell failure penalty (-1d3 HP).
   * Only call this if `adv.spellMana?.magicPower` is true.
   * `d3Roll` is 1-3 rolled by the caller.
   */
  applyMagicPowerFailure(
    adv: Adventurer,
    d3Roll: number,
  ): { adventurer: Adventurer; result: SpellManaResult } {
    if (!adv.spellMana?.magicPower) {
      return {
        adventurer: adv,
        result: { success: false, message: "Magic Power mode is not enabled." },
      };
    }

    const hpLost = d3Roll;
    const adventurer: Adventurer = {
      ...adv,
      hp: Math.max(0, adv.hp - hpLost),
    };

    return {
      adventurer,
      result: {
        success: true,
        hpOverspent: hpLost,
        message: `Spell failed (Magic Power mode) — lost ${hpLost} HP instead of Table C roll.`,
      },
    };
  }
}
