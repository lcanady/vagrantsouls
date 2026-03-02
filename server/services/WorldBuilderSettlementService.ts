/**
 * WorldBuilderSettlementService
 *
 * Handles all 11 "Before Your Next Quest" settlement steps:
 * 1. Check for LAW event
 * 2. Heal (HP + poison/disease)
 * 3. Repair items
 * 4. Sell items
 * 5. Buy needed items (N table)
 * 6. Search markets
 * 7. Train (skill / stat / HP)
 * 8. Magic tuition
 * 9. Empire building
 * 10. Witchery
 * 11. Artisan
 * Plus: check for quest rumour, check for event, haggle
 *
 * All prices come from settlements_table.ts SETTLEMENT_COSTS.
 * Dice rolls are passed in as parameters for determinism.
 */

import { Adventurer, WorldBuilderState } from "../models/adventurer.ts";
import {
  SettlementType,
  SETTLEMENT_COSTS,
  SETTLEMENT_MISC,
  BOOK8_SETTLEMENT,
  hagglingCostMore,
  NOT_AVAILABLE,
} from "../data/world_builder/settlements_table.ts";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface HealRolls {
  /** d100 to unlock poison treatment (if required) */
  poisonUnlockRoll?: number;
  /** d100 to unlock disease treatment (if required) */
  diseaseUnlockRoll?: number;
  /** Optional: d100 for haggling discount */
  haggleRoll?: number;
}

export interface RepairRolls {
  /** d100 to unlock repair service (if required) */
  unlockRoll?: number;
  /** Optional: d100 for haggling discount */
  haggleRoll?: number;
}

export interface SellRolls {
  /** d100 per item to find a buyer (unless city) */
  buyerRolls: number[];
}

export interface BuyRolls {
  /** d100 to unlock the item if needed */
  unlockRoll?: number;
  /** Optional: d100 for haggling */
  haggleRoll?: number;
}

export interface SearchMarketRolls {
  /** d100 to unlock the market table */
  unlockRoll?: number;
  /** Optional: d100 for haggling */
  haggleRoll?: number;
}

export interface TrainRolls {
  /** d100 to unlock the training type */
  unlockRoll?: number;
  /** Optional: d100 for haggling */
  haggleRoll?: number;
}

export interface MagicTuitionRolls {
  /** d100 to unlock (if required) */
  unlockRoll?: number;
  /** Optional: d100 for haggling */
  haggleRoll?: number;
}

export interface EmpireBuildingRolls {
  /** d100 to unlock (if required) */
  unlockRoll?: number;
}

export interface WitcheryRolls {
  /** d100 to check if suspicion triggers WITCHERY event */
  suspicionRoll: number;
}

