import { GameState } from "../models/gamestate.ts";
import { TableService } from "./table_service.ts";
import { Item } from "../models/item.ts";

export class DowntimeService {
    constructor(private tableService: TableService) {}

    /**
     * Step 1: Refresh Tracks (Required)
     * Resets time track and temporary dungeon tracks.
     */
    refreshTracks(gameState: GameState): GameState {
        return {
            ...gameState,
            timeTrack: 0,
            // Reset keys and levers if they were in GameState (they should be)
            // For now they are not explicitly in GameState schema but added to currentRoom features usually
        };
    }

    /**
     * Step 2: Heal (Optional)
     * Costs 10gp per 1 HP or use specific items.
     * Rules mention 10gp/HP usually in town or specific potions.
     */
    heal(gameState: GameState, hpToHeal: number): GameState {
        const cost = hpToHeal * 10;
        if (gameState.adventurer.gold < cost) {
            throw new Error("Not enough gold to heal.");
        }

        const newHp = Math.min(gameState.adventurer.maxHp, gameState.adventurer.hp + hpToHeal);
        return {
            ...gameState,
            adventurer: {
                ...gameState.adventurer,
                hp: newHp,
                gold: gameState.adventurer.gold - cost
            }
        };
    }

    /**
     * Step 3: Repair Items (Optional)
     * Costs fix value per damage pip.
     */
    repairItem(gameState: GameState, itemId: string, pipsToRepair: number): GameState {
        const adv = { ...gameState.adventurer };
        const itemIndex = adv.backpack.findIndex(i => i.id === itemId);
        
        let item: Item | undefined;
        let inInventory = false;

        if (itemIndex > -1) {
            item = adv.backpack[itemIndex];
            inInventory = true;
        } else {
            // Check equipped slots
            const slots = ["head", "torso", "back", "mainHand", "offHand", "belt1", "belt2"] as const;
            for (const slot of slots) {
                if (adv[slot]?.id === itemId) {
                    item = adv[slot]!;
                    break;
                }
            }
        }

        if (!item) throw new Error("Item not found.");
        
        const repairablePips = Math.min(item.damagePips || 0, pipsToRepair);
        const cost = (item.fix || 0) * repairablePips;

        if (adv.gold < cost) throw new Error("Not enough gold to repair.");

        const updatedItem = { ...item, damagePips: (item.damagePips || 0) - repairablePips };

        if (inInventory) {
            adv.backpack = [...adv.backpack];
            adv.backpack[itemIndex] = updatedItem;
        } else {
            const slots = ["head", "torso", "back", "mainHand", "offHand", "belt1", "belt2"] as const;
            for (const slot of slots) {
                if (adv[slot]?.id === itemId) {
                    (adv as Record<string, unknown>)[slot] = updatedItem;
                    break;
                }
            }
        }

        adv.gold -= cost;

        return { ...gameState, adventurer: adv };
    }

    /**
     * Step 4: Sell Items (Optional)
     * Value = Base Value - (Fix * Damage Pips)
     */
    sellItem(gameState: GameState, itemId: string): GameState {
        const adv = { ...gameState.adventurer };
        const itemIndex = adv.backpack.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1) throw new Error("Item not found in backpack. Equip items must be unequipped to sell.");

        const item = adv.backpack[itemIndex];
        const sellValue = Math.max(0, (item.value || 0) - ((item.fix || 0) * (item.damagePips || 0)));

        adv.backpack = adv.backpack.filter(i => i.id !== itemId);
        adv.gold += sellValue;

