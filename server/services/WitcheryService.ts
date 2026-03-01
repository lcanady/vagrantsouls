/**
 * WitcheryService
 *
 * Adventurers may attempt to brew Witches Potions or Anointments
 * during the "Before Your Next Quest" phase (Step 10. Witchery).
 *
 * Steps:
 * 1. Select 3 different parts from the backpack.
 * 2. Make a WITCHERY test: Int + formula bonus (if known).
 * 3. Success → create potion/anointment, learn formula.
 *    Failure → parts destroyed, roll for mishap.
 */

import { Adventurer } from "../models/adventurer.ts";
import { lookupWitchery, RARITY_BONUS } from "../data/witchery_table.ts";

export interface WitcheryAttempt {
  parts: [string, string, string];  // exactly 3 part names
  roll: number;                      // 1-100 die roll provided by client
  tableRoll: number;                 // 1-100 roll for table O result
}

export interface WitcheryResult {
  success: boolean;
  effectType?: "P" | "A";
  effectName?: string;
  effect?: string;
  mishap?: string;
  formulaKey?: string;
  formulaBonus?: number;
  message: string;
}

function formulaKey(parts: [string, string, string]): string {
  return [...parts].sort().join("|");
}

function calcFormulaBonus(adventurer: Adventurer, parts: [string, string, string]): number {
  return parts.reduce((sum, partName) => {
    const part = adventurer.monsterParts.find(p => p.name === partName);
    return sum + (part ? (RARITY_BONUS[part.rarity] ?? 5) : 5);
  }, 0);
}

export class WitcheryService {
  attempt(adventurer: Adventurer, attempt: WitcheryAttempt): { adventurer: Adventurer; result: WitcheryResult } {
    const { parts, roll, tableRoll } = attempt;

    // Validate parts exist and are distinct
    const partNames = new Set(parts);
    if (partNames.size !== 3) {
      return {
        adventurer,
        result: { success: false, message: "All 3 parts must be different from each other." },
      };
    }

    for (const partName of parts) {
      if (!adventurer.monsterParts.find(p => p.name === partName)) {
        return {
          adventurer,
          result: { success: false, message: `Part '${partName}' not found in adventurer's parts.` },
        };
      }
    }

    const key = formulaKey(parts);
    const knownFormula = adventurer.witcheryFormulas[key];
    const formulaBonus = knownFormula ? knownFormula.bonus : 0;
    const threshold = adventurer.int + formulaBonus;

    // Remove parts from adventurer (consumed regardless of outcome)
    let remaining = [...adventurer.monsterParts];
    for (const partName of parts) {
      const idx = remaining.findIndex(p => p.name === partName);
      if (idx !== -1) remaining.splice(idx, 1);
    }

    const entry = lookupWitchery(tableRoll);
    const newAdv = { ...adventurer, monsterParts: remaining };

    if (roll <= threshold) {
      // Success
      const partBonus = calcFormulaBonus(adventurer, parts);
      const effectName = entry.effect.split(":")[0].trim();

      // Learn formula if not known
      const formulas = { ...newAdv.witcheryFormulas };
      if (!knownFormula) {
        formulas[key] = {
          parts: [...parts],
          bonus: partBonus,
          effect: entry.effect,
          mishap: entry.mishap,
        };
      }

      // Add effect to active effects
      const effects = [...(newAdv.witcheryEffects || []), entry.effect];

      return {
        adventurer: { ...newAdv, witcheryFormulas: formulas, witcheryEffects: effects },
        result: {
          success: true,
          effectType: entry.effectType,
          effectName,
          effect: entry.effect,
          formulaKey: key,
          formulaBonus: partBonus,
          message: `Witchery succeeded! Created: Witches ${entry.effectType === "P" ? "Potion" : "Anointment"} of ${effectName}. Formula learned.`,
        },
      };
    } else {
      // Failure — mishap
      const mishaps = [...(newAdv.witcheryMishaps || []), entry.mishap];
      return {
        adventurer: { ...newAdv, witcheryMishaps: mishaps },
        result: {
          success: false,
          mishap: entry.mishap,
          message: `Witchery failed! Parts destroyed. Mishap: ${entry.mishap}`,
        },
      };
    }
  }

  /** Calculate sell value of a brewed potion: sum of part values + formula bonus × 2 */
  sellValue(adventurer: Adventurer, parts: [string, string, string]): number {
    const key = formulaKey(parts);
    const formula = adventurer.witcheryFormulas[key];
    if (!formula) return 0;
    const partValueSum = parts.reduce((sum, name) => {
      const part = adventurer.monsterParts.find(p => p.name === name);
      return sum + (part?.value ?? 0);
    }, 0);
    return (partValueSum + formula.bonus) * 2;
  }

  /** Clear all witchery effects and mishaps at the end of a quest */
  clearQuestEffects(adventurer: Adventurer): Adventurer {
    return { ...adventurer, witcheryEffects: [], witcheryMishaps: [] };
  }
}
