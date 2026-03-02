/**
 * WorldBuilderHerbalismService — Book 8: Curious Rules
 *
 * Herbalism lets adventurers collect herbs in the field and brew items at a
 * settlement with a trained herbalist.
 *
 * HERB COLLECTING (World Builder action, 1 AP per attempt, up to 3 per hex):
 *   Test: d100 ≤ Int + HERBALISM_MODIFIERS[terrain] + skills["Herbalism"]
 *   Success: collect 1d3 + 2 + ç herbs from the terrain column.
 *   Herbs stored in adventurer.herbBags[0] (created on first use).
 *
 * LEARN RECIPE (settlement step):
 *   Requires herb trainer (see BOOK8_SETTLEMENT.herbTrainer).
 *   Marks skill "HB:<recipeName>" = 1 on the adventurer.
 *
 * MAKE ITEM (settlement step):
 *   Test: d100 ≤ Int + skills["Herbalism"]
 *   Consumes required herb ingredients from herbBags.
 *   On success: item added to backpack.
 *   On failure: half ingredients wasted (rounded up).
 */

import type { Adventurer, WorldBuilderState } from "../models/adventurer.ts";
import type { SettlementType } from "../data/world_builder/settlements_table.ts";
import { BOOK8_SETTLEMENT, NOT_AVAILABLE } from "../data/world_builder/settlements_table.ts";
import {
  TerrainType,
  HERBALISM_MODIFIERS,
  HERBALISM_TABLE,
  HERBALISM_RECIPES,
  getRecipe,
} from "../data/curious_rules/herbalism_table.ts";
import { WorldBuilderCalendarService } from "./WorldBuilderCalendarService.ts";

const calendarService = new WorldBuilderCalendarService();

export interface HerbalismResult {
  success: boolean;
  message: string;
  apSpent?: number;
  herbsCollected?: Array<{ name: string; qty: number }>;
  recipeKnown?: boolean;
  itemCrafted?: string;
  ingredientsConsumed?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureHerbBag(adv: Adventurer): Adventurer {
  if (!adv.herbBags || adv.herbBags.length === 0) {
    return { ...adv, herbBags: [{ label: "Herb Bag 1", herbs: {} }] };
  }
  return adv;
}

function addHerbs(adv: Adventurer, collected: Array<{ name: string; qty: number }>): Adventurer {
  const a = ensureHerbBag(adv);
  const bag = { ...a.herbBags![0], herbs: { ...a.herbBags![0].herbs } };
  for (const { name, qty } of collected) {
    bag.herbs[name] = (bag.herbs[name] ?? 0) + qty;
  }
  const bags = [...a.herbBags!];
  bags[0] = bag;
  return { ...a, herbBags: bags };
}

/** Convert a string[] ingredient list to a name→count record */
function ingredientCounts(ingredients: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const name of ingredients) counts[name] = (counts[name] ?? 0) + 1;
  return counts;
}

function consumeIngredients(adv: Adventurer, ingredients: string[], fraction = 1): Adventurer {
  if (!adv.herbBags || adv.herbBags.length === 0) return adv;
  const counts = ingredientCounts(ingredients);
  const bag = { ...adv.herbBags[0], herbs: { ...adv.herbBags[0].herbs } };
  for (const [name, qty] of Object.entries(counts)) {
    const consume = Math.ceil(qty * fraction);
    bag.herbs[name] = Math.max(0, (bag.herbs[name] ?? 0) - consume);
  }
  const bags = [...adv.herbBags];
  bags[0] = bag;
  return { ...adv, herbBags: bags };
}

function hasIngredients(adv: Adventurer, ingredients: string[]): boolean {
  const herbs = adv.herbBags?.[0]?.herbs ?? {};
  const counts = ingredientCounts(ingredients);
  return Object.entries(counts).every(([name, qty]) => (herbs[name] ?? 0) >= qty);
}

// ---------------------------------------------------------------------------
// WorldBuilderHerbalismService
// ---------------------------------------------------------------------------

export class WorldBuilderHerbalismService {
  /**
   * COLLECT HERBS (1 AP action, handled by WorldBuilderActionService).
   * Called directly when resolving the herb-collecting test.
   *
   * @param terrain   Current hex terrain type
   * @param testRoll  d100 rolled by caller
   * @param d3Roll    1-3 for quantity (1d3 + 2 + seasonBonus)
   * @param seasonBonus  From WorldBuilderCalendarService.getSeasonBonus
   * @param herbIndexRolls  Array of d10 rolls (one per herb collected) for which herb on the terrain table
   */
  collectHerbs(
    adv: Adventurer,
    _state: WorldBuilderState,
    terrain: TerrainType,
    testRoll: number,
    d3Roll: number,
    seasonBonus: number,
    herbIndexRolls: number[],
  ): { adventurer: Adventurer; result: HerbalismResult } {
    const modifier = HERBALISM_MODIFIERS[terrain];
    const herbalism = adv.skills?.["Herbalism"] ?? 0;
    const threshold = adv.int + modifier + herbalism;

    if (testRoll > threshold) {
      return {
        adventurer: adv,
        result: {
          success: false,
          message: `Herb collecting failed (${testRoll} > ${threshold}). Nothing found.`,
        },
      };
    }

    const qty = Math.min(d3Roll + 2 + seasonBonus, herbIndexRolls.length);
    const terrainHerbs = HERBALISM_TABLE[terrain]; // array indexed 0-9
    const collected: Array<{ name: string; qty: number }> = [];
    const herbCounts: Record<string, number> = {};

    for (let i = 0; i < qty; i++) {
      const idx = Math.max(0, Math.min(9, (herbIndexRolls[i] ?? 1) - 1));
      const herbName = terrainHerbs[idx];
      herbCounts[herbName] = (herbCounts[herbName] ?? 0) + 1;
    }
    for (const [name, count] of Object.entries(herbCounts)) {
      collected.push({ name, qty: count });
    }

    const adventurer = addHerbs(adv, collected);

    return {
      adventurer,
      result: {
        success: true,
        herbsCollected: collected,
        message: `Collected ${qty} herb(s) from ${terrain}: ${collected.map((h) => `${h.qty}× ${h.name}`).join(", ")}.`,
      },
    };
  }