        return { ...gameState, adventurer: adv };
    }

    /**
     * Step 5: Buy Needed Items (Optional)
     * Limit: 20 + Rep
     */
    buyNeededItem(gameState: GameState, itemName: string): GameState {
        const tableN = this.tableService.getTableN();
        const needed = tableN.find(n => n.name === itemName);
        if (!needed) throw new Error("Item not available in Needed Items.");

        if (gameState.adventurer.gold < needed.value) throw new Error("Not enough gold.");

        // Check limit (simplified, tracking daily purchases might need more state)
        
        const adv = { ...gameState.adventurer };
        adv.gold -= needed.value;
        
        // Handle special items that don't go to backpack but increment counters
        if (itemName === "Food") adv.food += 1;
        else if (itemName === "Oil") adv.oil += 1;
        else if (itemName === "Lockpicks") adv.picks += 1;
        else {
            adv.backpack.push({
                id: crypto.randomUUID(),
                name: itemName,
                value: needed.value,
                fix: Math.ceil(needed.value * 0.1),
                damagePips: 0,
                bonus: 0,
                twoHanded: false,
                usable: itemName === "Bandage" || itemName === "Holy Water"
            });
        }

        return { ...gameState, adventurer: adv };
    }

    /**
     * Step 6: Search Market (Optional)
     * Roll on Tables A, W, T (O tables)
     */
    buyMarketItem(gameState: GameState, table: "A" | "W", roll: number): GameState {
        const itemData = table === "A" ? this.tableService.getTableA(roll) : this.tableService.getTableW(roll);
        
        if (gameState.adventurer.gold < (itemData.value || 0)) throw new Error("Not enough gold.");

        const adv = { ...gameState.adventurer };
        adv.gold -= (itemData.value || 0);
        adv.backpack.push({
            id: crypto.randomUUID(),
            name: itemData.name,
            value: itemData.value || 0,
            fix: itemData.fix || 0,
            bonus: itemData.bonus || 0,
            damage: itemData.damage,
            damagePips: 0,
            twoHanded: itemData.name.includes("Great") || itemData.name.includes("Maul") || itemData.name.includes("Bow"),
            usable: false
        });

        return { ...gameState, adventurer: adv };
    }

    /**
     * Step 7: Training (Optional)
     * 200gp for skill pip, 2000gp for primary stat pip, 20000gp for HP.
     */
    train(gameState: GameState, target: string, pips: number): GameState {
        let costPerPip = 200;
        if (["str", "dex", "int"].includes(target.toLowerCase())) costPerPip = 2000;
        if (target.toLowerCase() === "hp") costPerPip = 20000;

        const totalCost = costPerPip * pips;
        if (gameState.adventurer.gold < totalCost) throw new Error("Not enough gold for training.");

        const adv = { ...gameState.adventurer };
        adv.gold -= totalCost;

        if (target.toLowerCase() === "hp") {
            adv.maxHp += pips;
            adv.hp += pips;
        } else if (["str", "dex", "int"].includes(target.toLowerCase())) {
            const stat = target.toLowerCase();
            if (stat === "str") adv.str += pips;
            else if (stat === "dex") adv.dex += pips;
            else if (stat === "int") adv.int += pips;
        } else {
            adv.skills[target] = (adv.skills[target] || 0) + pips;
        }

        return { ...gameState, adventurer: adv };
    }

    /**
     * Step 8: Magic Tuition (Optional)
     * Costs 2000gp per spell pip.
     */
    magicTuition(gameState: GameState, spellName: string, pips: number): GameState {
        const costPerPip = 2000;
        const totalCost = costPerPip * pips;

        if (gameState.adventurer.gold < totalCost) throw new Error("Not enough gold for magic tuition.");

        const adv = { ...gameState.adventurer };
        adv.gold -= totalCost;
        adv.spells[spellName] = (adv.spells[spellName] || 0) + pips;

        return { ...gameState, adventurer: adv };
    }

    /**
     * Step 9: Empire Building (Required with Shares)
     */
    processInvestments(gameState: GameState, rolls: Record<string, number>): GameState {
        const adv = { ...gameState.adventurer };
        const report: string[] = [];

        for (const [invName, roll] of Object.entries(rolls)) {
            const investment = adv.investments[invName];
            if (!investment || investment.shares === 0) continue;

            const result = this.tableService.getTableJ(roll);
            const totalChange = result.change * investment.shares;
            
            let newPips = investment.pips + totalChange;
            let newShares = investment.shares;

            while (newPips >= 5) {
                newShares += 1;
                newPips -= 5;
            }
            while (newPips < 0 && newShares > 0) {
                newShares -= 1;
                newPips += 5;
            }
            if (newShares === 0 && newPips < 0) newPips = 0;

            adv.investments[invName] = { shares: Math.min(10, newShares), pips: newPips };
            report.push(`${invName}: ${result.name} (${totalChange > 0 ? "+" : ""}${totalChange} pips)`);
        }

        return { ...gameState, adventurer: adv };
    }
}
