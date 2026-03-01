import { Room } from "../models/room.ts";
import { Monster } from "../models/monster.ts";

export interface Loot {
  name: string;
  value?: number;
  type?: string;
  damage?: string;
  bonus?: number;
  fix?: number;
}

export interface TableService {
  getTableM(roll: number): Room;
  getTableE(roll: number): Monster;
  getTableL(roll: number): Loot; // Loot
  getTableS(roll: number): Loot; // Scavenge
  getTableW(roll: number): Loot; // Weapons
  getTableA(roll: number): Loot; // Armour
  getTableJ(roll: number): { name: string, change: number }; // Investments
  getTableN(): { name: string, value: number }[]; // Needed Items
  rollMapping(roll: number): Room;
}

export class Book1TableService implements TableService {
  /**
   * Table M - Mapping Table
   * Deterministic generation of rooms based on d100 roll.
   */
  getTableM(roll: number): Room {
    if (roll === 100) {
      return {
        color: "red",
        exits: 4,
        features: ["Special Room"],
      };
    }

    // Deterministic logic for other results (Simplified for now)
    // Red rooms are generally bad/hollow, Green good/nature, Blue neutral?
    // Rules don't specify color meaning strictly without the table, but we need
    // to return *something* structural.

    // Example logic based on ranges (placeholder for real table data):
    // 01-25: Red, 2 exits
    // 26-50: Green, 3 exits
    // 51-75: Blue, 2 exits
    // 76-99: Yellow, 4 exits

    if (roll <= 25) return { color: "red", exits: 2, features: [] };
    if (roll <= 50) return { color: "green", exits: 3, features: [] };
    if (roll <= 75) return { color: "blue", exits: 2, features: [] };
    return { color: "yellow", exits: 4, features: [] };
  }

  /**
   * Table E - Encounter Table
   * Simplified JSON lookup for 01-100.
   */
  getTableE(roll: number): Monster {
    // Simplified lookup. In a real app this might be a large JSON file.
    // For now we map ranges or specific numbers.

    const mk = (name: string, av: number, def: number, hp: number, dmgModifier = 0): Monster => ({
      name, av, def, dmgModifier, hpValues: [hp], lootTable: "", abilities: [], isUndead: false, isDaemonic: false,
      get hp() { return this.hpValues.reduce((s: number, v: number) => s + Math.max(0, v), 0); },
    });
    if (roll <= 10) {
      return mk("Rat", 5, 0, 2);
    } else if (roll <= 20) {
      return mk("Goblin", 10, 0, 4);
    } else if (roll <= 30) {
      return mk("Skeleton", 10, 0, 4, 0);
    } else if (roll <= 40) {
      return mk("Orc", 15, 0, 6);
    } else if (roll <= 50) {
      return mk("Zombie", 10, 0, 6);
    } else if (roll <= 60) {
      return mk("Spider", 15, 0, 4);
    } else if (roll <= 70) {
      return mk("Troll", 20, 0, 10);
    } else if (roll <= 80) {
      return mk("Minotaur", 25, 0, 12);
    } else if (roll <= 90) {
      return mk("Dragon", 40, 10, 20);
    } else {
      return mk("Demon", 50, 10, 25);
    }
  }
  getTableL(roll: number): Loot {
    // Placeholder for Loot Table L
    if (roll <= 50) return { name: "Gold Coins", value: Math.floor(Math.random() * 20) + 1 };
    if (roll <= 80) return { name: "Minor Potion", type: "Healing" };
    return { name: "Steel Sword", type: "Weapon", damage: "1d8", bonus: 1 };
  }

  getTableS(roll: number): Loot {
    // Placeholder for Scavenge Table S
    if (roll <= 40) return { name: "Nothing", value: 0 };
    if (roll <= 70) return { name: "Loose Coins", value: Math.floor(Math.random() * 5) + 1 };
    return { name: "Scrap Metal", value: 2 };
  }

