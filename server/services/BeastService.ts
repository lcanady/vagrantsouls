/**
 * BeastService
 *
 * Handles:
 * - buyBeast       (market purchase, table Y)
 * - tameBeast      (TAME test during combat)
 * - trainBeast     (TRAIN test during Before Your Next Quest phase)
 * - sellBeast      (step 4 of Before Your Next Quest)
 * - useBeastAbility
 * - deflectDamage  (beast absorbs up to its level in HP)
 * - dragonResurrect (Dragon Hatchling sacrifice a heart)
 */

import { Adventurer, Beast } from "../models/adventurer.ts";
import {
  getBeastByRoll,
  getBeastByName,
  BEAST_ABILITIES,
  DRAGON_LEVEL_ABILITIES,
} from "../data/beast_table.ts";

export interface BuyBeastInput  { roll: number }
export interface TameBeastInput { monsterName: string; roll: number }
export interface TrainBeastInput { roll: number }
export interface UseBeastAbilityInput { ability: string; usesThisQuest: number }
export interface DeflectDamageInput { incomingDamage: number }

export interface BeastServiceResult {
  success: boolean;
  message: string;
  leveledUp?: boolean;
  goldGained?: number;
  effect?: string;
  extraDamageDice?: number;
}

/** Build a Beast from a table-Y entry at level 1 */
function buildBeast(entry: ReturnType<typeof getBeastByRoll>): Beast | null {
  if (!entry) return null;
  return {
    name: entry.name,
    level: 1,
    bonus: entry.bonus,
    gpValue: entry.gpPerLevel,
    abilities: [...entry.abilities],
    hp: entry.hp,
    currentHp: entry.hp,
    trainingPips: 0,
    isCooperative: true,
    isDragonHatchling: entry.name === "Dragon Hatchling",
    dragonHearts: entry.name === "Dragon Hatchling" ? 2 : 0,
  };
}

export class BeastService {
  /**
   * TAME test: Int +/- Beast Bonus
   * Success: monster is tamed and becomes beast.
   * Failure: monster attacks with +1 extra damage die.
   */
  tameBeast(
    adventurer: Adventurer,
    input: TameBeastInput,
  ): { adventurer: Adventurer; result: BeastServiceResult } {
    const entry = getBeastByName(input.monsterName);
    if (!entry) {
      return {
        adventurer,
        result: {
          success: false,
          message: `Cannot tame '${input.monsterName}' — it is not found on table Y.`,
        },
      };
    }

    const targetNumber = adventurer.int + entry.bonus;
    const success = input.roll <= targetNumber;

    if (!success) {
      return {
        adventurer,
        result: {
          success: false,
          message: `Tame test failed (rolled ${input.roll}, needed ≤ ${targetNumber}).`,
          extraDamageDice: 1,
        },
      };
    }

    const beast = buildBeast(entry)!;
    const updated: Adventurer = { ...adventurer, beast };
    return {
      adventurer: updated,
      result: { success: true, message: `${input.monsterName} has been tamed!` },
    };
  }

  /**
   * Buy a beast from the market.  Cost = gpPerLevel * 1 (level 1).
   * Replaces any existing beast.
   */
  buyBeast(
    adventurer: Adventurer,
    input: BuyBeastInput,
  ): { adventurer: Adventurer; beast: Beast | null; result: BeastServiceResult } {
    const entry = getBeastByRoll(input.roll);
    if (!entry) {
      return {
        adventurer,
        beast: null,
        result: { success: false, message: `Invalid roll ${input.roll} for table Y.` },
      };
    }

    const cost = entry.gpPerLevel; // level 1 value
    if (adventurer.gold < cost) {
      return {
        adventurer,
        beast: null,
        result: {
          success: false,
          message: `Not enough gold. Need ${cost}gp, have ${adventurer.gold}gp.`,
        },
      };
    }

    const beast = buildBeast(entry)!;
    const updated: Adventurer = {
      ...adventurer,
      gold: adventurer.gold - cost,
      beast,
    };
    return {
      adventurer: updated,
      beast,
      result: { success: true, message: `Purchased ${entry.name} for ${cost}gp.` },
    };
  }

  /**
   * TRAIN test: Int +/- Beast Bonus
   * Success: shade 1 pip on training track.
   * 10 pips → beast levels up.
   * Failure: beast is uncooperative next quest.
   */
  trainBeast(
    adventurer: Adventurer,
    input: TrainBeastInput,
  ): { adventurer: Adventurer; result: BeastServiceResult } {
    if (!adventurer.beast) {
      return {
        adventurer,
        result: { success: false, message: "No beast to train." },
      };
    }

    const beast = { ...adventurer.beast };
    const targetNumber = adventurer.int + beast.bonus;
    const success = input.roll <= targetNumber;

    if (!success) {
      beast.isCooperative = false;
      return {
        adventurer: { ...adventurer, beast },
        result: {
          success: false,
          message: `Training failed (rolled ${input.roll}, needed ≤ ${targetNumber}). Beast is uncooperative next quest.`,
        },
      };
    }

    beast.trainingPips += 1;
    let leveledUp = false;

    if (beast.trainingPips >= 10) {
      beast.level += 1;
      beast.trainingPips = 0;
      beast.hp += 1;          // +1 HP per level
      beast.currentHp += 1;   // current HP also increases
      beast.bonus += 1;       // +1 Beast Bonus per level
      leveledUp = true;

      // Dragon Hatchling gains abilities by level
      if (beast.isDragonHatchling) {
        const newAbility = DRAGON_LEVEL_ABILITIES[beast.level];
        if (newAbility && !beast.abilities.includes(newAbility)) {
          beast.abilities = [...beast.abilities, newAbility];
        }
      }
    }

    return {
      adventurer: { ...adventurer, beast },
      result: {
        success: true,
        leveledUp,
        message: leveledUp
          ? `Beast leveled up to level ${beast.level}!`
          : `Training successful — ${beast.trainingPips}/10 pips.`,
      },
    };
  }

