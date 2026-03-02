/**
 * WorldBuilderMountService
 *
 * Handles:
 * - buyMount: add a mount to the mount sheet
 * - sellMount: sell a mount, find a buyer
 * - feedMount: consume 1-2 rations for a mount, remove malnutrition pips
 * - addSaddlebag: attach a saddlebag to a mount
 * - stowItem: move an item into a mount saddlebag
 * - unloadItem: retrieve an item from a mount saddlebag
 * - checkLeavingMounts: check for mounts lost while adventuring
 * - stolenMountCheck: resolve a stolen mount situation
 * - checkMalnutrition: process unfed mounts at day mark
 */

import { Adventurer, WorldBuilderState, WBMount } from "../models/adventurer.ts";
import { SettlementType, SETTLEMENT_COSTS } from "../data/world_builder/settlements_table.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BuyMountInput {
  name: string;
  type: string;
  cost: number;
  value: number;
  /** d100 to check availability (some mounts require unlock rolls) */
  availabilityRoll?: number;
  /** Unlock chance (0 = always available) */
  availabilityChance?: number;
}

export interface MountSaleResult {
  success: boolean;
  goldEarned: number;
  message: string;
}

export interface LeavingMountsResult {
  /** Which mounts were lost (name + reason) */
  lostMounts: Array<{ name: string; reason: "lost" | "stolen" | "eaten" }>;
  message: string;
}