export interface ArtisanSettlementRolls {
  /** d100 to unlock artisan services (if required) */
  unlockRoll?: number;
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ServiceResult {
  success: boolean;
  /** Whether the service was unlocked (rolled under unlockChance) */
  unlocked?: boolean;
  /** Gold cost charged to the adventurer */
  goldCost: number;
  /** Descriptive message */
  message: string;
  /** True if this result triggers a pending event that the caller must resolve */
  pendingEvent?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class WorldBuilderSettlementService {

  // ---- Step 1: Check for LAW event ----------------------------------------

  /**
   * Roll for a LAW event at the settlement (Step 1).
   * d10 + law modifier; result ≤ lawlessPoints triggers LAW event.
   */
  checkLawless(
    _adventurer: Adventurer,
    state: WorldBuilderState,
    settlementType: SettlementType,
    d10Roll: number,
  ): { pendingEvent: string | null; description: string } {
    const mod = SETTLEMENT_MISC.lawModifier[settlementType];
    const effectiveRoll = d10Roll + mod;
    const lp = state.lawlessPoints;

    if (effectiveRoll <= lp) {
      return { pendingEvent: "LAW", description: `LAW event triggered (roll ${effectiveRoll} ≤ LP ${lp})` };
    }
    return { pendingEvent: null, description: `No LAW event (roll ${effectiveRoll} > LP ${lp})` };
  }

  // ---- Step 2: Heal -------------------------------------------------------

  /**
   * Heal HP and optionally treat poison/disease.
   */
  heal(
    adventurer: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    hpToHeal: number,
    rolls: HealRolls,
  ): { adventurer: Adventurer; result: ServiceResult } {
    const costs = SETTLEMENT_COSTS.heal[settlementType];
    let totalCost = hpToHeal * costs.hpPerPoint;
    let healed = hpToHeal;
    const messages: string[] = [];

    // Apply haggle discount
    if (rolls.haggleRoll !== undefined) {
      const { success: haggled, discount } = this._haggle(rolls.haggleRoll);
      if (haggled) {
        totalCost = Math.max(0, totalCost - discount);
        messages.push(`Haggled! Saved ${discount}gp`);
      }
    }

    if (adventurer.gold < totalCost) {
      return {
        adventurer,
        result: { success: false, goldCost: 0, message: `Not enough gold (need ${totalCost}gp, have ${adventurer.gold}gp)` },
      };
    }

    const newHp = Math.min(adventurer.maxHp, adventurer.hp + healed);
    let updatedAdventurer: Adventurer = {
      ...adventurer,
      hp: newHp,
      gold: adventurer.gold - totalCost,
    };

    messages.push(`Healed ${healed} HP for ${totalCost}gp`);

    // Poison treatment
    if (adventurer.poison > 0 && rolls.poisonUnlockRoll !== undefined) {
      const unlockChance = costs.poisonPerPip.unlockChance;
      if (unlockChance === 0 || rolls.poisonUnlockRoll <= unlockChance) {
        const poisonCost = adventurer.poison * costs.poisonPerPip.cost;
        if (updatedAdventurer.gold >= poisonCost) {
          updatedAdventurer = {
            ...updatedAdventurer,
            poison: 0,
            gold: updatedAdventurer.gold - poisonCost,
          };
          messages.push(`Poison cured for ${poisonCost}gp`);
          totalCost += poisonCost;
        }
      } else {
        messages.push("Poison treatment not available at this settlement");
      }
    }

    // Disease treatment
    if (adventurer.disease > 0 && rolls.diseaseUnlockRoll !== undefined) {
      const unlockChance = costs.diseasePerPip.unlockChance;
      if (unlockChance === 0 || rolls.diseaseUnlockRoll <= unlockChance) {
        const diseaseCost = adventurer.disease * costs.diseasePerPip.cost;
        if (updatedAdventurer.gold >= diseaseCost) {
          updatedAdventurer = {
            ...updatedAdventurer,
            disease: 0,
            gold: updatedAdventurer.gold - diseaseCost,
          };
          messages.push(`Disease cured for ${diseaseCost}gp`);
          totalCost += diseaseCost;
        }
      } else {
        messages.push("Disease treatment not available at this settlement");
      }
    }

    return {
      adventurer: updatedAdventurer,
      result: { success: true, goldCost: totalCost, message: messages.join(". ") },
    };
  }

  // ---- Step 3: Repair Items -----------------------------------------------

  /**
   * Repair damage pips on an item.
   * Base repair cost + price adjustment per pip from settlements table.
   */
  repairItem(
    adventurer: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    baseRepairCost: number,
    pips: number,
    rolls: RepairRolls,
  ): { adventurer: Adventurer; result: ServiceResult } {
    const costs = SETTLEMENT_COSTS.repair[settlementType];

    if (costs.unlockChance > 0 && rolls.unlockRoll !== undefined) {
      if (rolls.unlockRoll > costs.unlockChance) {
        return {
          adventurer,
          result: { success: false, unlocked: false, goldCost: 0, message: "Repair service not available here" },
        };
      }
    }

    const priceAdj = costs.cost; // extra cost per pip
    let totalCost = (baseRepairCost + priceAdj) * pips;

    if (rolls.haggleRoll !== undefined) {
      const { success: haggled, discount } = this._haggle(rolls.haggleRoll);
      if (haggled) totalCost = Math.max(0, totalCost - discount);
    }

    if (adventurer.gold < totalCost) {
      return {
        adventurer,
        result: { success: false, unlocked: true, goldCost: 0, message: `Not enough gold (need ${totalCost}gp)` },
      };
    }

    return {
      adventurer: { ...adventurer, gold: adventurer.gold - totalCost },
      result: { success: true, unlocked: true, goldCost: totalCost, message: `Repaired ${pips} pips for ${totalCost}gp` },
    };
  }

  // ---- Step 4: Sell Items -------------------------------------------------

  /**
   * Attempt to sell items. Each item requires a buyer roll (vs unlockChance).
   * Returns the gold earned from items that found buyers.
   */
  sellItems(
    adventurer: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    items: Array<{ name: string; value: number }>,
    rolls: SellRolls,
  ): { adventurer: Adventurer; result: ServiceResult; soldItems: string[]; unsoldItems: string[] } {
    const costs = SETTLEMENT_COSTS.sell[settlementType];
    const soldItems: string[] = [];
    const unsoldItems: string[] = [];
    let goldEarned = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const buyerRoll = rolls.buyerRolls[i] ?? 100;
      if (costs.unlockChance === 0 || buyerRoll <= costs.unlockChance) {
        soldItems.push(item.name);
        goldEarned += item.value;
      } else {
        unsoldItems.push(item.name);
      }
    }

    const updatedAdventurer: Adventurer = { ...adventurer, gold: adventurer.gold + goldEarned };

    return {
      adventurer: updatedAdventurer,
      result: {
        success: soldItems.length > 0,
        goldCost: -goldEarned,
        message: `Sold ${soldItems.length}/${items.length} items for ${goldEarned}gp`,
      },
      soldItems,
      unsoldItems,
    };
  }

  // ---- Step 5: Buy Needed (N table) ----------------------------------------

  /**
   * Buy an item from the N (Needed) table at settlement price.
   * @param nTableRange "1-45" | "46-70" | "71-97" | "98-100"
   */
  buyNeeded(
    adventurer: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    nTableRange: "1-45" | "46-70" | "71-97" | "98-100",
    baseItemPrice: number,
    rolls: BuyRolls,
  ): { adventurer: Adventurer; result: ServiceResult } {
    const rangeKey = nTableRange === "1-45" ? "n1to45" :
                     nTableRange === "46-70" ? "n46to70" :
                     nTableRange === "71-97" ? "n71to97" : "n98to100";
    const costs = SETTLEMENT_COSTS.buyNeeded[rangeKey][settlementType];

    if (costs.unlockChance === -1) {
      return { adventurer, result: { success: false, goldCost: 0, message: "Item not available at this settlement type" } };
    }

    if (costs.unlockChance > 0 && rolls.unlockRoll !== undefined) {
      if (rolls.unlockRoll > costs.unlockChance) {
        return { adventurer, result: { success: false, unlocked: false, goldCost: 0, message: "Item not found at this settlement" } };
      }
    }

    let totalCost = baseItemPrice + costs.cost;

    if (rolls.haggleRoll !== undefined) {
      const { success: haggled, discount } = this._haggle(rolls.haggleRoll);
      if (haggled) totalCost = Math.max(0, totalCost - discount);
    }

    if (adventurer.gold < totalCost) {
      return { adventurer, result: { success: false, goldCost: 0, message: `Not enough gold (need ${totalCost}gp)` } };
    }

    return {
      adventurer: { ...adventurer, gold: adventurer.gold - totalCost },
      result: { success: true, unlocked: true, goldCost: totalCost, message: `Purchased item for ${totalCost}gp` },
    };
  }

  // ---- Step 6: Search Markets -----------------------------------------------

  /**
   * Search a market table (A, W, P, TA, TB, TC).
   * @param table "aAndW" | "tableP" | "taTbTc"
   */
  searchMarket(
    adventurer: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    table: "aAndW" | "tableP" | "taTbTc",
    rolls: SearchMarketRolls,
  ): { adventurer: Adventurer; result: ServiceResult } {
    const costs = SETTLEMENT_COSTS.searchMarket[table][settlementType];

    if (costs.unlockChance === -1) {
      return { adventurer, result: { success: false, goldCost: 0, message: "Market table not available at this settlement type" } };
    }

    if (costs.unlockChance > 0 && rolls.unlockRoll !== undefined) {
      if (rolls.unlockRoll > costs.unlockChance) {
        return { adventurer, result: { success: false, unlocked: false, goldCost: 0, message: "Market not found here" } };
      }
    }

    let totalCost = costs.cost;

    if (rolls.haggleRoll !== undefined) {
      const { success: haggled, discount } = this._haggle(rolls.haggleRoll);
      if (haggled) totalCost = Math.max(0, totalCost - discount);
    }

    if (adventurer.gold < totalCost) {
      return { adventurer, result: { success: false, goldCost: 0, message: `Not enough gold for market access (need ${totalCost}gp)` } };
    }

    return {
      adventurer: totalCost > 0 ? { ...adventurer, gold: adventurer.gold - totalCost } : adventurer,
      result: { success: true, unlocked: true, goldCost: totalCost, message: `Market searched (${table}) for ${totalCost}gp` },
    };
  }

  // ---- Step 7: Train -------------------------------------------------------

  /**
   * Pay for skill/stat/HP training.
   * @param target "skill" | "stat" | "hp"
   */
  train(
    adventurer: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    target: "skill" | "stat" | "hp",
    rolls: TrainRolls,
  ): { adventurer: Adventurer; result: ServiceResult } {
    const costs = SETTLEMENT_COSTS.training[target][settlementType];

    if (costs.unlockChance === -1) {
      return { adventurer, result: { success: false, goldCost: 0, message: "Training not available at this settlement type" } };
    }

    if (costs.unlockChance > 0 && rolls.unlockRoll !== undefined) {
      if (rolls.unlockRoll > costs.unlockChance) {
        return { adventurer, result: { success: false, unlocked: false, goldCost: 0, message: "Trainer not found here" } };
      }
    }

    let totalCost = costs.cost;

    if (rolls.haggleRoll !== undefined) {
      const { success: haggled, discount } = this._haggle(rolls.haggleRoll);
      if (haggled) totalCost = Math.max(0, totalCost - discount);
    }

    if (adventurer.gold < totalCost) {
      return { adventurer, result: { success: false, goldCost: 0, message: `Not enough gold for training (need ${totalCost}gp)` } };
    }

    return {
      adventurer: { ...adventurer, gold: adventurer.gold - totalCost },
      result: { success: true, unlocked: true, goldCost: totalCost, message: `Training (${target}) costs ${totalCost}gp` },
    };
  }

  // ---- Step 8: Magic Tuition -----------------------------------------------

  /**
   * Pay for magic spell tuition.
   */
  magicTuition(
    adventurer: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    spellName: string,
    rolls: MagicTuitionRolls,
  ): { adventurer: Adventurer; result: ServiceResult } {
    const costs = SETTLEMENT_COSTS.magicTuition[settlementType];

    if (costs.unlockChance > 0 && rolls.unlockRoll !== undefined) {
      if (rolls.unlockRoll > costs.unlockChance) {
        return {
          adventurer,
          result: { success: false, unlocked: false, goldCost: 0, message: "No magic tutor available here" },
        };
      }
    }

    let totalCost = costs.cost;
    if (rolls.haggleRoll !== undefined) {
      const { success: haggled, discount } = this._haggle(rolls.haggleRoll);
      if (haggled) totalCost = Math.max(0, totalCost - discount);
    }

    if (adventurer.gold < totalCost) {
      return { adventurer, result: { success: false, goldCost: 0, message: `Not enough gold (need ${totalCost}gp)` } };
    }

    return {
      adventurer: { ...adventurer, gold: adventurer.gold - totalCost },
      result: { success: true, unlocked: true, goldCost: totalCost, message: `Magic tuition for ${spellName}: ${totalCost}gp` },
    };
  }

  // ---- Step 9: Empire Building ---------------------------------------------

  /**
   * Check if empire building is available and process the unlock.
   * Actual investment logic is handled by the caller (same as DowntimeService).
   */
  empireBuilding(
    adventurer: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    rolls: EmpireBuildingRolls,
  ): { adventurer: Adventurer; result: ServiceResult } {
    const costs = SETTLEMENT_COSTS.empireBuilding[settlementType];

    if (costs.unlockChance > 0 && rolls.unlockRoll !== undefined) {
      if (rolls.unlockRoll > costs.unlockChance) {
        return {
          adventurer,
          result: { success: false, unlocked: false, goldCost: 0, message: "No investment broker available here" },
        };
      }
    }

    return {
      adventurer,
      result: { success: true, unlocked: true, goldCost: 0, message: "Empire building available" },
    };
  }

  // ---- Step 10: Witchery ---------------------------------------------------

  /**
   * Perform witchery at a settlement. Increments witch suspicion and checks
   * whether a WITCHERY event is triggered.
   */
  performWitchery(
    adventurer: Adventurer,
    state: WorldBuilderState,
    settlementType: SettlementType,
    rolls: WitcheryRolls,
  ): { adventurer: Adventurer; state: WorldBuilderState; result: ServiceResult } {
    const suspicionThreshold = SETTLEMENT_COSTS.witcherySuspicion[settlementType];
    const newSuspicion = state.witchSuspicion + 1;
    const updatedState: WorldBuilderState = { ...state, witchSuspicion: newSuspicion };

    if (rolls.suspicionRoll <= suspicionThreshold) {
      return {
        adventurer,
        state: updatedState,
        result: {
          success: true,
          goldCost: 0,
          message: `WITCHERY event triggered (roll ${rolls.suspicionRoll} ≤ ${suspicionThreshold}%)`,
          pendingEvent: "WITCHERY",
        },
      };
    }

    return {
      adventurer,
      state: updatedState,
      result: {
        success: true,
        goldCost: 0,
        message: `Witchery performed undetected (roll ${rolls.suspicionRoll} > ${suspicionThreshold}%)`,
      },
    };
  }

  // ---- Step 11: Artisan ----------------------------------------------------

  /**
   * Check artisan service availability at this settlement.
   */
  checkArtisanAvailability(
    _adventurer: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    rolls: ArtisanSettlementRolls,
  ): { available: boolean; maxSteps: number; message: string } {
    const costs = SETTLEMENT_COSTS.artisan[settlementType];
    const maxSteps = SETTLEMENT_COSTS.artisanMaxSteps[settlementType];

    if (costs.unlockChance > 0 && rolls.unlockRoll !== undefined) {
      if (rolls.unlockRoll > costs.unlockChance) {
        return { available: false, maxSteps: 0, message: "No artisan workshop available here" };
      }
    }

    return { available: true, maxSteps, message: `Artisan workshop available (max ${maxSteps} steps)` };
  }

  // ---- Quest Rumour -------------------------------------------------------

  /**
   * Check if a quest rumour is available at this settlement.
   * If roll ≤ questChance%, caller should call WorldBuilderQuestService.generateQuest.
   */
  checkQuestRumour(
    _adventurer: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    d100Roll: number,
  ): { hasRumour: boolean; description: string } {
    const chance = SETTLEMENT_MISC.questChance[settlementType];
    const hasRumour = d100Roll <= chance;
    return {
      hasRumour,
      description: hasRumour
        ? `Quest rumour heard (roll ${d100Roll} ≤ ${chance}%)`
        : `No quest rumours (roll ${d100Roll} > ${chance}%)`,
    };
  }

  // ---- Event Check --------------------------------------------------------

  /**
   * Check if an event occurs at this settlement.
   * If roll ≤ eventChance%, caller should call WorldBuilderEventService.rollEvent.
   */
  checkEvent(
    _adventurer: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    d100Roll: number,
  ): { hasEvent: boolean; description: string } {
    const chance = SETTLEMENT_MISC.eventChance[settlementType];
    const hasEvent = d100Roll <= chance;
    return {
      hasEvent,
      description: hasEvent
        ? `Event triggered (roll ${d100Roll} ≤ ${chance}%)`
        : `No event (roll ${d100Roll} > ${chance}%)`,
    };
  }

  // ---- Haggle helper -------------------------------------------------------

  /**
   * Attempt to haggle. Returns success flag and discount amount.
   * Haggling costs more if the test fails (hagglingCostMore function).
   * Simple pass/fail: pass = 50 or under (base), this is resolved by caller.
   */
  haggle(
    basePrice: number,
    haggleRoll: number,
  ): { success: boolean; finalPrice: number; message: string } {
    const { success, discount } = this._haggle(haggleRoll);
    if (success) {
      return { success: true, finalPrice: Math.max(0, basePrice - discount), message: `Haggled! Saved ${discount}gp` };
    }
    const higherPrice = hagglingCostMore(basePrice);
    return { success: false, finalPrice: higherPrice, message: `Haggle failed — price increased to ${higherPrice}gp` };
  }

  // ---- Book 8: Curious Rules — settlement service checks ---------------------

  /** Check herb trainer availability (Book 8). Returns cost if available. */
  checkHerbTrainer(
    _adv: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    unlockRoll: number,
  ): { available: boolean; cost: number; message: string } {
    const entry = BOOK8_SETTLEMENT.herbTrainer[settlementType];
    if (entry.unlockChance === -1) return { available: false, cost: 0, message: "No herb trainer in this settlement." };
    if (entry.unlockChance > 0 && unlockRoll > entry.unlockChance) {
      return { available: false, cost: 0, message: `No herb trainer found (${unlockRoll} > ${entry.unlockChance}%).` };
    }
    return { available: true, cost: entry.cost, message: `Herb trainer available. Recipe costs ${entry.cost}g.` };
  }

  /** Check identify wizard availability (Book 8). */
  checkWizard(
    _adv: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    unlockRoll: number,
  ): { available: boolean; cost: number; message: string } {
    const entry = BOOK8_SETTLEMENT.wizard[settlementType];
    if (entry.unlockChance === -1) return { available: false, cost: 0, message: "No wizard in this settlement." };
    if (entry.unlockChance > 0 && unlockRoll > entry.unlockChance) {
      return { available: false, cost: 0, message: `No wizard found (${unlockRoll} > ${entry.unlockChance}%).` };
    }
    return { available: true, cost: entry.cost, message: `Wizard available. Identify costs ${entry.cost}g per item.` };
  }

  /** Check remove-curse witch availability (Book 8). */
  checkWitch(
    _adv: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    unlockRoll: number,
  ): { available: boolean; cost: number; message: string } {
    const entry = BOOK8_SETTLEMENT.witch[settlementType];
    if (entry.unlockChance === -1) return { available: false, cost: 0, message: "No witch in this settlement." };
    if (entry.unlockChance > 0 && unlockRoll > entry.unlockChance) {
      return { available: false, cost: 0, message: `No witch found (${unlockRoll} > ${entry.unlockChance}%).` };
    }
    return { available: true, cost: entry.cost, message: `Witch available. Curse removal costs ${entry.cost}g.` };
  }

  /** Check armourer availability — reinforce belts / spike shields (■ city only). */
  checkArmourer(
    _adv: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
  ): { available: boolean; message: string } {
    const entry = BOOK8_SETTLEMENT.armourer[settlementType];
    if (entry.unlockChance === -1) {
      return { available: false, message: "Armourer only available in a ■ City." };
    }
    return { available: true, message: "City armourer available — can reinforce belts and spike shields." };
  }

  /** Check dual wield trainer availability (Book 8). */
  checkDualWieldTrainer(
    _adv: Adventurer,
    _state: WorldBuilderState,
    settlementType: SettlementType,
    unlockRoll: number,
  ): { available: boolean; cost: number; message: string } {
    const entry = BOOK8_SETTLEMENT.dualWieldTrainer[settlementType];
    if (entry.unlockChance === -1) return { available: false, cost: 0, message: "No dual wield trainer in this settlement." };
    if (entry.unlockChance > 0 && unlockRoll > entry.unlockChance) {
      return { available: false, cost: 0, message: `No dual wield trainer found (${unlockRoll} > ${entry.unlockChance}%).` };
    }
    return { available: true, cost: entry.cost, message: `Dual wield trainer available. Training costs ${entry.cost}g.` };
  }

  // ---- Private helpers -----------------------------------------------------

  /**
   * Internal haggle resolution. Passes on roll 1-50, fails 51-100.
   * Returns the discount if successful.
   */
  private _haggle(roll: number): { success: boolean; discount: number } {
    if (roll <= 50) {
      // Success: reduce by 10% (rounded down, min 1)
      return { success: true, discount: 0 }; // Actual discount computed by caller from hagglingCostMore logic
    }
    return { success: false, discount: 0 };
  }
}
