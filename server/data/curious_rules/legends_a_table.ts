// LA – LEGENDS A TABLE (Book 8: The Forgotten Tome of Curious Rules)
// Roll on this table in preference to Table L – Legends.
// Value and fix costs are ADDED to the item's base cost.

export interface LegendAEntry {
  roll: number;
  name: string;
  /** Name substitution when using Spell Mana rules (HP effect → MP effect) */
  manaName?: string;
  /** Characteristic adjustment (e.g. "+10 Int") */
  adjustment: string;
  /** Parsed numeric adjustments for service logic */
  adjustments: {
    str?: number;
    dex?: number;
    int?: number;
    hp?: number;
    dmg?: number;
    def?: number;
    /** Spell imbued into item — roll on Table S */
    spell?: true;
  };
  /** GP added to item's base value */
  valueBonus: number;
  /** GP added to item's fix cost */
  fixBonus: number;
}

export const LEGENDS_A_TABLE: LegendAEntry[] = [
  { roll: 1,   name: "LEGEND of the Cloud",      adjustment: "+1 Int",   adjustments: { int: 1  }, valueBonus: 150,  fixBonus: 30  },
  { roll: 2,   name: "LEGEND of the Beetle",     adjustment: "+1 Str",   adjustments: { str: 1  }, valueBonus: 150,  fixBonus: 30  },
  { roll: 3,   name: "LEGEND of the Squirrel",   adjustment: "+1 Dex",   adjustments: { dex: 1  }, valueBonus: 150,  fixBonus: 30  },
  { roll: 4,   name: "LEGEND of the Rain",       adjustment: "+2 Int",   adjustments: { int: 2  }, valueBonus: 300,  fixBonus: 60  },
  { roll: 5,   name: "LEGEND of the Pig",        adjustment: "+2 Str",   adjustments: { str: 2  }, valueBonus: 300,  fixBonus: 60  },
  { roll: 6,   name: "LEGEND of the Frog",       adjustment: "+2 Dex",   adjustments: { dex: 2  }, valueBonus: 300,  fixBonus: 60  },
  { roll: 7,   name: "LEGEND of the Cyclops",    adjustment: "+1 Dmg",   adjustments: { dmg: 1  }, valueBonus: 300,  fixBonus: 60  },
  { roll: 8,   name: "LEGEND of the Knight",     manaName: "Charmer",    adjustment: "+1 HP",    adjustments: { hp: 1   }, valueBonus: 400,  fixBonus: 80  },
  { roll: 9,   name: "LEGEND of the Wind",       adjustment: "+3 Int",   adjustments: { int: 3  }, valueBonus: 450,  fixBonus: 90  },
  { roll: 10,  name: "LEGEND of the Bull",       adjustment: "+3 Str",   adjustments: { str: 3  }, valueBonus: 450,  fixBonus: 90  },
  { roll: 11,  name: "LEGEND of the Hare",       adjustment: "+3 Dex",   adjustments: { dex: 3  }, valueBonus: 450,  fixBonus: 90  },
  { roll: 12,  name: "LEGEND of the Crab",       adjustment: "+1 Def",   adjustments: { def: 1  }, valueBonus: 500,  fixBonus: 100 },
  { roll: 13,  name: "LEGEND of the Lightning",  adjustment: "+4 Int",   adjustments: { int: 4  }, valueBonus: 600,  fixBonus: 120 },
  { roll: 14,  name: "LEGEND of the Hog",        adjustment: "+4 Str",   adjustments: { str: 4  }, valueBonus: 600,  fixBonus: 120 },
  { roll: 15,  name: "LEGEND of the Rabbit",     adjustment: "+4 Dex",   adjustments: { dex: 4  }, valueBonus: 600,  fixBonus: 120 },
  { roll: 16,  name: "LEGEND of the Goliath",    adjustment: "+2 Dmg",   adjustments: { dmg: 2  }, valueBonus: 600,  fixBonus: 120 },
  { roll: 17,  name: "LEGEND of the Sky",        adjustment: "+5 Int",   adjustments: { int: 5  }, valueBonus: 750,  fixBonus: 150 },
  { roll: 18,  name: "LEGEND of the Bear",       adjustment: "+5 Str",   adjustments: { str: 5  }, valueBonus: 750,  fixBonus: 150 },
  { roll: 19,  name: "LEGEND of the Spider",     adjustment: "+5 Dex",   adjustments: { dex: 5  }, valueBonus: 750,  fixBonus: 150 },
  { roll: 20,  name: "LEGEND of the Prince",     manaName: "Occultist",  adjustment: "+2 HP",    adjustments: { hp: 2   }, valueBonus: 800,  fixBonus: 160 },
  { roll: 21,  name: "LEGEND of the Crow",       adjustment: "+6 Int",   adjustments: { int: 6  }, valueBonus: 900,  fixBonus: 180 },
  { roll: 22,  name: "LEGEND of the Bison",      adjustment: "+6 Str",   adjustments: { str: 6  }, valueBonus: 900,  fixBonus: 180 },
  { roll: 23,  name: "LEGEND of the Fox",        adjustment: "+6 Dex",   adjustments: { dex: 6  }, valueBonus: 900,  fixBonus: 180 },
  { roll: 24,  name: "LEGEND of the Giant",      adjustment: "+3 Dmg",   adjustments: { dmg: 3  }, valueBonus: 900,  fixBonus: 180 },
  { roll: 25,  name: "LEGEND of the Turtle",     adjustment: "+2 Def",   adjustments: { def: 2  }, valueBonus: 1000, fixBonus: 200 },
  { roll: 26,  name: "LEGEND of the Magpie",     adjustment: "+7 Int",   adjustments: { int: 7  }, valueBonus: 1050, fixBonus: 210 },
  { roll: 27,  name: "LEGEND of the Buffalo",    adjustment: "+7 Str",   adjustments: { str: 7  }, valueBonus: 1050, fixBonus: 210 },
  { roll: 28,  name: "LEGEND of the Hyena",      adjustment: "+7 Dex",   adjustments: { dex: 7  }, valueBonus: 1050, fixBonus: 210 },
  { roll: 29,  name: "LEGEND of the Raven",      adjustment: "+8 Int",   adjustments: { int: 8  }, valueBonus: 1200, fixBonus: 240 },
  { roll: 30,  name: "LEGEND of the Warthog",    adjustment: "+8 Str",   adjustments: { str: 8  }, valueBonus: 1200, fixBonus: 240 },
  { roll: 31,  name: "LEGEND of the Jackal",     adjustment: "+8 Dex",   adjustments: { dex: 8  }, valueBonus: 1200, fixBonus: 240 },
  { roll: 32,  name: "LEGEND of the Colossus",   adjustment: "+4 Dmg",   adjustments: { dmg: 4  }, valueBonus: 1200, fixBonus: 240 },
  { roll: 33,  name: "LEGEND of the Lord",       manaName: "Conjurer",   adjustment: "+3 HP",    adjustments: { hp: 3   }, valueBonus: 1200, fixBonus: 240 },
  { roll: 34,  name: "Roll on Table S – Spells", adjustment: "SPELL",    adjustments: { spell: true }, valueBonus: 1200, fixBonus: 240 },
  { roll: 35,  name: "LEGEND of the Rook",       adjustment: "+9 Int",   adjustments: { int: 9  }, valueBonus: 1350, fixBonus: 270 },
  { roll: 36,  name: "LEGEND of the Fighter",    adjustment: "+9 Str",   adjustments: { str: 9  }, valueBonus: 1350, fixBonus: 270 },
  { roll: 37,  name: "LEGEND of the Wolf",       adjustment: "+9 Dex",   adjustments: { dex: 9  }, valueBonus: 1350, fixBonus: 270 },
  { roll: 38,  name: "LEGEND of the Dragon",     adjustment: "+3 Def",   adjustments: { def: 3  }, valueBonus: 1500, fixBonus: 300 },
  { roll: 39,  name: "LEGEND of the Star",       adjustment: "+10 Int",  adjustments: { int: 10 }, valueBonus: 1500, fixBonus: 300 },
  { roll: 40,  name: "LEGEND of the Ox",         adjustment: "+10 Str",  adjustments: { str: 10 }, valueBonus: 1500, fixBonus: 300 },
  { roll: 41,  name: "LEGEND of the Cobra",      adjustment: "+10 Dex",  adjustments: { dex: 10 }, valueBonus: 1500, fixBonus: 300 },
  { roll: 42,  name: "LEGEND of the Titan",      adjustment: "+5 Dmg",   adjustments: { dmg: 5  }, valueBonus: 1500, fixBonus: 300 },
  { roll: 43,  name: "LEGEND of the Champion",   manaName: "Diviner",    adjustment: "+4 HP",    adjustments: { hp: 4   }, valueBonus: 1600, fixBonus: 320 },
  { roll: 44,  name: "LEGEND of the Comet",      adjustment: "+11 Int",  adjustments: { int: 11 }, valueBonus: 1650, fixBonus: 330 },
  { roll: 45,  name: "LEGEND of the Hero",       adjustment: "+11 Str",  adjustments: { str: 11 }, valueBonus: 1650, fixBonus: 330 },
  { roll: 46,  name: "LEGEND of the Eagle",      adjustment: "+11 Dex",  adjustments: { dex: 11 }, valueBonus: 1650, fixBonus: 330 },
  { roll: 47,  name: "LEGEND of the Orb",        adjustment: "+12 Int",  adjustments: { int: 12 }, valueBonus: 1800, fixBonus: 360 },
  { roll: 48,  name: "LEGEND of the Ape",        adjustment: "+12 Str",  adjustments: { str: 12 }, valueBonus: 1800, fixBonus: 360 },
  { roll: 49,  name: "LEGEND of the Jaguar",     adjustment: "+12 Dex",  adjustments: { dex: 12 }, valueBonus: 1800, fixBonus: 360 },
  { roll: 50,  name: "LEGEND of the Basilisk",   adjustment: "+6 Dmg",   adjustments: { dmg: 6  }, valueBonus: 1800, fixBonus: 360 },
  { roll: 51,  name: "LEGEND of the Asteroid",   adjustment: "+13 Int",  adjustments: { int: 13 }, valueBonus: 1950, fixBonus: 390 },
  { roll: 52,  name: "LEGEND of the Leopard",    adjustment: "+13 Str",  adjustments: { str: 13 }, valueBonus: 1950, fixBonus: 390 },
  { roll: 53,  name: "LEGEND of the Tiger",      adjustment: "+13 Dex",  adjustments: { dex: 13 }, valueBonus: 1950, fixBonus: 390 },
  { roll: 54,  name: "LEGEND of the Tortoise",   adjustment: "+4 Def",   adjustments: { def: 4  }, valueBonus: 2000, fixBonus: 400 },
  { roll: 55,  name: "LEGEND of the Gladiator",  manaName: "Crone",      adjustment: "+5 HP",    adjustments: { hp: 5   }, valueBonus: 2000, fixBonus: 400 },
  { roll: 56,  name: "LEGEND of the Zodiac",     adjustment: "+14 Int",  adjustments: { int: 14 }, valueBonus: 2100, fixBonus: 420 },
  { roll: 57,  name: "LEGEND of the Walrus",     adjustment: "+14 Str",  adjustments: { str: 14 }, valueBonus: 2100, fixBonus: 420 },
  { roll: 58,  name: "LEGEND of the Crocodile",  adjustment: "+14 Dex",  adjustments: { dex: 14 }, valueBonus: 2100, fixBonus: 420 },
  { roll: 59,  name: "LEGEND of the Leviathan",  adjustment: "+7 Dmg",   adjustments: { dmg: 7  }, valueBonus: 2100, fixBonus: 420 },
  { roll: 60,  name: "LEGEND of the Moon",       adjustment: "+15 Int",  adjustments: { int: 15 }, valueBonus: 2250, fixBonus: 450 },
  { roll: 61,  name: "LEGEND of the Gorilla",    adjustment: "+15 Str",  adjustments: { str: 15 }, valueBonus: 2250, fixBonus: 450 },
  { roll: 62,  name: "LEGEND of the Scorpion",   adjustment: "+15 Dex",  adjustments: { dex: 15 }, valueBonus: 2250, fixBonus: 450 },
  { roll: 63,  name: "LEGEND of the Sage",       adjustment: "+16 Int",  adjustments: { int: 16 }, valueBonus: 2400, fixBonus: 280 },
  { roll: 64,  name: "LEGEND of the Mercenary",  adjustment: "+16 Str",  adjustments: { str: 16 }, valueBonus: 2400, fixBonus: 280 },
  { roll: 65,  name: "LEGEND of the Snake",      adjustment: "+16 Dex",  adjustments: { dex: 16 }, valueBonus: 2400, fixBonus: 280 },
  { roll: 66,  name: "LEGEND of the King",       manaName: "Seer",       adjustment: "+6 HP",    adjustments: { hp: 6   }, valueBonus: 2400, fixBonus: 480 },
  { roll: 67,  name: "LEGEND of the Drake",      adjustment: "+5 Def",   adjustments: { def: 5  }, valueBonus: 2500, fixBonus: 500 },
  { roll: 68,  name: "LEGEND of the Druid",      adjustment: "+17 Int",  adjustments: { int: 17 }, valueBonus: 2550, fixBonus: 510 },
  { roll: 69,  name: "LEGEND of the Whale",      adjustment: "+17 Str",  adjustments: { str: 17 }, valueBonus: 2550, fixBonus: 510 },
  { roll: 70,  name: "LEGEND of the Monkey",     adjustment: "+17 Dex",  adjustments: { dex: 17 }, valueBonus: 2550, fixBonus: 510 },
  { roll: 71,  name: "LEGEND of the Acolyte",    adjustment: "+18 Int",  adjustments: { int: 18 }, valueBonus: 2700, fixBonus: 540 },
  { roll: 72,  name: "LEGEND of the Barbarian",  adjustment: "+18 Str",  adjustments: { str: 18 }, valueBonus: 2700, fixBonus: 540 },
  { roll: 73,  name: "LEGEND of the Serpent",    adjustment: "+18 Dex",  adjustments: { dex: 18 }, valueBonus: 2700, fixBonus: 540 },
  { roll: 74,  name: "LEGEND of the Emperor",    manaName: "Hag",        adjustment: "+7 HP",    adjustments: { hp: 7   }, valueBonus: 2800, fixBonus: 560 },
  { roll: 75,  name: "LEGEND of the Heaven",     adjustment: "+19 Int",  adjustments: { int: 19 }, valueBonus: 2850, fixBonus: 570 },
  { roll: 76,  name: "LEGEND of the Warrior",    adjustment: "+19 Str",  adjustments: { str: 19 }, valueBonus: 2850, fixBonus: 570 },
  { roll: 77,  name: "LEGEND of the Serpent",    adjustment: "+19 Dex",  adjustments: { dex: 19 }, valueBonus: 2850, fixBonus: 570 },
  { roll: 78,  name: "LEGEND of the Sun",        adjustment: "+20 Int",  adjustments: { int: 20 }, valueBonus: 3000, fixBonus: 600 },
  { roll: 79,  name: "LEGEND of the Lion",       adjustment: "+20 Str",  adjustments: { str: 20 }, valueBonus: 3000, fixBonus: 600 },
  { roll: 80,  name: "LEGEND of the Cheetah",    adjustment: "+20 Dex",  adjustments: { dex: 20 }, valueBonus: 3000, fixBonus: 600 },
  { roll: 81,  name: "LEGEND of the Warlock",    adjustment: "+21 Int",  adjustments: { int: 21 }, valueBonus: 3150, fixBonus: 630 },
  { roll: 82,  name: "LEGEND of the Rhino",      adjustment: "+21 Str",  adjustments: { str: 21 }, valueBonus: 3150, fixBonus: 630 },
  { roll: 83,  name: "LEGEND of the Scoundrel",  adjustment: "+21 Dex",  adjustments: { dex: 21 }, valueBonus: 3150, fixBonus: 630 },
  { roll: 84,  name: "LEGEND of the Sultan",     manaName: "Witch",      adjustment: "+8 HP",    adjustments: { hp: 8   }, valueBonus: 3200, fixBonus: 640 },
  { roll: 85,  name: "LEGEND of the Sorcerer",   adjustment: "+22 Int",  adjustments: { int: 22 }, valueBonus: 3300, fixBonus: 660 },
  { roll: 86,  name: "LEGEND of the Elephant",   adjustment: "+22 Str",  adjustments: { str: 22 }, valueBonus: 3300, fixBonus: 660 },
  { roll: 87,  name: "LEGEND of the Thief",      adjustment: "+22 Dex",  adjustments: { dex: 22 }, valueBonus: 3300, fixBonus: 660 },
  { roll: 88,  name: "LEGEND of the Mage",       adjustment: "+23 Int",  adjustments: { int: 23 }, valueBonus: 3450, fixBonus: 690 },
  { roll: 89,  name: "LEGEND of the Hydra",      adjustment: "+23 Str",  adjustments: { str: 23 }, valueBonus: 3450, fixBonus: 690 },
  { roll: 90,  name: "LEGEND of the Pirate",     adjustment: "+23 Dex",  adjustments: { dex: 23 }, valueBonus: 3450, fixBonus: 690 },
  { roll: 91,  name: "LEGEND of the Enchanter",  adjustment: "+24 Int",  adjustments: { int: 24 }, valueBonus: 3600, fixBonus: 720 },
  { roll: 92,  name: "LEGEND of the Mammoth",    adjustment: "+24 Str",  adjustments: { str: 24 }, valueBonus: 3600, fixBonus: 720 },
  { roll: 93,  name: "LEGEND of the Ninja",      adjustment: "+24 Dex",  adjustments: { dex: 24 }, valueBonus: 3600, fixBonus: 720 },
  { roll: 94,  name: "LEGEND of the God",        manaName: "Magus",      adjustment: "+9 HP",    adjustments: { hp: 9   }, valueBonus: 3600, fixBonus: 720 },
  { roll: 95,  name: "LEGEND of the Wizard",     adjustment: "+25 Int",  adjustments: { int: 25 }, valueBonus: 3750, fixBonus: 750 },
  { roll: 96,  name: "LEGEND of the Kraken",     adjustment: "+25 Str",  adjustments: { str: 25 }, valueBonus: 3750, fixBonus: 750 },
  { roll: 97,  name: "LEGEND of the Assassin",   adjustment: "+25 Dex",  adjustments: { dex: 25 }, valueBonus: 3750, fixBonus: 750 },
  { roll: 98,  name: "LEGEND of the Goddess",    manaName: "Enchantress",adjustment: "+10 HP",   adjustments: { hp: 10  }, valueBonus: 4000, fixBonus: 800 },
  { roll: 99,  name: "LEGEND of the Phoenix",    manaName: "Magician",   adjustment: "+11 HP",   adjustments: { hp: 11  }, valueBonus: 4400, fixBonus: 880 },
  { roll: 100, name: "LEGEND of the Immortal",   manaName: "Arcanist",   adjustment: "+12 HP",   adjustments: { hp: 12  }, valueBonus: 4800, fixBonus: 960 },
];

/** Look up a Legend A entry by exact d100 roll (1-100) */
export function getLegendA(roll: number): LegendAEntry {
  const entry = LEGENDS_A_TABLE.find((e) => e.roll === roll);
  if (!entry) throw new Error(`Legend A roll must be 1-100, got ${roll}`);
  return entry;
}
