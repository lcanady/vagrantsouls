// IdentifyService — Book 8: Curious Rules
// Unidentified alchemical items (brews/potions/elixirs/legendaries) can be
// identified by a wizard at a city. Roll d100 within the item's group (IB table).
// Cursed items require a separate witch to remove the curse.

import type { Adventurer } from "../models/adventurer.ts";
import {
  identify,
  getCursedItem,
  type IdentifyItemType,
  type IdentifyEntry,
  type CursedItemEntry,
} from "../data/curious_rules/identify_table.ts";

export interface IdentifyResult {
  success: boolean;
  entry?: IdentifyEntry;
  cursedEntry?: CursedItemEntry;
  isCursed: boolean;
  message: string;
}

export interface RemoveCurseResult {
  success: boolean;
  goldRemaining?: number;
  message: string;
}

/** Wizard fee by settlement type */
const IDENTIFY_COST: Record<string, number> = {
  camp:    0,
  village: 0,
  town:    50,
  city:    50,
};

const REMOVE_CURSE_COST = 200;

export class IdentifyService {
  /**
   * Identify an unidentified item.
   * `itemType` comes from the item record (set when item is looted as "unidentified").
   * `roll` is d100; `cursedRoll` is d100 for the CURSED_ITEMS sub-table (if needed).
   */
  identifyItem(
    adv: Adventurer,
    itemType: IdentifyItemType,
    roll: number,
    cursedRoll = 1,
  ): { adventurer: Adventurer; result: IdentifyResult } {
    const entry = identify(itemType, roll);

    if (!entry) {
      return {
        adventurer: adv,
        result: {
          success: false,
          isCursed: false,
          message: `No identification result for ${itemType} at roll ${roll}.`,
        },
      };
    }

    if (entry.cursed) {
      const offset = entry.cursedOffset ?? 0;
      const cursedEntry = getCursedItem(cursedRoll + offset);

      // Record the active curse in witcheryMishaps (reusing the mishap array as curse storage)
      const adventurer: Adventurer = {
        ...adv,
        witcheryMishaps: [
          ...(adv.witcheryMishaps ?? []),
          `${cursedEntry?.suffix ?? "Unknown Curse"}: ${cursedEntry?.effect ?? ""}`,
        ],
      };

      return {
        adventurer,
        result: {
          success: true,
          entry,
          cursedEntry: cursedEntry ?? undefined,
          isCursed: true,
          message: `Item identified as ${entry.name} — it is CURSED! (${cursedEntry?.suffix ?? "unknown"}). Visit a witch to remove.`,
        },
      };
    }

    return {
      adventurer: adv,
      result: {
        success: true,
        entry,
        isCursed: false,
        message: `Item identified: ${entry.name}. Value: ${entry.value}g. Effect: ${entry.effect}`,
      },
    };
  }

  /**
   * Remove a curse from an item. Requires 200g and a witch (available in towns/cities).
   * `curseIndex` is the index into `witcheryMishaps` of the curse to remove.
   */
  removeItemCurse(
    adv: Adventurer,
    curseIndex: number,
  ): { adventurer: Adventurer; result: RemoveCurseResult } {
    if (adv.gold < REMOVE_CURSE_COST) {
      return {
        adventurer: adv,
        result: {
          success: false,
          message: `Insufficient gold. Curse removal costs ${REMOVE_CURSE_COST}g (have ${adv.gold}g).`,
        },
      };
    }

    const mishaps = [...(adv.witcheryMishaps ?? [])];
    if (curseIndex < 0 || curseIndex >= mishaps.length) {
      return {
        adventurer: adv,
        result: { success: false, message: `No curse at index ${curseIndex}.` },
      };
    }

    mishaps.splice(curseIndex, 1);

    const adventurer: Adventurer = {
      ...adv,
      gold: adv.gold - REMOVE_CURSE_COST,
      witcheryMishaps: mishaps,
    };

    return {
      adventurer,
      result: {
        success: true,
        goldRemaining: adventurer.gold,
        message: `Curse removed for ${REMOVE_CURSE_COST}g.`,
      },
    };
  }
}