  /**
   * LEARN RECIPE at a settlement herb trainer.
   * Marks skills["HB:<recipeName>"] = 1 and deducts training cost.
   */
  learnRecipe(
    adv: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    recipeName: string,
    unlockRoll: number,
  ): { adventurer: Adventurer; result: HerbalismResult } {
    const costs = BOOK8_SETTLEMENT.herbTrainer[settlementType];
    if (costs === NOT_AVAILABLE || costs.unlockChance === -1) {
      return {
        adventurer: adv,
        result: { success: false, message: `No herb trainer available in ${settlementType}.` },
      };
    }

    if (costs.unlockChance > 0 && unlockRoll > costs.unlockChance) {
      return {
        adventurer: adv,
        result: { success: false, message: `No herb trainer found (rolled ${unlockRoll} > ${costs.unlockChance}%).` },
      };
    }

    const recipe = getRecipe(recipeName);
    if (!recipe) {
      return {
        adventurer: adv,
        result: { success: false, message: `Unknown recipe: "${recipeName}".` },
      };
    }

    const skillKey = `HB:${recipeName}`;
    if ((adv.skills?.[skillKey] ?? 0) > 0) {
      return {
        adventurer: adv,
        result: { success: false, recipeKnown: true, message: `Recipe "${recipeName}" already known.` },
      };
    }

    if (adv.gold < costs.cost) {
      return {
        adventurer: adv,
        result: { success: false, message: `Insufficient gold. Training costs ${costs.cost}g (have ${adv.gold}g).` },
      };
    }

    const adventurer: Adventurer = {
      ...adv,
      gold: adv.gold - costs.cost,
      skills: { ...(adv.skills ?? {}), [skillKey]: 1 },
    };

    return {
      adventurer,
      result: {
        success: true,
        recipeKnown: true,
        message: `Recipe "${recipeName}" learned for ${costs.cost}g.`,
      },
    };
  }

  /**
   * MAKE ITEM from a known herbalism recipe.
   * Test: d100 ≤ Int + skills["Herbalism"].
   * On success: item added to backpack, all ingredients consumed.
   * On failure: half ingredients (ceil) wasted.
   */
  makeItem(
    adv: Adventurer,
    _state: WorldBuilderState,
    recipeName: string,
    testRoll: number,
  ): { adventurer: Adventurer; result: HerbalismResult } {
    const recipe = getRecipe(recipeName);
    if (!recipe) {
      return {
        adventurer: adv,
        result: { success: false, message: `Unknown recipe: "${recipeName}".` },
      };
    }

    const skillKey = `HB:${recipeName}`;
    if (!adv.skills?.[skillKey]) {
      return {
        adventurer: adv,
        result: { success: false, message: `Recipe "${recipeName}" not learned yet.` },
      };
    }

    if (!hasIngredients(adv, recipe.ingredients)) {
      return {
        adventurer: adv,
        result: { success: false, message: `Insufficient herbs to brew "${recipeName}".` },
      };
    }

    const herbalism = adv.skills?.["Herbalism"] ?? 0;
    const threshold = adv.int + herbalism;
    const success = testRoll <= threshold;

    if (success) {
      // Full ingredients consumed, item added to backpack
      const advAfterIngredients = consumeIngredients(adv, recipe.ingredients, 1);
      const itemEntry = {
        name: recipe.name,
        value: recipe.value,
        usable: true,
        effect: recipe.effect,
        fix: 0,
        bonus: 0,
        damagePips: 0,
        twoHanded: false,
      };
      const adventurer: Adventurer = {
        ...advAfterIngredients,
        backpack: [...(advAfterIngredients.backpack ?? []), itemEntry],
      };
      return {
        adventurer,
        result: {
          success: true,
          itemCrafted: recipe.name,
          ingredientsConsumed: recipe.ingredients,
          message: `Brewed "${recipe.name}" successfully (${testRoll} ≤ ${threshold}).`,
        },
      };
    } else {
      // Half ingredients wasted
      const adventurer = consumeIngredients(adv, recipe.ingredients, 0.5);
      return {
        adventurer,
        result: {
          success: false,
          message: `Brewing failed (${testRoll} > ${threshold}). Half ingredients wasted.`,
        },
      };
    }
  }

  /** Seasonal bonus helper (proxied from CalendarService) */
  getSeasonBonus(month: number): number {
    return calendarService.getSeasonBonus(month);
  }
}
