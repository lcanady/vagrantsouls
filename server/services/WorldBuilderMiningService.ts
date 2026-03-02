/**
 * WorldBuilderMiningService — Book 8: Curious Rules
 *
 * Mining lets Artisan-trained adventurers extract raw materials from the land.
 * Requires an equipped or backpacked Mining Pick.
 *
 * FIND MINE (1 AP):
 *   GEOLOGY test: d100 ≤ Artisan.art + GEOLOGY_MODIFIERS[terrain] + skills["Geology"]
 *   Success: mine site found (marks state for subsequent mine actions).
 *   Failure: nothing.
 *
 * MINE (1 AP, up to 3 per hex):
 *   MINING test: d100 ≤ Artisan.art + GEOLOGY_MODIFIERS[terrain] + skills["Mining"]
 *   Success: collect 1d3 materials from terrain column (artisanSheet).
 *   Failure roll 5-6 on d6: Mining Pick takes 1 damage pip.
 */

import type { Adventurer, WorldBuilderState } from "../models/adventurer.ts";
import type { TerrainType } from "../data/curious_rules/herbalism_table.ts";
import {
  GEOLOGY_MODIFIERS,
  getMiningMaterial,
  getMaterial,
} from "../data/curious_rules/mining_table.ts";

export interface MiningResult {
  success: boolean;
  message: string;
  mineFound?: boolean;
  materialsCollected?: Array<{ name: string; qty: number; gpValue: number }>;
  pickDamaged?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findPickInAdventurer(adv: Adventurer): {
  location: "backpack" | "mainHand" | "offHand";
  index?: number;
} | null {
  const slots: Array<"mainHand" | "offHand"> = ["mainHand", "offHand"];
  for (const slot of slots) {
    const item = adv[slot];
    if (item && item.name.toLowerCase().includes("mining pick")) return { location: slot };
  }
  const bpIdx = adv.backpack?.findIndex(
    (i) => i.name.toLowerCase().includes("mining pick"),
  ) ?? -1;
  if (bpIdx >= 0) return { location: "backpack", index: bpIdx };
  return null;
}

function damagePickInAdventurer(adv: Adventurer): Adventurer {
  const slots: Array<"mainHand" | "offHand"> = ["mainHand", "offHand"];
  for (const slot of slots) {
    const item = adv[slot];
    if (item?.name.toLowerCase().includes("mining pick")) {
      return { ...adv, [slot]: { ...item, damagePips: Math.min(5, (item.damagePips ?? 0) + 1) } };
    }
  }
  const bpIdx = adv.backpack?.findIndex(
    (i) => i.name.toLowerCase().includes("mining pick"),
  ) ?? -1;
  if (bpIdx >= 0) {
    const newBp = [...adv.backpack];
    newBp[bpIdx] = { ...newBp[bpIdx], damagePips: Math.min(5, (newBp[bpIdx].damagePips ?? 0) + 1) };
    return { ...adv, backpack: newBp };
  }
  return adv;
}

function addMaterials(adv: Adventurer, materials: Array<{ name: string; qty: number }>): Adventurer {
  const sheet = { ...(adv.artisanSheet ?? {}) };
  for (const { name, qty } of materials) {
    sheet[name] = (sheet[name] ?? 0) + qty;
  }
  return { ...adv, artisanSheet: sheet };
}

// ---------------------------------------------------------------------------
// WorldBuilderMiningService
// ---------------------------------------------------------------------------

export class WorldBuilderMiningService {
  /**
   * FIND MINE — GEOLOGY test. Requires Artisan unlocked.
   *
   * @param terrain   Current hex terrain
   * @param testRoll  d100 rolled by caller
   */
  findMine(
    adv: Adventurer,
    _state: WorldBuilderState,
    terrain: TerrainType,
    testRoll: number,
  ): { adventurer: Adventurer; result: MiningResult } {
    if (!adv.artisan) {
      return {
        adventurer: adv,
        result: { success: false, message: "Must be an Artisan to prospect for mines." },
      };
    }

    const gm = GEOLOGY_MODIFIERS[terrain];
    const geologySkill = adv.skills?.["Geology"] ?? 0;
    const threshold = adv.artisan.art + gm + geologySkill;

    const success = testRoll <= threshold;

    return {
      adventurer: adv,
      result: {
        success,
        mineFound: success,
        message: success
          ? `Mine found in ${terrain}! (${testRoll} ≤ ${threshold}). You may now use the MINE action.`
          : `No mine found in ${terrain} (${testRoll} > ${threshold}).`,
      },
    };
  }

  /**
   * MINE — Extract 1d3 materials from the terrain.
   * Requires Mining Pick. On fail d6=5-6: pick takes damage pip.
   *
   * @param terrain       Current hex terrain
   * @param testRoll      d100 MINING test
   * @param d3Roll        1-3 for quantity on success
   * @param materialRolls d10 rolls for each material (indexed 0-9 in mining table)
   * @param failD6Roll    d6 rolled on failure (5-6 = pick damaged)
   */
  mine(
    adv: Adventurer,
    _state: WorldBuilderState,
    terrain: TerrainType,
    testRoll: number,
    d3Roll: number,
    materialRolls: number[],
    failD6Roll = 1,
  ): { adventurer: Adventurer; result: MiningResult } {
    if (!adv.artisan) {
      return {
        adventurer: adv,
        result: { success: false, message: "Must be an Artisan to mine." },
      };
    }

    const pick = findPickInAdventurer(adv);
    if (!pick) {
      return {
        adventurer: adv,
        result: { success: false, message: "Mining Pick required. Buy one at a settlement." },
      };
    }

    const gm = GEOLOGY_MODIFIERS[terrain];
    const miningSkill = adv.skills?.["Mining"] ?? 0;
    const threshold = adv.artisan.art + gm + miningSkill;
    const success = testRoll <= threshold;

    if (!success) {
      const pickDamaged = failD6Roll >= 5;
      const adventurer = pickDamaged ? damagePickInAdventurer(adv) : adv;
      return {
        adventurer,
        result: {
          success: false,
          pickDamaged,
          message: `Mining failed (${testRoll} > ${threshold}).${pickDamaged ? " Mining Pick damaged!" : ""}`,
        },
      };
    }

    // Success: collect 1d3 materials
    const qty = Math.min(Math.max(1, d3Roll), materialRolls.length);
    const matCounts: Record<string, number> = {};

    for (let i = 0; i < qty; i++) {
      const matName = getMiningMaterial(terrain, materialRolls[i] ?? 1);
      if (matName) matCounts[matName] = (matCounts[matName] ?? 0) + 1;
    }

    const materialsCollected = Object.entries(matCounts).map(([name, count]) => {
      const mat = getMaterial(name);
      return { name, qty: count, gpValue: mat?.value ?? 0 };
    });

    const adventurer = addMaterials(adv, Object.entries(matCounts).map(([name, qty]) => ({ name, qty })));

    return {
      adventurer,
      result: {
        success: true,
        materialsCollected,
        message: `Mined ${qty} material(s): ${materialsCollected.map((m) => `${m.qty}× ${m.name}`).join(", ")}.`,
      },
    };
  }
}
