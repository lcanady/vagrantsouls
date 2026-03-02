// EquipmentModService — Book 8: Curious Rules
// Reinforced Belts: waist armour is reinforced by an armourer (■ city only).
//   Adds an RV (Resilience Value). In combat, roll d10 ≤ RV to ignore a belt-slot
//   damage pip check. Updates item value and fix cost.
//
// Spiked Shields: any shield can be spiked.
//   On a successful deflect (monster misses), deal bonus Dmg back.
//   Kite Shield spiked → +2 Dmg on deflect.

import type { Adventurer } from "../models/adventurer.ts";
import type { Item } from "../models/item.ts";

export interface EquipmentModResult {
  success: boolean;
  item?: Item;
  message: string;
}

export interface BeltCheckResult {
  ignored: boolean;
  roll: number;
  rv: number;
  message: string;
}

export interface SpikedDeflectResult {
  damageDealt: number;
  message: string;
}

/** GP cost to reinforce a belt (armourer service, city only) */
const REINFORCE_COST = 150;
/** RV added by reinforcement */
const REINFORCE_RV = 3;
/** GP added to item value */
const REINFORCE_VALUE_BONUS = 50;
/** GP added to item fix cost */
const REINFORCE_FIX_BONUS = 20;

/** Spike bonus by shield type (name substring match, case-insensitive) */
const SPIKE_DMG: Array<{ pattern: string; dmg: number }> = [
  { pattern: "kite",   dmg: 2 },
  { pattern: "tower",  dmg: 2 },
  { pattern: "heater", dmg: 1 },
  { pattern: "round",  dmg: 1 },
  { pattern: "buckler",dmg: 1 },
];
const DEFAULT_SPIKE_DMG = 1;

function findItemInAdventurer(adv: Adventurer, itemId: string): { item: Item; location: string } | null {
  const slots: Array<"head" | "torso" | "back" | "mainHand" | "offHand" | "belt1" | "belt2"> =
    ["head", "torso", "back", "mainHand", "offHand", "belt1", "belt2"];

  for (const slot of slots) {
    const item = adv[slot] as Item | null | undefined;
    if (item?.id === itemId) return { item, location: slot };
  }

  const bpIdx = adv.backpack?.findIndex((i) => i.id === itemId) ?? -1;
  if (bpIdx >= 0) return { item: adv.backpack[bpIdx], location: `backpack:${bpIdx}` };

  return null;
}

function updateItemInAdventurer(adv: Adventurer, itemId: string, updated: Item): Adventurer {
  const slots: Array<"head" | "torso" | "back" | "mainHand" | "offHand" | "belt1" | "belt2"> =
    ["head", "torso", "back", "mainHand", "offHand", "belt1", "belt2"];

  for (const slot of slots) {
    const item = adv[slot] as Item | null | undefined;
    if (item?.id === itemId) return { ...adv, [slot]: updated };
  }

  const bpIdx = adv.backpack?.findIndex((i) => i.id === itemId) ?? -1;
  if (bpIdx >= 0) {
    const newBp = [...adv.backpack];
    newBp[bpIdx] = updated;
    return { ...adv, backpack: newBp };
  }

  return adv;
}

export class EquipmentModService {
  /**
   * Reinforce a belt/waist armour item. Requires a city armourer (caller validates settlement).
   * Sets `rv`, increases `value` and `fix`.
   */
  reinforceBelt(
    adv: Adventurer,
    itemId: string,
  ): { adventurer: Adventurer; result: EquipmentModResult } {
    if (adv.gold < REINFORCE_COST) {
      return {
        adventurer: adv,
        result: { success: false, message: `Insufficient gold. Reinforcing costs ${REINFORCE_COST}g (have ${adv.gold}g).` },
      };
    }

    const found = findItemInAdventurer(adv, itemId);
    if (!found) {
      return {
        adventurer: adv,
        result: { success: false, message: `Item ${itemId} not found.` },
      };
    }

    if (found.item.rv != null) {
      return {
        adventurer: adv,
        result: { success: false, message: `${found.item.name} is already reinforced (RV ${found.item.rv}).` },
      };
    }

    const updated: Item = {
      ...found.item,
      rv: REINFORCE_RV,
      value: found.item.value + REINFORCE_VALUE_BONUS,
      fix: found.item.fix + REINFORCE_FIX_BONUS,
    };

    const adventurer: Adventurer = {
      ...updateItemInAdventurer(adv, itemId, updated),
      gold: adv.gold - REINFORCE_COST,
    };

    return {
      adventurer,
      result: {
        success: true,
        item: updated,
        message: `${found.item.name} reinforced. RV = ${REINFORCE_RV}. Cost ${REINFORCE_COST}g.`,
      },
    };
  }

  /**
   * Check if a reinforced belt ignores a damage pip in combat.
   * Roll d10 ≤ RV → pip ignored.
   */
  checkBeltRV(
    adv: Adventurer,
    itemId: string,
    d10Roll: number,
  ): BeltCheckResult {
    const found = findItemInAdventurer(adv, itemId);
    const rv = found?.item.rv ?? 0;
    const ignored = d10Roll <= rv;

    return {
      ignored,
      roll: d10Roll,
      rv,
      message: ignored
        ? `Reinforced belt absorbs damage (${d10Roll} ≤ RV ${rv}).`
        : `Belt does not absorb (${d10Roll} > RV ${rv}).`,
    };
  }

  /**
   * Spike a shield. Sets `spiked = true`, increases `value`, `fix`, and `bonus` (dmg on deflect).
   */
  spikeShield(
    adv: Adventurer,
    itemId: string,
  ): { adventurer: Adventurer; result: EquipmentModResult } {
    const SPIKE_COST = 100;

    if (adv.gold < SPIKE_COST) {
      return {
        adventurer: adv,
        result: { success: false, message: `Insufficient gold. Spiking costs ${SPIKE_COST}g (have ${adv.gold}g).` },
      };
    }

    const found = findItemInAdventurer(adv, itemId);
    if (!found) {
      return {
        adventurer: adv,
        result: { success: false, message: `Item ${itemId} not found.` },
      };
    }

    if (found.item.spiked) {
      return {
        adventurer: adv,
        result: { success: false, message: `${found.item.name} is already spiked.` },
      };
    }

    const dmg = SPIKE_DMG.find((s) =>
      found.item.name.toLowerCase().includes(s.pattern),
    )?.dmg ?? DEFAULT_SPIKE_DMG;

    const updated: Item = {
      ...found.item,
      spiked: true,
      bonus: (found.item.bonus ?? 0) + dmg,
      value: found.item.value + 80,
      fix: found.item.fix + 15,
    };

    const adventurer: Adventurer = {
      ...updateItemInAdventurer(adv, itemId, updated),
      gold: adv.gold - SPIKE_COST,
    };

    return {
      adventurer,
      result: {
        success: true,
        item: updated,
        message: `${found.item.name} spiked! +${dmg} Dmg on deflect. Cost ${SPIKE_COST}g.`,
      },
    };
  }

  /**
   * Apply spiked shield deflect damage when a monster misses.
   * Returns the damage dealt back to the attacker.
   */
  applyDeflectDamage(shield: Item): SpikedDeflectResult {
    if (!shield.spiked) {
      return { damageDealt: 0, message: `${shield.name} is not spiked — no deflect damage.` };
    }
    const dmg = shield.bonus ?? 0;
    return {
      damageDealt: dmg,
      message: `Spiked ${shield.name} deflects — deals ${dmg} dmg back!`,
    };
  }
}
