// EpicDungeonService — Book 8: Curious Rules
// Epic Dungeons are harder versions of quests where ALL monsters receive stat boosts.
// Modifiers: +10 AV, +1 DEF, +1 DMG, +10 HP.
// Completing an epic dungeon shades the quest slot and awards epic item drops on [K].

import type { Adventurer } from "../models/adventurer.ts";

export interface EpicMonsterModifiers {
  avBonus: number;
  defBonus: number;
  dmgBonus: number;
  hpBonus: number;
}

export interface EpicDungeonResult {
  success: boolean;
  questId: string;
  monsterModifiers?: EpicMonsterModifiers;
  message: string;
}

export const EPIC_MONSTER_MODIFIERS: EpicMonsterModifiers = {
  avBonus:  10,
  defBonus:  1,
  dmgBonus:  1,
  hpBonus:  10,
};

export class EpicDungeonService {
  /**
   * Begin an epic dungeon run for the given quest slot.
   * Records the quest as active-epic in `campaignQuests` and returns
   * the monster modifiers to apply for the duration of the quest.
   */
  beginEpicDungeon(
    adv: Adventurer,
    questId: string,
  ): { adventurer: Adventurer; result: EpicDungeonResult } {
    const epicKey = `epic:${questId}`;
    if ((adv.campaignQuests ?? {})[epicKey] === "pending") {
      return {
        adventurer: adv,
        result: {
          success: false,
          questId,
          message: `Epic dungeon "${questId}" is already in progress.`,
        },
      };
    }

    const adventurer: Adventurer = {
      ...adv,
      campaignQuests: {
        ...(adv.campaignQuests ?? {}),
        [epicKey]: "pending",
      },
    };

    return {
      adventurer,
      result: {
        success: true,
        questId,
        monsterModifiers: EPIC_MONSTER_MODIFIERS,
        message: `Epic Dungeon "${questId}" begun! All monsters: +10 AV, +1 DEF, +1 DMG, +10 HP.`,
      },
    };
  }

  /**
   * Complete (shade) an epic dungeon.
   * Updates the quest status to "complete".
   */
  completeEpicDungeon(
    adv: Adventurer,
    questId: string,
  ): { adventurer: Adventurer; result: EpicDungeonResult } {
    const epicKey = `epic:${questId}`;

    const adventurer: Adventurer = {
      ...adv,
      campaignQuests: {
        ...(adv.campaignQuests ?? {}),
        [epicKey]: "complete",
      },
    };

    return {
      adventurer,
      result: {
        success: true,
        questId,
        message: `Epic Dungeon "${questId}" completed and shaded!`,
      },
    };
  }

  /** Returns the epic monster modifiers constant (for use by route/combat layer). */
  getMonsterModifiers(): EpicMonsterModifiers {
    return EPIC_MONSTER_MODIFIERS;
  }
}
