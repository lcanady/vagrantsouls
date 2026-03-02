/**
 * WorldBuilderSkinningService — Book 8: Curious Rules
 *
 * Skinning (Salvaging) lets adventurers harvest materials from creatures
 * slain during a successful HUNTING forage action.
 * Requires a Skinning Blade.
 *
 * SALVAGE (1 AP, once per hunt):
 *   SALVAGING test: d100 ≤ Artisan.art + skills["Skinning"]
 *   Success: collect 1d3 materials (bone splinters / leather scraps).
 *   Failure d6 = 5-6: Skinning Blade takes 1 damage pip.
 *
 * Materials go into adventurer.artisanSheet.
 */

import type { Adventurer, WorldBuilderState } from "../models/adventurer.ts";

export interface SkinningResult {
  success: boolean;
  message: string;
  materialsCollected?: Array<{ name: string; qty: number }>;
  bladeDamaged?: boolean;
}

const SKINNING_MATERIALS = ["Bone Splinters", "Leather Scraps"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findBladeInAdventurer(adv: Adventurer): boolean {
  const slots: Array<"mainHand" | "offHand"> = ["mainHand", "offHand"];
  for (const slot of slots) {
    const item = adv[slot];
    if (item?.name.toLowerCase().includes("skinning blade")) return true;
  }
  return (adv.backpack?.some((i) => i.name.toLowerCase().includes("skinning blade"))) ?? false;
}

function damageBladeInAdventurer(adv: Adventurer): Adventurer {
  const slots: Array<"mainHand" | "offHand"> = ["mainHand", "offHand"];
  for (const slot of slots) {
    const item = adv[slot];
    if (item?.name.toLowerCase().includes("skinning blade")) {
      return { ...adv, [slot]: { ...item, damagePips: Math.min(5, (item.damagePips ?? 0) + 1) } };
    }
  }
  const bpIdx = adv.backpack?.findIndex(
    (i) => i.name.toLowerCase().includes("skinning blade"),
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
// WorldBuilderSkinningService
// ---------------------------------------------------------------------------

export class WorldBuilderSkinningService {
  /**
   * SALVAGE — attempt to skin a slain creature after a successful HUNTING action.
   *
   * @param testRoll    d100 SALVAGING test
   * @param d3Roll      1-3 quantity on success
   * @param matRolls    d2 rolls (1-2) for each material (1=Bone Splinters, 2=Leather Scraps)
   * @param failD6Roll  d6 rolled on failure (5-6 = blade damaged)
   * @param afterHunt   Must be true (gate: only available after successful hunt)
   */
  salvage(
    adv: Adventurer,
    _state: WorldBuilderState,
    testRoll: number,
    d3Roll: number,
    matRolls: number[],
    failD6Roll = 1,
    afterHunt = false,
  ): { adventurer: Adventurer; result: SkinningResult } {
    if (!afterHunt) {
      return {
        adventurer: adv,
        result: { success: false, message: "SALVAGE only available after a successful HUNTING action." },
      };
    }

    if (!findBladeInAdventurer(adv)) {
      return {
        adventurer: adv,
        result: { success: false, message: "Skinning Blade required. Buy one at a settlement." },
      };
    }

    const artStat = adv.artisan?.art ?? adv.str; // fall back to Str if not artisan
    const skinningSkill = adv.skills?.["Skinning"] ?? 0;
    const threshold = artStat + skinningSkill;
    const success = testRoll <= threshold;

    if (!success) {
      const bladeDamaged = failD6Roll >= 5;
      const adventurer = bladeDamaged ? damageBladeInAdventurer(adv) : adv;
      return {
        adventurer,
        result: {
          success: false,
          bladeDamaged,
          message: `Salvaging failed (${testRoll} > ${threshold}).${bladeDamaged ? " Skinning Blade damaged!" : ""}`,
        },
      };
    }

    const qty = Math.min(Math.max(1, d3Roll), matRolls.length);
    const matCounts: Record<string, number> = {};

    for (let i = 0; i < qty; i++) {
      const roll = matRolls[i] ?? 1;
      const name = SKINNING_MATERIALS[Math.min(roll - 1, SKINNING_MATERIALS.length - 1)];
      matCounts[name] = (matCounts[name] ?? 0) + 1;
    }

    const materialsCollected = Object.entries(matCounts).map(([name, qty]) => ({ name, qty }));
    const adventurer = addMaterials(adv, materialsCollected);

    return {
      adventurer,
      result: {
        success: true,
        materialsCollected,
        message: `Salvaged ${qty} material(s): ${materialsCollected.map((m) => `${m.qty}× ${m.name}`).join(", ")}.`,
      },
    };
  }
}
