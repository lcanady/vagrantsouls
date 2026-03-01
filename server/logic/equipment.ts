import { Adventurer } from "../models/adventurer.ts";
import { Item, EquipmentSlot } from "../models/item.ts";

export interface Stats {
  str: number;
  dex: number;
  int: number;
}

export class EquipmentManager {
  /**
   * Calculates the current stats of an adventurer based on base stats and equipped items.
   * Base Stats: Str 50, Dex 40, Int 30.
   */
  static calculateStats(adventurer: Adventurer): Stats {
    const stats: Stats = {
      str: adventurer.str, // Default 50 from schema
      dex: adventurer.dex, // Default 40
      int: adventurer.int, // Default 30
    };

    const equippedItems: (Item | null | undefined)[] = [
      adventurer.head,
      adventurer.torso,
      adventurer.back,
      adventurer.mainHand,
      adventurer.offHand,
      adventurer.belt1,
      adventurer.belt2,
    ];

    for (const item of equippedItems) {
      if (item && item.modifiers) {
        if (item.modifiers.str) stats.str += item.modifiers.str;
        if (item.modifiers.dex) stats.dex += item.modifiers.dex;
        if (item.modifiers.int) stats.int += item.modifiers.int;
      }
    }

    return stats;
  }

  /**
   * Checks if an item can be equipped in the specified slot.
   * Validates slot compatibility and Two-Handed constraints.
   */
  static canEquip(adventurer: Adventurer, item: Item, slot: EquipmentSlot): boolean {
    // 1. Check if item slot matches target slot
    // Some items might be "Hand" and go in either MainHand or OffHand?
    // Start with strict matching logic or flexible?
    // Schema has "MainHand", "OffHand". Item usually has just "Hand" or specific?
    // Let's assume Item.slot must match exactly OR be compatible.
    // However, EquipmentSlot enum in Item model has "MainHand", "OffHand".
    // If an item is "MainHand", it can go to "MainHand".
    // If we want generic "Hand", we might need to adjust Item schema or logic.
    // For now, let's assume strict equality for non-hand slots, and special logic for hands if needed.
    // ACTUALLY, strict matching usage for now based on Schema.

    if (item.slot && item.slot !== slot) {
       // Allow "MainHand" item to go into "MainHand" slot.
       // What if item is a generic weapon? The schema says slot is optional. 
       // If slot is undefined, assume it fits nowhere? Or anywhere? 
       // Let's assume item.slot MUST be defined for equipment.
       return false;
    }

    // 2. Two-Handed Logic
    if (slot === "MainHand" && item.twoHanded) {
      // Cannot equip 2H if OffHand is occupied
      if (adventurer.offHand) {
        return false;
      }
    }

    if (slot === "OffHand") {
        // Cannot equip anything in OffHand if MainHand has 2H weapon
        if (adventurer.mainHand && adventurer.mainHand.twoHanded) {
            return false;
        }
    }

    if (slot === "Belt") {
        if (adventurer.belt1 && adventurer.belt2) {
            return false;
        }
    }

    return true;
  }

  /**
   * Equips an item into a slot. 
   * Returns a NEW Adventurer object with the item equipped.
   * Throws error if validation fails? Or returns same adventurer?
   * Let's throw for clarity in logic usage.
   */
  static equip(adventurer: Adventurer, item: Item, slot: EquipmentSlot): Adventurer {
    if (!this.canEquip(adventurer, item, slot)) {
      throw new Error(`Cannot equip ${item.name} into ${slot}`);
    }

    const newAdventurer = structuredClone(adventurer);

    switch (slot) {
      case "Head":
        newAdventurer.head = item;
        break;
      case "Torso":
        newAdventurer.torso = item;
        break;
      case "Back":
        newAdventurer.back = item;
        break;
      case "MainHand":
        newAdventurer.mainHand = item;
        break;
      case "OffHand":
        newAdventurer.offHand = item;
        break;
      case "Belt":
          // Auto-assign to first empty belt slot
          if (!newAdventurer.belt1) {
              newAdventurer.belt1 = item;
          } else if (!newAdventurer.belt2) {
              newAdventurer.belt2 = item;
          } else {
              throw new Error("Both belt slots are full");
          }
        break;
      case "Belt1":
          newAdventurer.belt1 = item;
          break;
      case "Belt2":
          newAdventurer.belt2 = item;
          break;
      default:
        // Should not happen if Typescript is happy, but safety check.
        break;
    }

    return newAdventurer;
  }
  
    /**
   * Unequips an item from a slot.
   */
  static unequip(adventurer: Adventurer, slot: "Head" | "Torso" | "Back" | "MainHand" | "OffHand" | "Belt1" | "Belt2"): Adventurer {
      const newAdventurer = structuredClone(adventurer); // Deep copy
      
      let itemToUnload: Item | null | undefined = null;
      switch(slot) {
          case "Head": itemToUnload = newAdventurer.head; newAdventurer.head = null; break;
          case "Torso": itemToUnload = newAdventurer.torso; newAdventurer.torso = null; break;
          case "Back": itemToUnload = newAdventurer.back; newAdventurer.back = null; break;
          case "MainHand": itemToUnload = newAdventurer.mainHand; newAdventurer.mainHand = null; break;
          case "OffHand": itemToUnload = newAdventurer.offHand; newAdventurer.offHand = null; break;
          case "Belt1": itemToUnload = newAdventurer.belt1; newAdventurer.belt1 = null; break;
          case "Belt2": itemToUnload = newAdventurer.belt2; newAdventurer.belt2 = null; break;
      }

      if (itemToUnload) {
          if (!newAdventurer.backpack) newAdventurer.backpack = [];
          newAdventurer.backpack.push(itemToUnload);
      }
      return newAdventurer;
  }

  /**
   * Applies an item's effect to an adventurer.
   * Returns a report of what happened.
   */
  static useItem(adventurer: Adventurer, item: Item): { adventurer: Adventurer, log: string } {
    if (!item.usable || !item.effect) {
      throw new Error(`Item ${item.name} is not usable`);
    }

    const newAdventurer = structuredClone(adventurer);
    let log = `${adventurer.name} used ${item.name}.`;

    const [action, ...params] = item.effect.split(":");

    switch (action) {
      case "HEAL": {
        const amount = parseInt(params[0] || "0");
        const healAmt = Math.min(amount, newAdventurer.maxHp - newAdventurer.hp);
        newAdventurer.hp += healAmt;
        log += ` Restored ${healAmt} HP.`;
        break;
      }
      case "RESTORE_FATE": {
          const amount = parseInt(params[0] || "1");
          newAdventurer.fate += amount;
          log += ` Restored ${amount} Fate.`;
          break;
      }
      // Add more cases as needed (e.g., GREASE, HOLY_WATER)
      default:
        log += " But nothing happened.";
    }

    return { adventurer: newAdventurer, log };
  }
}