  /**
   * Sell beast.  May only be done during step 4 (SELL ITEMS) of Before Your Next Quest.
   * Sell value = gpPerLevel * level.
   */
  sellBeast(
    adventurer: Adventurer,
  ): { adventurer: Adventurer; result: BeastServiceResult } {
    if (!adventurer.beast) {
      return {
        adventurer,
        result: { success: false, message: "No beast to sell." },
      };
    }

    const goldGained = adventurer.beast.gpValue * adventurer.beast.level;
    const updated: Adventurer = {
      ...adventurer,
      gold: adventurer.gold + goldGained,
      beast: null,
    };
    return {
      adventurer: updated,
      result: { success: true, message: `Sold beast for ${goldGained}gp.`, goldGained },
    };
  }

  /**
   * Use a beast ability during a quest.
   * Beast abilities can be used at most `level` times per quest.
   * Beast must be cooperative and possess the ability.
   */
  useBeastAbility(
    adventurer: Adventurer,
    input: UseBeastAbilityInput,
  ): { adventurer: Adventurer; result: BeastServiceResult } {
    const beast = adventurer.beast;
    if (!beast) {
      return { adventurer, result: { success: false, message: "No beast." } };
    }
    if (!beast.isCooperative) {
      return {
        adventurer,
        result: {
          success: false,
          message: "Beast is uncooperative and cannot use abilities this quest.",
        },
      };
    }
    if (!beast.abilities.includes(input.ability)) {
      return {
        adventurer,
        result: {
          success: false,
          message: `Beast does not have the ${input.ability} ability.`,
        },
      };
    }
    if (input.usesThisQuest >= beast.level) {
      return {
        adventurer,
        result: {
          success: false,
          message: `Ability uses exhausted (${input.usesThisQuest}/${beast.level} used this quest).`,
        },
      };
    }

    const effect = BEAST_ABILITIES[input.ability] ?? `${input.ability} ability activated.`;
    return {
      adventurer,
      result: { success: true, message: effect, effect },
    };
  }

  /**
   * When adventurer takes combat damage, up to beast.level HP may be deflected.
   * Cannot deflect if beast is uncooperative.
   * Beast never suffers poison or disease.
   */
  deflectDamage(
    adventurer: Adventurer,
    input: DeflectDamageInput,
  ): { adventurer: Adventurer; beastDamage: number; adventurerDamage: number } {
    if (!adventurer.beast || !adventurer.beast.isCooperative) {
      return {
        adventurer: { ...adventurer, hp: adventurer.hp - input.incomingDamage },
        beastDamage: 0,
        adventurerDamage: input.incomingDamage,
      };
    }

    const beast = { ...adventurer.beast };
    const maxDeflect = beast.level;
    const beastDamage = Math.min(maxDeflect, input.incomingDamage);
    const adventurerDamage = input.incomingDamage - beastDamage;

    beast.currentHp = Math.max(0, beast.currentHp - beastDamage);

    const updated: Adventurer = {
      ...adventurer,
      hp: Math.max(0, adventurer.hp - adventurerDamage),
      beast,
    };
    return { adventurer: updated, beastDamage, adventurerDamage };
  }

  /**
   * Dragon Hatchling Resurrection ability:
   * Spend one heart to revive a dead adventurer.
   * After last heart → dragon dies.
   */
  dragonResurrect(
    adventurer: Adventurer,
  ): { adventurer: Adventurer; result: BeastServiceResult } {
    const beast = adventurer.beast;
    if (!beast || !beast.isDragonHatchling) {
      return {
        adventurer,
        result: { success: false, message: "No Dragon Hatchling to use Resurrection." },
      };
    }
    if (beast.dragonHearts <= 0) {
      return {
        adventurer,
        result: { success: false, message: "The Dragon Hatchling has no hearts left." },
      };
    }

    const updatedBeast = { ...beast, dragonHearts: beast.dragonHearts - 1 };
    const dragonDied = updatedBeast.dragonHearts === 0;

    const updated: Adventurer = {
      ...adventurer,
      hp: Math.max(1, adventurer.maxHp), // revived with max HP (as per life point rule)
      beast: dragonDied ? null : updatedBeast,
    };

    return {
      adventurer: updated,
      result: {
        success: true,
        message: dragonDied
          ? "The Dragon Hatchling sacrificed its last heart and has died."
          : "The Dragon Hatchling sacrificed a heart to revive you.",
      },
    };
  }
}
