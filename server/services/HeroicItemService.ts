// HeroicItemService — Book 8: Curious Rules
// Heroic Items are powerful legendaries generated from two LA table rolls.
// Drop check: each [K] result roll d6; on 6, shade pip. When 2d10 ≤ pips, item found.
// Generation: roll item type + two different LA adjustments (must differ).

import type { Adventurer } from "../models/adventurer.ts";
import {
  LEGENDS_A_TABLE,
  type LegendAEntry,
} from "../data/curious_rules/legends_a_table.ts";

export type HeroicItemType = "weapon" | "armour" | "shield" | "accessory";

export interface HeroicItem {
  type: HeroicItemType;
  name: string;
  la1: LegendAEntry;
  la2: LegendAEntry;
  totalValueBonus: number;
  totalFixBonus: number;
}

export interface HeroicDropResult {
  pipShaded: boolean;
  newPips: number;
  itemFound: boolean;
  message: string;
}

export interface HeroicGenerateResult {
  success: boolean;
  item?: HeroicItem;
  message: string;
}

/** d4 → item type */
const ITEM_TYPES: HeroicItemType[] = ["weapon", "armour", "shield", "accessory"];

function lookupLA(roll: number): LegendAEntry {
  const clamped = Math.max(1, Math.min(100, roll));
  return (
    LEGENDS_A_TABLE.find((e) => e.roll === clamped) ??
    LEGENDS_A_TABLE[LEGENDS_A_TABLE.length - 1]
  );
}

/** Determine if two LA entries have the same primary adjustment type. */
function sameAdjustmentType(a: LegendAEntry, b: LegendAEntry): boolean {
  const keyOf = (e: LegendAEntry) => Object.keys(e.adjustments)[0] ?? "none";
  return keyOf(a) === keyOf(b);
}

export class HeroicItemService {
  /**
   * Check for a heroic item drop after a [K] result.
   * `d6Roll`: 1-6 — shade pip only if equals 6.
   * `d10Roll1`, `d10Roll2`: 2d10 to test against current pips.
   */
  checkHeroicDrop(
    adv: Adventurer,
    d6Roll: number,
    d10Roll1: number,
    d10Roll2: number,
  ): { adventurer: Adventurer; result: HeroicDropResult } {
    let tracker = adv.heroicItemTracker ?? { pips: 0 };
    let pipShaded = false;

    if (d6Roll === 6) {
      tracker = { pips: tracker.pips + 1 };
      pipShaded = true;
    }

    const twoD10 = d10Roll1 + d10Roll2;
    const itemFound = twoD10 <= tracker.pips;

    // Reset tracker if item found
    const finalTracker = itemFound ? { pips: 0 } : tracker;
    const adventurer: Adventurer = { ...adv, heroicItemTracker: finalTracker };

    return {
      adventurer,
      result: {
        pipShaded,
        newPips: finalTracker.pips,
        itemFound,
        message: itemFound
          ? `Heroic item found! (2d10 = ${twoD10} ≤ ${tracker.pips} pips). Tracker reset.`
          : pipShaded
          ? `Pip shaded (${tracker.pips}). 2d10 = ${twoD10} — no heroic item yet.`
          : `No pip shaded. 2d10 = ${twoD10} — no heroic item.`,
      },
    };
  }

  /**
   * Generate a heroic item.
   * `typeRoll`: d4 (1-4) → item type.
   * `la1Roll`, `la2Roll`: d100 each → LA table entries.
   * The two adjustments must differ; if they match, generation fails and caller re-rolls.
   */
  generateHeroicItem(
    adv: Adventurer,
    typeRoll: number,
    la1Roll: number,
    la2Roll: number,
  ): { adventurer: Adventurer; result: HeroicGenerateResult } {
    const type = ITEM_TYPES[Math.min(typeRoll - 1, ITEM_TYPES.length - 1)];
    const la1 = lookupLA(la1Roll);
    const la2 = lookupLA(la2Roll);

    if (sameAdjustmentType(la1, la2)) {
      return {
        adventurer: adv,
        result: {
          success: false,
          message: `Both LA rolls produced the same adjustment type (${la1.adjustment}). Re-roll one.`,
        },
      };
    }

    const item: HeroicItem = {
      type,
      name: `Heroic ${type.charAt(0).toUpperCase() + type.slice(1)}: ${la1.name} & ${la2.name}`,
      la1,
      la2,
      totalValueBonus: la1.valueBonus + la2.valueBonus,
      totalFixBonus: la1.fixBonus + la2.fixBonus,
    };

    return {
      adventurer: adv,
      result: {
        success: true,
        item,
        message: `Heroic ${type} generated: ${la1.adjustment} and ${la2.adjustment}.`,
      },
    };
  }
}