  getTableW(roll: number): Loot {
    if (roll <= 2) return { name: "Sling", damage: "-2", type: "Ranged", value: 12 };
    if (roll <= 4) return { name: "Catapult", damage: "-2", type: "Ranged", value: 15 };
    if (roll <= 6) return { name: "Baton", damage: "-2", type: "Hand", value: 23 };
    if (roll <= 8) return { name: "Stave", damage: "-2", type: "Hand", value: 32 };
    if (roll <= 10) return { name: "Knife", damage: "-2", type: "Hand", value: 44 };
    if (roll <= 12) return { name: "Club", damage: "-1", type: "Hand", value: 50 };
    if (roll <= 14) return { name: "Quarterstaff", damage: "-1", type: "Hand", value: 51 };
    if (roll <= 16) return { name: "Throwing Knife", damage: "-1", type: "Hand/Ranged", value: 54 };
    if (roll <= 18) return { name: "Dagger", damage: "-1", type: "Hand", value: 54 };
    if (roll <= 20) return { name: "Spiked Club", damage: "+0", type: "Hand", value: 57 };
    if (roll <= 22) return { name: "Hammer", damage: "+0", type: "Hand", value: 60 };
    if (roll <= 24) return { name: "Throwing Spear", damage: "+0", type: "Hand/Ranged", value: 66 };
    if (roll <= 26) return { name: "Short Bow", damage: "+0", type: "Ranged", value: 67 };
    if (roll <= 28) return { name: "War Pick", damage: "+0", type: "Hand", value: 68 };
    if (roll <= 30) return { name: "Short Sword", damage: "+0", type: "Hand", value: 70 };
    if (roll <= 32) return { name: "Scimitar", damage: "+0", type: "Hand", value: 73 };
    if (roll <= 34) return { name: "Rapier", damage: "+0", type: "Hand", value: 75 };
    if (roll <= 36) return { name: "Scythe", damage: "+0", type: "Hand", value: 75 };
    if (roll <= 38) return { name: "Mace", damage: "+0", type: "Hand", value: 78 };
    if (roll <= 40) return { name: "Throwing Axe", damage: "+0", type: "Hand/Ranged", value: 87 };
    if (roll <= 42) return { name: "Chakram", damage: "+0", type: "Hand/Ranged", value: 89 };
    if (roll <= 44) return { name: "Repeating Crossbow", damage: "+0", type: "Ranged", value: 94 };
    if (roll <= 46) return { name: "Lance", damage: "+1", type: "Hand", value: 123 };
    if (roll <= 48) return { name: "Spear", damage: "+1", type: "Hand/Ranged", value: 132 };
    if (roll <= 50) return { name: "Half Maul", damage: "+1", type: "Hand", value: 134 };
    if (roll <= 52) return { name: "Falchion", damage: "+1", type: "Hand", value: 143 };
    if (roll <= 54) return { name: "Bow", damage: "+1", type: "Ranged", value: 146 };
    if (roll <= 56) return { name: "Axe", damage: "+1", type: "Hand", value: 165 };
    if (roll <= 58) return { name: "Morning Star", damage: "+1", type: "Hand", value: 167 };
    if (roll <= 60) return { name: "Broadsword", damage: "+1", type: "Hand", value: 178 };
    if (roll <= 62) return { name: "Pernach", damage: "+1", type: "Hand", value: 178 };
    if (roll <= 64) return { name: "Military Fork", damage: "+1", type: "Hand", value: 187 };
    if (roll <= 66) return { name: "Partisan", damage: "+1", type: "Hand", value: 189 };
    if (roll <= 68) return { name: "Glaive", damage: "+1", type: "Hand", value: 190 };
    if (roll <= 70) return { name: "Halberd", damage: "+2", type: "Hand", value: 234 };
    if (roll <= 72) return { name: "Bill", damage: "+2", type: "Hand", value: 236 };
    if (roll <= 74) return { name: "Two Handed Flail", damage: "+2", type: "Hand", value: 243 };
    if (roll <= 76) return { name: "Recurve Bow", damage: "+2", type: "Ranged", value: 256 };
    if (roll <= 78) return { name: "Maul", damage: "+2", type: "Hand", value: 265 };
    if (roll <= 80) return { name: "War Scythe", damage: "+2", type: "Hand", value: 266 };
    if (roll <= 82) return { name: "Bardiche", damage: "+2", type: "Hand", value: 267 };
    if (roll <= 84) return { name: "Long Sword", damage: "+2", type: "Hand", value: 278 };
    if (roll <= 86) return { name: "Battle Axe", damage: "+2", type: "Hand", value: 287 };
    if (roll <= 88) return { name: "Claymore", damage: "+2", type: "Hand", value: 290 };
    if (roll <= 90) return { name: "Crossbow", damage: "+2", type: "Ranged", value: 298 };
    if (roll <= 92) return { name: "War Hammer", damage: "+3", type: "Hand", value: 367 };
    if (roll <= 94) return { name: "Arbalest", damage: "+3", type: "Ranged", value: 367 };
    if (roll <= 96) return { name: "Long Bow", damage: "+3", type: "Ranged", value: 378 };
    if (roll <= 98) return { name: "Bastard Sword", damage: "+3", type: "Hand", value: 378 };
    return { name: "Great Sword", damage: "+4", type: "Hand", value: 420 };
  }

