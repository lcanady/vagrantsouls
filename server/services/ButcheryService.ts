// ButcheryService — Book 8: Curious Rules
// After slaying a monster, the adventurer may butcher it for additional loot.
// BR (Butchery Roll) starts at 1 and increases every 10 pips.

import type { Adventurer } from "../models/adventurer.ts";

export interface ButcheryLootOption {
  roll: number;
  tableId: string;
}

export interface ButcheryResult {
  brIncremented: boolean;
  newPips: number;
  newBr: number;
  lootOptions?: ButcheryLootOption[];
  message: string;
}

export class ButcheryService {
  /** Shade one pip on the butchery experience track. Every 10 pips, BR increments by 1. */
  shadePip(adv: Adventurer): { adventurer: Adventurer; result: ButcheryResult } {
    const current = adv.butchery ?? { br: 1, pips: 0 };
    let newPips = current.pips + 1;
    let newBr = current.br;
    let brIncremented = false;

    if (newPips >= 10) {
      newPips = 0;
      newBr += 1;
      brIncremented = true;
    }

    const adventurer: Adventurer = { ...adv, butchery: { br: newBr, pips: newPips } };

    return {
      adventurer,
      result: {
        brIncremented,
        newPips,
        newBr,
        message: brIncremented
          ? `Butchery Roll increased to ${newBr}! Pips reset.`
          : `Pip shaded (${newPips}/10). BR = ${newBr}.`,
      },
    };
  }

  /**
   * Roll butchery loot BR times on the given loot table.
   * Caller provides `rolls` — an array of pre-rolled d100 values.
   * The service consumes the first BR rolls and returns one option per roll.
   */
  rollLoot(
    adv: Adventurer,
    tableId: string,
    rolls: number[],
  ): { adventurer: Adventurer; result: ButcheryResult } {
    const br = adv.butchery?.br ?? 1;
    const usedRolls = rolls.slice(0, br);

    const lootOptions: ButcheryLootOption[] = usedRolls.map((r) => ({
      roll: r,
      tableId,
    }));

    return {
      adventurer: adv,
      result: {
        brIncremented: false,
        newPips: adv.butchery?.pips ?? 0,
        newBr: br,
        lootOptions,
        message: `Rolled ${usedRolls.length} loot option(s) on table ${tableId}. Choose one.`,
      },
    };
  }
}
