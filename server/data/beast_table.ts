/**
 * Table Y – Beast Mastery (Book 4: Lost Tome of Extraordinary Rules)
 *
 * Beasts can be bought at the market (table Y shows as "O") or tamed when
 * encountered on a quest.  All beasts start at level 1.
 */

export interface BeastEntry {
  minRoll: number;
  maxRoll: number;
  name: string;
  /** Abilities available to the beast */
  abilities: string[];
  /** Base HP at level 1 */
  hp: number;
  /** Beast Bonus (applied to TAME/TRAIN tests) – can be negative */
  bonus: number;
  /** Gold-piece value per level */
  gpPerLevel: number;
  /** Whether this beast is found on the encounter table (can be tamed in combat) */
  encounterTable?: "E" | "EA";
}

export const BEAST_TABLE: BeastEntry[] = [
  { minRoll: 1,  maxRoll: 10, name: "Giant Rat",       abilities: ["Confuse","Guide"],               hp: 8,  bonus: 0,   gpPerLevel: 300, encounterTable: "E" },
  { minRoll: 11, maxRoll: 20, name: "Hunting Dog",     abilities: ["Guard","Guide"],                 hp: 8,  bonus: 0,   gpPerLevel: 300 },
  { minRoll: 21, maxRoll: 30, name: "Giant Bat",       abilities: ["Confuse","Lure"],                hp: 8,  bonus: 0,   gpPerLevel: 300, encounterTable: "E" },
  { minRoll: 31, maxRoll: 35, name: "Eagle",           abilities: ["Lure","Strike"],                 hp: 8,  bonus: 0,   gpPerLevel: 300 },
  { minRoll: 36, maxRoll: 40, name: "Giant Spider",    abilities: ["Poison","Webbing"],              hp: 8,  bonus: 0,   gpPerLevel: 300, encounterTable: "E" },
  { minRoll: 41, maxRoll: 45, name: "Wolf",            abilities: ["Guard","Trick"],                 hp: 8,  bonus: 0,   gpPerLevel: 300 },
  { minRoll: 46, maxRoll: 50, name: "Mountain Lion",   abilities: ["Guard","Roar"],                  hp: 8,  bonus: 0,   gpPerLevel: 300, encounterTable: "EA" },
  { minRoll: 51, maxRoll: 55, name: "Bear",            abilities: ["Guide","Mighty","Roar"],         hp: 10, bonus: -5,  gpPerLevel: 600, encounterTable: "E" },
  { minRoll: 56, maxRoll: 60, name: "Tiger",           abilities: ["Confuse","Roar","Trick"],        hp: 10, bonus: -5,  gpPerLevel: 600 },
  { minRoll: 61, maxRoll: 65, name: "Giant Boar",      abilities: ["Attack","Mighty","Stun"],        hp: 10, bonus: -5,  gpPerLevel: 600, encounterTable: "EA" },
  { minRoll: 66, maxRoll: 70, name: "Giant Wasp",      abilities: ["Lure","Poison","Stun"],          hp: 10, bonus: -5,  gpPerLevel: 600, encounterTable: "EA" },
  { minRoll: 71, maxRoll: 75, name: "Giant Moth",      abilities: ["Lure","Trick","Webbing"],        hp: 10, bonus: -5,  gpPerLevel: 600, encounterTable: "EA" },
  { minRoll: 76, maxRoll: 80, name: "Giant Crab",      abilities: ["Attack","Guard","Mighty"],       hp: 10, bonus: -5,  gpPerLevel: 600, encounterTable: "EA" },
  { minRoll: 81, maxRoll: 85, name: "Dire Wolf",       abilities: ["Confuse","Guide","Strike"],      hp: 12, bonus: -10, gpPerLevel: 900, encounterTable: "EA" },
  { minRoll: 86, maxRoll: 90, name: "Giant Ape",       abilities: ["Mighty","Roar","Strike","Stun"], hp: 12, bonus: -10, gpPerLevel: 1200, encounterTable: "E" },
  { minRoll: 91, maxRoll: 93, name: "Giant Snake",     abilities: ["Attack","Poison","Stun","Trick"],hp: 12, bonus: -10, gpPerLevel: 1200, encounterTable: "E" },
  { minRoll: 94, maxRoll: 95, name: "Giant Scorpion",  abilities: ["Confuse","Poison","Strike","Stun"], hp: 12, bonus: -10, gpPerLevel: 1200, encounterTable: "EA" },
  { minRoll: 96, maxRoll: 97, name: "Hell Hound",      abilities: ["Attack","Guard","Roar","Trick"], hp: 12, bonus: -10, gpPerLevel: 1200, encounterTable: "EA" },
  { minRoll: 98, maxRoll: 99, name: "Griffon",         abilities: ["Attack","Lure","Mighty","Stun"], hp: 14, bonus: -15, gpPerLevel: 2400, encounterTable: "EA" },
  { minRoll: 100,maxRoll: 100,name: "Dragon Hatchling",abilities: ["Lure"],                          hp: 16, bonus: -20, gpPerLevel: 5000 },
];

/**
 * Dragon Hatchling abilities unlock by level:
 * 1→Lure, 2→Guard, 3→Trick, 4→Guide, 5→Attack, 6→Roar, 7→Strike, 8→Mighty, 9→Confuse, 10→Resurrection
 */
export const DRAGON_LEVEL_ABILITIES: Record<number, string> = {
  1: "Lure", 2: "Guard", 3: "Trick", 4: "Guide", 5: "Attack",
  6: "Roar", 7: "Strike", 8: "Mighty", 9: "Confuse", 10: "Resurrection",
};

/** Descriptions of each beast ability */
export const BEAST_ABILITIES: Record<string, string> = {
  Attack:      "At the start of a combat round, deal 4 HP of damage to the monster.",
  Confuse:     "The monster's Attacks ability is reduced by 1 point for the next combat round.",
  Guard:       "The adventurer gains +10 to their Dodge skill for their next test.",
  Guide:       "The adventurer gains +10 to their Aware skill for their next test.",
  Lure:        "The adventurer ignores a monster's Fly ability for the next combat round.",
  Mighty:      "The adventurer gains +10 to their Strong skill for their next test.",
  Poison:      "The monster is poisoned and suffers -2 Dmg penalty for the rest of this combat.",
  Resurrection:"The dragon may sacrifice one of its hearts to bring the adventurer back to life.",
  Roar:        "The adventurer gains +10 to their Bravery skill for their next test.",
  Strike:      "The adventurer gains +X Dmg on their next damage roll (X = beast level).",
  Stun:        "The monster does not get to escape or attack during the next combat round.",
  Trick:       "The adventurer gains +10 to their Escape skill for their next test.",
  Webbing:     "The monster suffers -10 AV and the adventurer gains +10 to their next attack roll.",
};

/** Look up a beast entry by d100 roll (1-100) */
export function getBeastByRoll(roll: number): BeastEntry | undefined {
  return BEAST_TABLE.find(e => roll >= e.minRoll && roll <= e.maxRoll);
}

/** Look up a beast entry by name */
export function getBeastByName(name: string): BeastEntry | undefined {
  return BEAST_TABLE.find(e => e.name.toLowerCase() === name.toLowerCase());
}