  getTableA(roll: number): Loot {
    if (roll <= 4) return { name: "Leather Boots", type: "Feet", bonus: 0, value: 67, fix: 7 };
    if (roll <= 8) return { name: "Leather Tasset", type: "Legs", bonus: 0, value: 68, fix: 7 };
    if (roll <= 12) return { name: "Leather Girdle", type: "Waist", bonus: 0, value: 70, fix: 7 };
    if (roll <= 16) return { name: "Buckler Shield", type: "OffHand", bonus: 0, value: 79, fix: 8 };
    if (roll <= 20) return { name: "Leather Gauntlets", type: "Hands", bonus: 0, value: 73, fix: 7 };
    if (roll <= 24) return { name: "Leather Arm Guards", type: "Arms", bonus: 0, value: 66, fix: 7 };
    if (roll <= 28) return { name: "Leather Cuirass", type: "Torso", bonus: 0, value: 78, fix: 8 };
    if (roll <= 32) return { name: "Leather Cloak", type: "Back", bonus: 0, value: 67, fix: 7 };
    if (roll <= 36) return { name: "Leather Cap", type: "Head", bonus: 0, value: 75, fix: 8 };
    if (roll <= 39) return { name: "Studded Leather Sollerets", type: "Feet", bonus: 1, value: 87, fix: 9 };
    if (roll <= 42) return { name: "Studded Leather Chausses", type: "Legs", bonus: 1, value: 89, fix: 9 };
    if (roll <= 45) return { name: "Studded Leather Belt", type: "Waist", bonus: 1, value: 94, fix: 9 };
    if (roll <= 48) return { name: "Targe Shield", type: "OffHand", bonus: 1, value: 123, fix: 12 };
    if (roll <= 51) return { name: "Studded Leather Gloves", type: "Hands", bonus: 1, value: 97, fix: 10 };
    if (roll <= 54) return { name: "Studded Leather Bracers", type: "Arms", bonus: 1, value: 83, fix: 8 };
    if (roll <= 56) return { name: "Studded Leather Brigandine", type: "Torso", bonus: 1, value: 123, fix: 12 };
    if (roll <= 58) return { name: "Studded Leather Cape", type: "Back", bonus: 1, value: 87, fix: 9 };
    if (roll <= 60) return { name: "Studded Leather Helmet", type: "Head", bonus: 1, value: 104, fix: 10 };
    if (roll <= 62) return { name: "Mail Sabatons", type: "Feet", bonus: 2, value: 143, fix: 14 };
    if (roll <= 64) return { name: "Mail Cuisse", type: "Legs", bonus: 2, value: 146, fix: 15 };
    if (roll <= 66) return { name: "Padded Mail Belt", type: "Waist", bonus: 2, value: 165, fix: 17 };
    if (roll <= 68) return { name: "Heater Shield", type: "OffHand", bonus: 2, value: 189, fix: 19 };
    if (roll <= 70) return { name: "Mail Handwraps", type: "Hands", bonus: 2, value: 167, fix: 17 };
    if (roll <= 72) return { name: "Mail Sleeves", type: "Arms", bonus: 2, value: 134, fix: 13 };
    if (roll <= 74) return { name: "Mail Shirt", type: "Torso", bonus: 2, value: 187, fix: 19 };
    if (roll <= 76) return { name: "Mail Coif", type: "Head", bonus: 2, value: 178, fix: 18 };
    if (roll <= 78) return { name: "Scale Mail Boot", type: "Feet", bonus: 3, value: 190, fix: 19 };
    if (roll <= 80) return { name: "Scale Mail Poleyn", type: "Legs", bonus: 3, value: 236, fix: 24 };
    if (roll <= 82) return { name: "Scale Mail Fauld", type: "Waist", bonus: 3, value: 243, fix: 24 };
    if (roll <= 84) return { name: "Kite Shield", type: "OffHand", bonus: 3, value: 267, fix: 27 };
    if (roll <= 86) return { name: "Scale Mail Gloves", type: "Hands", bonus: 3, value: 256, fix: 26 };
    if (roll <= 88) return { name: "Scale Mail Vambrace", type: "Arms", bonus: 3, value: 234, fix: 23 };
    if (roll <= 90) return { name: "Scale Mail Hauberk", type: "Torso", bonus: 3, value: 266, fix: 27 };
    if (roll <= 92) return { name: "Scale Mail Armet", type: "Head", bonus: 3, value: 265, fix: 27 };
    if (roll === 93) return { name: "Plate Mail Sabatons", type: "Feet", bonus: 4, value: 287, fix: 29 };
    if (roll === 94) return { name: "Plate Mail Greaves", type: "Legs", bonus: 4, value: 290, fix: 29 };
    if (roll === 95) return { name: "Plate Mail Girdle", type: "Waist", bonus: 4, value: 298, fix: 30 };
    if (roll === 96) return { name: "Pavise Shield", type: "OffHand", bonus: 4, value: 467, fix: 47 };
    if (roll === 97) return { name: "Plate Mail Manifers", type: "Hands", bonus: 4, value: 367, fix: 37 };
    if (roll === 98) return { name: "Plate Mail Bracers", type: "Arms", bonus: 4, value: 278, fix: 28 };
    if (roll === 99) return { name: "Plate Mail Breastplate", type: "Torso", bonus: 4, value: 420, fix: 42 };
    return { name: "Plate Mail Great Helm", type: "Head", bonus: 4, value: 378, fix: 38 };
  }

  getTableJ(roll: number): { name: string, change: number } {
    if (roll <= 10) return { name: "Major Crash", change: -4 };
    if (roll <= 20) return { name: "Slump", change: -3 };
    if (roll <= 30) return { name: "Downturn", change: -2 };
    if (roll <= 40) return { name: "Minor Loss", change: -1 };
    if (roll <= 60) return { name: "Stable Market", change: 0 };
    if (roll <= 70) return { name: "Minor Gain", change: 1 };
    if (roll <= 80) return { name: "Growth", change: 2 };
    if (roll <= 90) return { name: "Bull Market", change: 3 };
    return { name: "Major Boom", change: 4 };
  }

  getTableN(): { name: string, value: number }[] {
    return [
      { name: "Food", value: 5 },
      { name: "Oil", value: 10 },
      { name: "Lockpicks", value: 15 },
      { name: "Bandage", value: 12 },
      { name: "Holy Water", value: 100 },
      { name: "Lantern", value: 100 },
      { name: "Small Sack", value: 10 },
      { name: "Large Sack", value: 25 },
      { name: "Backpack", value: 50 },
    ];
  }

  rollMapping(roll: number): Room {
    return this.getTableM(roll);
  }
}