export interface StolenMountResolution {
  /** d100 for finding a lead */
  leadRoll: number;
  /** If lead found: d6 for location */
  locationRoll?: number;
  /** If attempt to retrieve: d100 for success */
  retrievalRoll?: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class WorldBuilderMountService {

  // ---- Buy Mount -----------------------------------------------------------

  /**
   * Purchase a mount and add it to the mount sheet (max 6 slots; dragon = all 6).
   */
  buyMount(
    adventurer: Adventurer,
    state: WorldBuilderState,
    input: BuyMountInput,
  ): { adventurer: Adventurer; state: WorldBuilderState; result: { success: boolean; message: string } } {
    // Check availability
    if (input.availabilityChance && input.availabilityRoll !== undefined) {
      if (input.availabilityRoll > input.availabilityChance) {
        return {
          adventurer, state,
          result: { success: false, message: "Mount not available at this settlement" },
        };
      }
    }

    // Check gold
    if (adventurer.gold < input.cost) {
      return {
        adventurer, state,
        result: { success: false, message: `Not enough gold (need ${input.cost}gp, have ${adventurer.gold}gp)` },
      };
    }

    const mounts = state.mounts;
    const isDragon = input.type === "dragon";

    // Dragon uses all 6 slots
    if (isDragon && mounts.length > 0) {
      return {
        adventurer, state,
        result: { success: false, message: "A dragon requires all 6 mount slots to be free" },
      };
    }

    // Normal mount: find next free slot (1-6)
    const usedSlots = new Set(mounts.map((m) => m.slotNumber));
    let slotNumber = -1;
    for (let s = 1; s <= 6; s++) {
      if (!usedSlots.has(s)) { slotNumber = s; break; }
    }
    if (slotNumber === -1) {
      return {
        adventurer, state,
        result: { success: false, message: "No free mount slots (maximum 6)" },
      };
    }

    const newMount: WBMount = {
      slotNumber,
      name: input.name,
      type: input.type,
      rations: 0,
      malnutrition: 0,
      saddlebags: [],
      notes: "",
      value: input.value,
      isStolen: false,
      stolenDaysAgo: 0,
    };

    const updatedState: WorldBuilderState = {
      ...state,
      mounts: [...mounts, newMount].sort((a, b) => a.slotNumber - b.slotNumber),
    };

    return {
      adventurer: { ...adventurer, gold: adventurer.gold - input.cost },
      state: updatedState,
      result: { success: true, message: `${input.name} purchased for ${input.cost}gp (slot ${slotNumber})` },
    };
  }

  // ---- Sell Mount ----------------------------------------------------------

  /**
   * Sell a mount at a settlement.
   * Mounts with malnutrition reduce sale value (lose 10% per pip).
   */
  sellMount(
    adventurer: Adventurer,
    state: WorldBuilderState,
    slotNumber: number,
    settlementType: SettlementType,
    buyerRoll: number,
  ): { adventurer: Adventurer; state: WorldBuilderState; result: MountSaleResult } {
    const mountIndex = state.mounts.findIndex((m) => m.slotNumber === slotNumber);
    if (mountIndex === -1) {
      return { adventurer, state, result: { success: false, goldEarned: 0, message: `No mount in slot ${slotNumber}` } };
    }
    const mount = state.mounts[mountIndex];

    // Find buyer (same unlock chance as selling items)
    const sellCosts = SETTLEMENT_COSTS.sell[settlementType];
    if (sellCosts.unlockChance > 0 && buyerRoll > sellCosts.unlockChance) {
      return { adventurer, state, result: { success: false, goldEarned: 0, message: "No buyer found for the mount" } };
    }

    // Malnutrition penalty: -10% value per pip
    const malnutritionPenalty = mount.malnutrition * 0.1;
    const salePrice = Math.floor(mount.value * (1 - malnutritionPenalty));

    const updatedMounts = state.mounts.filter((_, i) => i !== mountIndex);
    const updatedState: WorldBuilderState = { ...state, mounts: updatedMounts };

    return {
      adventurer: { ...adventurer, gold: adventurer.gold + salePrice },
      state: updatedState,
      result: { success: true, goldEarned: salePrice, message: `${mount.name} sold for ${salePrice}gp` },
    };
  }

  // ---- Feed Mount ----------------------------------------------------------

  /**
   * Feed a mount (1 or 2 rations from the calendar rations track).
   * If double=true, feeding twice removes 1 malnutrition pip.
   */
  feedMount(
    adventurer: Adventurer,
    state: WorldBuilderState,
    slotNumber: number,
    rationsToPay: number,
    double: boolean,
  ): { adventurer: Adventurer; state: WorldBuilderState; result: { success: boolean; message: string } } {
    const mountIndex = state.mounts.findIndex((m) => m.slotNumber === slotNumber);
    if (mountIndex === -1) {
      return { adventurer, state, result: { success: false, message: `No mount in slot ${slotNumber}` } };
    }

    // Check rations available on calendar
    const cal = state.calendar;
    if (cal.rations < rationsToPay) {
      return { adventurer, state, result: { success: false, message: `Not enough rations (need ${rationsToPay}, have ${cal.rations})` } };
    }

    const mount = state.mounts[mountIndex];
    const newMalnutrition = double ? Math.max(0, mount.malnutrition - 1) : mount.malnutrition;

    const updatedMounts = [...state.mounts];
    updatedMounts[mountIndex] = {
      ...mount,
      rations: mount.rations + rationsToPay,
      malnutrition: newMalnutrition,
    };

    const updatedState: WorldBuilderState = {
      ...state,
      mounts: updatedMounts,
      calendar: { ...cal, rations: cal.rations - rationsToPay },
    };

    const msg = double
      ? `Fed ${mount.name} double rations — removed 1 malnutrition pip`
      : `Fed ${mount.name} ${rationsToPay} ration(s)`;

    return { adventurer, state: updatedState, result: { success: true, message: msg } };
  }

  // ---- Add Saddlebag -------------------------------------------------------

  /**
   * Purchase and attach a saddlebag to a mount (max 4 saddlebags per mount).
   */
  addSaddlebag(
    adventurer: Adventurer,
    state: WorldBuilderState,
    slotNumber: number,
    cost: number,
    availabilityRoll?: number,
    availabilityChance?: number,
  ): { adventurer: Adventurer; state: WorldBuilderState; result: { success: boolean; message: string } } {
    const mountIndex = state.mounts.findIndex((m) => m.slotNumber === slotNumber);
    if (mountIndex === -1) {
      return { adventurer, state, result: { success: false, message: `No mount in slot ${slotNumber}` } };
    }

    const mount = state.mounts[mountIndex];

    if (mount.saddlebags.length >= 4) {
      return { adventurer, state, result: { success: false, message: `${mount.name} already has 4 saddlebags (maximum)` } };
    }

    if (availabilityChance && availabilityRoll !== undefined && availabilityRoll > availabilityChance) {
      return { adventurer, state, result: { success: false, message: "Saddlebags not available at this settlement" } };
    }

    if (adventurer.gold < cost) {
      return { adventurer, state, result: { success: false, message: `Not enough gold (need ${cost}gp)` } };
    }

    const updatedMounts = [...state.mounts];
    updatedMounts[mountIndex] = {
      ...mount,
      saddlebags: [...mount.saddlebags, { trackItem: null, stackItems: [] }],
    };

    return {
      adventurer: { ...adventurer, gold: adventurer.gold - cost },
      state: { ...state, mounts: updatedMounts },
      result: { success: true, message: `Saddlebag added to ${mount.name} for ${cost}gp` },
    };
  }

  // ---- Stow Item -----------------------------------------------------------

  /**
   * Stow an item (by name) into a mount saddlebag slot.
   * Can only be done outside of quests.
   * @param bagIndex 0-3 (which saddlebag)
   * @param isStackable True if item is a quantity-based stack (up to 2 stacks of 10)
   * @param qty Quantity for stackable items
   */
  stowItem(
    adventurer: Adventurer,
    state: WorldBuilderState,
    slotNumber: number,
    bagIndex: number,
    itemName: string,
    isStackable: boolean,
    qty = 1,
  ): { adventurer: Adventurer; state: WorldBuilderState; result: { success: boolean; message: string } } {
    const mountIndex = state.mounts.findIndex((m) => m.slotNumber === slotNumber);
    if (mountIndex === -1) {
      return { adventurer, state, result: { success: false, message: `No mount in slot ${slotNumber}` } };
    }

    const mount = state.mounts[mountIndex];
    if (!mount.saddlebags[bagIndex]) {
      return { adventurer, state, result: { success: false, message: `No saddlebag at index ${bagIndex}` } };
    }

    const bag = mount.saddlebags[bagIndex];

    if (isStackable) {
      // Stack items: up to 2 stacks of 10
      const existingStack = bag.stackItems.find((s) => s.name === itemName);
      if (existingStack) {
        if (existingStack.qty + qty > 10) {
          return { adventurer, state, result: { success: false, message: `Cannot exceed 10 ${itemName} per stack` } };
        }
        const updatedBag = {
          ...bag,
          stackItems: bag.stackItems.map((s) => s.name === itemName ? { ...s, qty: s.qty + qty } : s),
        };
        const updatedMounts = [...state.mounts];
        updatedMounts[mountIndex] = {
          ...mount,
          saddlebags: mount.saddlebags.map((b, i) => i === bagIndex ? updatedBag : b),
        };
        return {
          adventurer,
          state: { ...state, mounts: updatedMounts },
          result: { success: true, message: `Added ${qty} ${itemName} to saddlebag` },
        };
      }
      if (bag.stackItems.length >= 2) {
        return { adventurer, state, result: { success: false, message: "Saddlebag already has 2 stacks" } };
      }
      const updatedBag = { ...bag, stackItems: [...bag.stackItems, { name: itemName, qty }] };
      const updatedMounts = [...state.mounts];
      updatedMounts[mountIndex] = {
        ...mount,
        saddlebags: mount.saddlebags.map((b, i) => i === bagIndex ? updatedBag : b),
      };
      return {
        adventurer,
        state: { ...state, mounts: updatedMounts },
        result: { success: true, message: `Stowed ${qty} ${itemName} in saddlebag` },
      };
    }

    // Track item (damage-tracked) — only 1 per bag
    if (bag.trackItem) {
      return { adventurer, state, result: { success: false, message: "Saddlebag already holds a tracked item" } };
    }
    const updatedBag = { ...bag, trackItem: { name: itemName, pips: 0 } };
    const updatedMounts = [...state.mounts];
    updatedMounts[mountIndex] = {
      ...mount,
      saddlebags: mount.saddlebags.map((b, i) => i === bagIndex ? updatedBag : b),
    };
    return {
      adventurer,
      state: { ...state, mounts: updatedMounts },
      result: { success: true, message: `Stowed ${itemName} (track item) in saddlebag` },
    };
  }

  // ---- Unload Item ---------------------------------------------------------

  /**
   * Remove an item from a mount saddlebag and return it to the adventurer's backpack.
   */
  unloadItem(
    adventurer: Adventurer,
    state: WorldBuilderState,
    slotNumber: number,
    bagIndex: number,
    itemName: string,
    isTrackItem: boolean,
  ): { adventurer: Adventurer; state: WorldBuilderState; result: { success: boolean; message: string } } {
    const mountIndex = state.mounts.findIndex((m) => m.slotNumber === slotNumber);
    if (mountIndex === -1) {
      return { adventurer, state, result: { success: false, message: `No mount in slot ${slotNumber}` } };
    }

    const mount = state.mounts[mountIndex];
    const bag = mount.saddlebags[bagIndex];
    if (!bag) {
      return { adventurer, state, result: { success: false, message: `No saddlebag at index ${bagIndex}` } };
    }

    let updatedBag = { ...bag };

    if (isTrackItem) {
      if (!bag.trackItem || bag.trackItem.name !== itemName) {
        return { adventurer, state, result: { success: false, message: `${itemName} not found in saddlebag` } };
      }
      updatedBag = { ...bag, trackItem: null };
    } else {
      const stackIdx = bag.stackItems.findIndex((s) => s.name === itemName);
      if (stackIdx === -1) {
        return { adventurer, state, result: { success: false, message: `${itemName} not found in saddlebag` } };
      }
      const updatedStacks = bag.stackItems.filter((_, i) => i !== stackIdx);
      updatedBag = { ...bag, stackItems: updatedStacks };
    }

    const updatedMounts = [...state.mounts];
    updatedMounts[mountIndex] = {
      ...mount,
      saddlebags: mount.saddlebags.map((b, i) => i === bagIndex ? updatedBag : b),
    };

    return {
      adventurer,
      state: { ...state, mounts: updatedMounts },
      result: { success: true, message: `${itemName} returned from saddlebag` },
    };
  }

  // ---- Check Leaving Mounts -----------------------------------------------

  /**
   * When an adventurer enters a quest, check if any mounts left behind are lost.
   * Each quest time pip = 5% chance per mount (d100 roll per mount).
   */
  checkLeavingMounts(
    adventurer: Adventurer,
    state: WorldBuilderState,
    questTimePips: number,
    mountRolls: number[],
  ): { adventurer: Adventurer; state: WorldBuilderState; result: LeavingMountsResult } {
    const lostMounts: LeavingMountsResult["lostMounts"] = [];
    const threshold = questTimePips * 5; // 5% per pip

    const updatedMounts: WBMount[] = [];

    for (let i = 0; i < state.mounts.length; i++) {
      const mount = state.mounts[i];
      const roll = mountRolls[i] ?? 100;

      if (roll <= threshold) {
        // Determine reason: d10 (1-5 lost/wandered, 6-8 stolen, 9-10 eaten)
        // We use the same roll modulo to determine reason
        const reasonRoll = (roll % 10) + 1;
        const reason = reasonRoll <= 5 ? "lost" : reasonRoll <= 8 ? "stolen" : "eaten";

        if (reason === "stolen") {
          // Mark as stolen — stays in record with isStolen=true
          updatedMounts.push({ ...mount, isStolen: true, stolenDaysAgo: 0 });
        } else {
          // Lost or eaten — removed entirely
          lostMounts.push({ name: mount.name, reason });
        }
        if (reason !== "lost" && reason !== "eaten") {
          lostMounts.push({ name: mount.name, reason });
        }
      } else {
        updatedMounts.push(mount);
      }
    }

    const updatedState: WorldBuilderState = { ...state, mounts: updatedMounts };
    const msg = lostMounts.length > 0
      ? `Lost ${lostMounts.length} mount(s): ${lostMounts.map((m) => `${m.name} (${m.reason})`).join(", ")}`
      : "All mounts safe";

    return { adventurer, state: updatedState, result: { lostMounts, message: msg } };
  }

  // ---- Stolen Mount Check -------------------------------------------------

  /**
   * Check on a stolen mount (each time the adventurer returns to the settlement).
   * Days since theft determines % chance of finding a lead.
   */
  stolenMountCheck(
    adventurer: Adventurer,
    state: WorldBuilderState,
    slotNumber: number,
    resolution: StolenMountResolution,
  ): { adventurer: Adventurer; state: WorldBuilderState; result: { foundLead: boolean; recovered: boolean; message: string } } {
    const mountIndex = state.mounts.findIndex((m) => m.slotNumber === slotNumber && m.isStolen);
    if (mountIndex === -1) {
      return { adventurer, state, result: { foundLead: false, recovered: false, message: `No stolen mount in slot ${slotNumber}` } };
    }

    const mount = state.mounts[mountIndex];
    // Chance: 20% + 5% per day since theft (max 80%)
    const leadChance = Math.min(80, 20 + (mount.stolenDaysAgo * 5));

    if (resolution.leadRoll > leadChance) {
      // No lead — increment days stolen
      const updatedMounts = [...state.mounts];
      updatedMounts[mountIndex] = { ...mount, stolenDaysAgo: mount.stolenDaysAgo + 1 };
      return {
        adventurer,
        state: { ...state, mounts: updatedMounts },
        result: { foundLead: false, recovered: false, message: `No lead found (roll ${resolution.leadRoll} > ${leadChance}%)` },
      };
    }

    // Lead found — attempt retrieval if retrievalRoll provided
    if (resolution.retrievalRoll === undefined) {
      return {
        adventurer, state,
        result: { foundLead: true, recovered: false, message: `Lead found! Attempt retrieval to recover ${mount.name}` },
      };
    }

    if (resolution.retrievalRoll <= 50) {
      // Recovered!
      const updatedMounts = [...state.mounts];
      updatedMounts[mountIndex] = { ...mount, isStolen: false, stolenDaysAgo: 0 };
      return {
        adventurer,
        state: { ...state, mounts: updatedMounts },
        result: { foundLead: true, recovered: true, message: `${mount.name} recovered!` },
      };
    }

    // Failed retrieval — mount lost permanently
    const updatedMounts = state.mounts.filter((_, i) => i !== mountIndex);
    return {
      adventurer,
      state: { ...state, mounts: updatedMounts },
      result: { foundLead: true, recovered: false, message: `Recovery failed — ${mount.name} is gone permanently` },
    };
  }

  // ---- Check Malnutrition -------------------------------------------------

  /**
   * Apply malnutrition processing for a single day.
   * For mounts with no rations, shade 1 pip; at 10 pips, roll d6 = 6 to die.
   * (This is called internally by WorldBuilderCalendarService.markDay)
   */
  checkMalnutrition(
    state: WorldBuilderState,
    deathRolls: number[],
  ): { state: WorldBuilderState; deadMounts: string[] } {
    const deadMounts: string[] = [];
    const updatedMounts: WBMount[] = [];

    for (let i = 0; i < state.mounts.length; i++) {
      const mount = state.mounts[i];
      if (mount.type === "dragon") {
        updatedMounts.push(mount);
        continue;
      }
      if (mount.rations > 0) {
        updatedMounts.push({ ...mount, rations: mount.rations - 1 });
        continue;
      }
      // No rations — shade 1 malnutrition pip
      const newPips = Math.min(10, mount.malnutrition + 1);
      if (newPips >= 10) {
        const deathRoll = deathRolls[i] ?? 1;
        if (deathRoll === 6) {
          deadMounts.push(mount.name);
          continue; // Remove mount from list
        }
      }
      updatedMounts.push({ ...mount, malnutrition: newPips });
    }

    return { state: { ...state, mounts: updatedMounts }, deadMounts };
  }
}
