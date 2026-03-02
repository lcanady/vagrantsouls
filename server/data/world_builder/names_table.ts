// (WB) N – NAMES TABLE
// 100 entries with prefix, suffix, person (with quest reward ¢ adjustment), hex name template, mount name

export interface NamesEntry {
  roll: number;
  prefix: string;
  suffix: string;
  /** NPC/person title and quest reward adjustment */
  person: string;
  /** ¢ adjustment to quest reward value from this NPC (0 = no adjustment) */
  personRewardAdj: number;
  /** Hex name template — replace "TERRAIN" with terrain type */
  hexName: string;
  /** ¢ adjustment from this hex name (0 = none) */
  hexRewardAdj: number;
  /** Typical horse/mount name */
  mountName: string;
}

export const NAMES_TABLE: NamesEntry[] = [
  { roll: 1,   prefix: "Air",     suffix: "zin",    person: "King",          personRewardAdj: 8,  hexName: "TERRAIN of Doom",              hexRewardAdj: 0,  mountName: "Aitch" },
  { roll: 2,   prefix: "Amble",   suffix: "zilch",  person: "Queen",         personRewardAdj: 8,  hexName: "TERRAIN of Shadows",           hexRewardAdj: 0,  mountName: "Allegra" },
  { roll: 3,   prefix: "Apple",   suffix: "zerk",   person: "Prince",        personRewardAdj: 7,  hexName: "TERRAIN of Coldness",          hexRewardAdj: 0,  mountName: "Amfortas" },
  { roll: 4,   prefix: "Ash",     suffix: "zen",    person: "Princess",      personRewardAdj: 7,  hexName: "Witches TERRAIN",              hexRewardAdj: 0,  mountName: "Ariadne" },
  { roll: 5,   prefix: "Black",   suffix: "yoke",   person: "Duke",          personRewardAdj: 6,  hexName: "Warlocks TERRAIN",             hexRewardAdj: 0,  mountName: "Artemis" },
  { roll: 6,   prefix: "Blight",  suffix: "yield",  person: "Duchess",       personRewardAdj: 6,  hexName: "TERRAIN of the Wise",          hexRewardAdj: 0,  mountName: "Avasha" },
  { roll: 7,   prefix: "Blue",    suffix: "yew",    person: "Marquess",      personRewardAdj: 5,  hexName: "TERRAIN of the Brave",         hexRewardAdj: 0,  mountName: "Ayla" },
  { roll: 8,   prefix: "Bright",  suffix: "year",   person: "Marchioness",   personRewardAdj: 5,  hexName: "The Fearful TERRAIN",          hexRewardAdj: 0,  mountName: "Black Zephyr" },
  { roll: 9,   prefix: "Clear",   suffix: "wine",   person: "Earl",          personRewardAdj: 4,  hexName: "The Wild TERRAIN",             hexRewardAdj: 0,  mountName: "Blue Eyes" },
  { roll: 10,  prefix: "Cold",    suffix: "wind",   person: "Countess",      personRewardAdj: 4,  hexName: "The Dark TERRAIN",             hexRewardAdj: 0,  mountName: "Brie" },
  { roll: 11,  prefix: "Corn",    suffix: "well",   person: "Viscount",      personRewardAdj: 3,  hexName: "TERRAIN of Madness",           hexRewardAdj: 0,  mountName: "Bullseye" },
  { roll: 12,  prefix: "Cry",     suffix: "wash",   person: "Viscountess",   personRewardAdj: 3,  hexName: "TERRAIN of Folly",             hexRewardAdj: 0,  mountName: "Campino" },
  { roll: 13,  prefix: "Dark",    suffix: "vote",   person: "Baron",         personRewardAdj: 2,  hexName: "TERRAIN of the Gods",          hexRewardAdj: 0,  mountName: "Caper" },
  { roll: 14,  prefix: "Dove",    suffix: "void",   person: "Baroness",      personRewardAdj: 2,  hexName: "Firestorm TERRAIN",            hexRewardAdj: 0,  mountName: "Choice" },
  { roll: 15,  prefix: "Down",    suffix: "view",   person: "Merchant",      personRewardAdj: 2,  hexName: "TERRAIN of Sadness",           hexRewardAdj: 0,  mountName: "Corey" },
  { roll: 16,  prefix: "Drop",    suffix: "vale",   person: "Courtier",      personRewardAdj: 2,  hexName: "Fools TERRAIN",                hexRewardAdj: 0,  mountName: "Count" },
  { roll: 17,  prefix: "Earth",   suffix: "us",     person: "Goldsmith",     personRewardAdj: 2,  hexName: "Broken TERRAIN",               hexRewardAdj: 0,  mountName: "Daggers" },
  { roll: 18,  prefix: "Eel",     suffix: "urn",    person: "Silversmith",   personRewardAdj: 1,  hexName: "The Kind TERRAIN",             hexRewardAdj: 0,  mountName: "Drifter" },
  { roll: 19,  prefix: "Ent",     suffix: "ups",    person: "Lord",          personRewardAdj: 1,  hexName: "TERRAIN of Light",             hexRewardAdj: 0,  mountName: "Dynamite" },
  { roll: 20,  prefix: "Ever",    suffix: "undy",   person: "Lady",          personRewardAdj: 1,  hexName: "TERRAIN of Terror",            hexRewardAdj: 0,  mountName: "Elizabeth" },
  { roll: 21,  prefix: "Fire",    suffix: "tower",  person: "Magnate",       personRewardAdj: 1,  hexName: "The Old TERRAIN",              hexRewardAdj: 0,  mountName: "Elzar" },
  { roll: 22,  prefix: "Fish",    suffix: "top",    person: "Knight",        personRewardAdj: 1,  hexName: "The New TERRAIN",              hexRewardAdj: 0,  mountName: "Etheria" },
  { roll: 23,  prefix: "Fog",     suffix: "ton",    person: "Knave",         personRewardAdj: 1,  hexName: "The Borrowed TERRAIN",         hexRewardAdj: 0,  mountName: "Faith" },
  { roll: 24,  prefix: "Foot",    suffix: "tin",    person: "Warrior",       personRewardAdj: 1,  hexName: "The Frozen TERRAIN",           hexRewardAdj: 0,  mountName: "Fastfire" },
  { roll: 25,  prefix: "Gander",  suffix: "spy",    person: "Paladin",       personRewardAdj: 1,  hexName: "The Mystic TERRAIN",           hexRewardAdj: 0,  mountName: "Forest" },
  { roll: 26,  prefix: "Gold",    suffix: "span",   person: "Assassin",      personRewardAdj: 1,  hexName: "TERRAIN of Mist",              hexRewardAdj: 0,  mountName: "Freckles" },
  { roll: 27,  prefix: "Great",   suffix: "shot",   person: "Scoundrel",     personRewardAdj: 1,  hexName: "The Melting TERRAIN",          hexRewardAdj: 0,  mountName: "Fury" },
  { roll: 28,  prefix: "Green",   suffix: "say",    person: "Warlock",       personRewardAdj: 1,  hexName: "The Stolen TERRAIN",           hexRewardAdj: 0,  mountName: "Gem" },
  { roll: 29,  prefix: "Happy",   suffix: "rust",   person: "Druid",         personRewardAdj: 1,  hexName: "TERRAIN of the Elves",         hexRewardAdj: 0,  mountName: "Geoffrey" },
  { roll: 30,  prefix: "High",    suffix: "root",   person: "Barbarian",     personRewardAdj: 1,  hexName: "TERRAIN of the Dwarves",       hexRewardAdj: 0,  mountName: "Hamilton" },
  { roll: 31,  prefix: "Hogs",    suffix: "rook",   person: "Hunter",        personRewardAdj: 1,  hexName: "Dragons TERRAIN",              hexRewardAdj: 1,  mountName: "Hustle" },
  { roll: 32,  prefix: "Hot",     suffix: "risk",   person: "Arcane Wizard", personRewardAdj: 1,  hexName: "The Moving TERRAIN",           hexRewardAdj: 0,  mountName: "Hutch" },
  { roll: 33,  prefix: "Idle",    suffix: "quirk",  person: "Rogue",         personRewardAdj: 1,  hexName: "TERRAIN of Growing",           hexRewardAdj: 0,  mountName: "Illiad" },
  { roll: 34,  prefix: "Imp",     suffix: "quire",  person: "Sorcerer",      personRewardAdj: 1,  hexName: "TERRAIN of Horror",            hexRewardAdj: 0,  mountName: "Isis" },
  { roll: 35,  prefix: "Iron",    suffix: "quash",  person: "Sorceress",     personRewardAdj: 1,  hexName: "The Opened TERRAIN",           hexRewardAdj: 0,  mountName: "Javen" },
  { roll: 36,  prefix: "Ivy",     suffix: "quartz", person: "Herald",        personRewardAdj: 1,  hexName: "TERRAIN of Waking",            hexRewardAdj: 0,  mountName: "Jenny" },
  { roll: 37,  prefix: "Jade",    suffix: "pool",   person: "Cleric",        personRewardAdj: 1,  hexName: "The Nightmare TERRAIN",        hexRewardAdj: 0,  mountName: "Jigsy" },
  { roll: 38,  prefix: "Jay",     suffix: "pike",   person: "Diplomat",      personRewardAdj: 1,  hexName: "TERRAIN of Spells",            hexRewardAdj: 0,  mountName: "Jingles" },
  { roll: 39,  prefix: "Jewel",   suffix: "path",   person: "Bard",          personRewardAdj: 1,  hexName: "Riders TERRAIN",               hexRewardAdj: 0,  mountName: "Jumbo" },
  { roll: 40,  prefix: "Jug",     suffix: "pale",   person: "Leech Granger", personRewardAdj: 1,  hexName: "The Great TERRAIN",            hexRewardAdj: 0,  mountName: "Kricket" },
  { roll: 41,  prefix: "Kings",   suffix: "ore",    person: "Farmer",        personRewardAdj: 0,  hexName: "The Putrid TERRAIN",           hexRewardAdj: 0,  mountName: "Landslide" },
  { roll: 42,  prefix: "Knaves",  suffix: "orb",    person: "Scout",         personRewardAdj: 0,  hexName: "TERRAIN of Druids",            hexRewardAdj: 0,  mountName: "Lio" },
  { roll: 43,  prefix: "Knights", suffix: "off",    person: "Dwarf",         personRewardAdj: 0,  hexName: "Reaching TERRAIN",             hexRewardAdj: 0,  mountName: "Malachite" },
  { roll: 44,  prefix: "Knots",   suffix: "oak",    person: "Elf",           personRewardAdj: 0,  hexName: "TERRAIN of Gold",              hexRewardAdj: 2,  mountName: "Marisa" },
  { roll: 45,  prefix: "Leaf",    suffix: "not",    person: "Halfling",      personRewardAdj: 0,  hexName: "The Silver TERRAIN",           hexRewardAdj: 1,  mountName: "Megan" },
  { roll: 46,  prefix: "Light",   suffix: "nook",   person: "Half Elf",      personRewardAdj: 0,  hexName: "The Hidden TERRAIN",           hexRewardAdj: 0,  mountName: "Mia" },
  { roll: 47,  prefix: "Little",  suffix: "need",   person: "Half Giant",    personRewardAdj: 0,  hexName: "TERRAIN of Might",             hexRewardAdj: 0,  mountName: "Midnight" },
  { roll: 48,  prefix: "Lower",   suffix: "nap",    person: "High Elf",      personRewardAdj: 0,  hexName: "TERRAIN of Treasure",          hexRewardAdj: 1,  mountName: "Miracle" },
  { roll: 49,  prefix: "Maker",   suffix: "more",   person: "Mountain Dwarf",personRewardAdj: 0,  hexName: "TERRAIN of the Hunted",        hexRewardAdj: 0,  mountName: "Mistico" },
  { roll: 50,  prefix: "Mist",    suffix: "mind",   person: "Blacksmith",    personRewardAdj: 0,  hexName: "The Blighted TERRAIN",         hexRewardAdj: -1, mountName: "Mohawk" },
  { roll: 51,  prefix: "Moon",    suffix: "meld",   person: "Carpenter",     personRewardAdj: 0,  hexName: "TERRAIN of Assassins",         hexRewardAdj: 0,  mountName: "Moonay" },
  { roll: 52,  prefix: "Mother",  suffix: "mare",   person: "Builder",       personRewardAdj: 0,  hexName: "TERRAIN of Dreams",            hexRewardAdj: 0,  mountName: "Morningflame" },
  { roll: 53,  prefix: "Never",   suffix: "lurk",   person: "Mercenary",     personRewardAdj: 0,  hexName: "TERRAIN of Life",              hexRewardAdj: 0,  mountName: "Murphy" },
  { roll: 54,  prefix: "Niggle",  suffix: "loss",   person: "Wood Cutter",   personRewardAdj: 0,  hexName: "The Divided TERRAIN",          hexRewardAdj: 0,  mountName: "Mystique" },
  { roll: 55,  prefix: "Night",   suffix: "lily",   person: "Fisherman",     personRewardAdj: 0,  hexName: "The Broken TERRAIN",           hexRewardAdj: -1, mountName: "Nakima" },
  { roll: 56,  prefix: "Nuts",    suffix: "law",    person: "Cook",          personRewardAdj: 0,  hexName: "Wizards TERRAIN",              hexRewardAdj: 1,  mountName: "Navar" },
  { roll: 57,  prefix: "Oil",     suffix: "know",   person: "Miner",         personRewardAdj: 0,  hexName: "The White TERRAIN",            hexRewardAdj: 0,  mountName: "Nellie" },
  { roll: 58,  prefix: "Otter",   suffix: "knee",   person: "Miller",        personRewardAdj: 0,  hexName: "TERRAIN of Pain",              hexRewardAdj: 0,  mountName: "Nightstorm" },
  { roll: 59,  prefix: "Oust",    suffix: "kin",    person: "Jester",        personRewardAdj: 0,  hexName: "The Taken TERRAIN",            hexRewardAdj: -1, mountName: "Odyssy" },
  { roll: 60,  prefix: "Over",    suffix: "keep",   person: "Town Crier",    personRewardAdj: 0,  hexName: "TERRAIN of Gloom",             hexRewardAdj: 0,  mountName: "Oreo" },
  { roll: 61,  prefix: "Patch",   suffix: "jolly",  person: "Minstrel",      personRewardAdj: 0,  hexName: "TERRAIN of Storms",            hexRewardAdj: 0,  mountName: "Oreon" },
  { roll: 62,  prefix: "Pine",    suffix: "jest",   person: "Mason",         personRewardAdj: 0,  hexName: "TERRAIN of the Spider",        hexRewardAdj: 0,  mountName: "Pacheco" },
  { roll: 63,  prefix: "Plague",  suffix: "jaw",    person: "Fletcher",      personRewardAdj: 0,  hexName: "TERRAIN of the Dragons",       hexRewardAdj: 1,  mountName: "Paint" },
  { roll: 64,  prefix: "Plunge",  suffix: "jab",    person: "Watchman",      personRewardAdj: 0,  hexName: "TERRAIN of Fear",              hexRewardAdj: 0,  mountName: "Penelope" },
  { roll: 65,  prefix: "Quake",   suffix: "itch",   person: "Armourer",      personRewardAdj: 0,  hexName: "TERRAIN of Anguish",           hexRewardAdj: 0,  mountName: "Puzzle" },
  { roll: 66,  prefix: "Quarter", suffix: "inns",   person: "Herbalist",     personRewardAdj: 0,  hexName: "TERRAIN of Torment",           hexRewardAdj: 0,  mountName: "Quentin" },
  { roll: 67,  prefix: "Quiet",   suffix: "ink",    person: "Sailor",        personRewardAdj: 0,  hexName: "TERRAIN of Torture",           hexRewardAdj: 0,  mountName: "Rachel" },
  { roll: 68,  prefix: "Quill",   suffix: "ice",    person: "Cartographer",  personRewardAdj: 0,  hexName: "TERRAIN of Hurting",           hexRewardAdj: 0,  mountName: "Rainmane" },
  { roll: 69,  prefix: "Rage",    suffix: "hoof",   person: "Messenger",     personRewardAdj: 0,  hexName: "TERRAIN of Hurt",              hexRewardAdj: 0,  mountName: "Rapid Feet" },
  { roll: 70,  prefix: "Red",     suffix: "hold",   person: "Physician",     personRewardAdj: 0,  hexName: "The Bleeding TERRAIN",         hexRewardAdj: 0,  mountName: "Rapid Sparkle" },
  { roll: 71,  prefix: "Reef",    suffix: "head",   person: "Leather Worker",personRewardAdj: 0,  hexName: "The Draining TERRAIN",         hexRewardAdj: 0,  mountName: "Renassiance" },
  { roll: 72,  prefix: "River",   suffix: "haste",  person: "Locksmith",     personRewardAdj: 0,  hexName: "TERRAIN of Death",             hexRewardAdj: 0,  mountName: "Romper" },
  { roll: 73,  prefix: "Silver",  suffix: "guard",  person: "Executioner",   personRewardAdj: 0,  hexName: "TERRAIN of Strength",          hexRewardAdj: 0,  mountName: "Saffron" },
  { roll: 74,  prefix: "Star",    suffix: "grim",   person: "Candle Maker",  personRewardAdj: 0,  hexName: "TERRAIN of Wisdom",            hexRewardAdj: 0,  mountName: "Shade Sparks" },
  { roll: 75,  prefix: "Summer",  suffix: "gore",   person: "Astrologer",    personRewardAdj: 0,  hexName: "TERRAIN of Adventure",         hexRewardAdj: 0,  mountName: "Shadow" },
  { roll: 76,  prefix: "Sun",     suffix: "good",   person: "Peddler",       personRewardAdj: 0,  hexName: "The Soothing TERRAIN",         hexRewardAdj: 0,  mountName: "Shianne" },
  { roll: 77,  prefix: "Temple",  suffix: "fury",   person: "Seer",          personRewardAdj: 0,  hexName: "The TERRAIN of Suffering",     hexRewardAdj: 0,  mountName: "Skye" },
  { roll: 78,  prefix: "Toil",    suffix: "foe",    person: "Mystic",        personRewardAdj: 0,  hexName: "The Divided TERRAIN",          hexRewardAdj: -1, mountName: "Sling" },
  { roll: 79,  prefix: "Tomb",    suffix: "fled",   person: "Fortune Teller",personRewardAdj: 0,  hexName: "The TERRAIN of Power",         hexRewardAdj: 0,  mountName: "Snowey" },
  { roll: 80,  prefix: "Trample", suffix: "far",    person: "Protagonist",   personRewardAdj: 0,  hexName: "TERRAIN of Magic",             hexRewardAdj: 1,  mountName: "Solar" },
  { roll: 81,  prefix: "Under",   suffix: "etch",   person: "Shepherd",      personRewardAdj: 0,  hexName: "The Arcane TERRAIN",           hexRewardAdj: 1,  mountName: "Sprocket" },
  { roll: 82,  prefix: "Upper",   suffix: "end",    person: "Reverend",      personRewardAdj: 0,  hexName: "TERRAIN of Lost Souls",        hexRewardAdj: 0,  mountName: "Star" },
  { roll: 83,  prefix: "Usher",   suffix: "else",   person: "Friar",         personRewardAdj: 0,  hexName: "TERRAIN of Lost Riches",       hexRewardAdj: 1,  mountName: "Sun Blossom" },
  { roll: 84,  prefix: "Utter",   suffix: "elk",    person: "Farmhand",      personRewardAdj: 0,  hexName: "TERRAIN of Glory",             hexRewardAdj: 0,  mountName: "Sundance" },
  { roll: 85,  prefix: "Vamp",    suffix: "drift",  person: "Troubadour",    personRewardAdj: 0,  hexName: "The TERRAIN of Honour",        hexRewardAdj: 1,  mountName: "Swift Ranger" },
  { roll: 86,  prefix: "Viper",   suffix: "dread",  person: "Hostler",       personRewardAdj: 0,  hexName: "The Missing TERRAIN",          hexRewardAdj: 0,  mountName: "Tanis" },
  { roll: 87,  prefix: "Vole",    suffix: "ditch",  person: "Weaver",        personRewardAdj: 0,  hexName: "TERRAIN of Mourning",          hexRewardAdj: 0,  mountName: "Thor" },
  { roll: 88,  prefix: "Volt",    suffix: "dawn",   person: "Artisan",       personRewardAdj: 0,  hexName: "TERRAIN of Kings",             hexRewardAdj: 1,  mountName: "Thunder Sparks" },
  { roll: 89,  prefix: "Water",   suffix: "cut",    person: "Alchemist",     personRewardAdj: 0,  hexName: "The Forgotten TERRAIN",        hexRewardAdj: 0,  mountName: "Thunderlight" },
  { roll: 90,  prefix: "White",   suffix: "cub",    person: "Outlander",     personRewardAdj: -1, hexName: "The Lost TERRAIN",             hexRewardAdj: 0,  mountName: "Thundermane" },
  { roll: 91,  prefix: "Winter",  suffix: "cot",    person: "Pilgrim",       personRewardAdj: -1, hexName: "The Lonely TERRAIN",           hexRewardAdj: 0,  mountName: "Topaz" },
  { roll: 92,  prefix: "Wolf",    suffix: "comp",   person: "Drifter",       personRewardAdj: -1, hexName: "TERRAIN of Solace",            hexRewardAdj: 0,  mountName: "Trace" },
  { roll: 93,  prefix: "Yearn",   suffix: "bottom", person: "Rat Catcher",   personRewardAdj: -1, hexName: "The Red TERRAIN",              hexRewardAdj: 0,  mountName: "Trigger" },
  { roll: 94,  prefix: "Yellow",  suffix: "bell",   person: "Gravedigger",   personRewardAdj: -1, hexName: "TERRAIN of Fright",            hexRewardAdj: 0,  mountName: "Triggerbolt" },
  { roll: 95,  prefix: "Yokel",   suffix: "bee",    person: "Outcast",       personRewardAdj: -2, hexName: "The Ghostly TERRAIN",          hexRewardAdj: 0,  mountName: "Trojan" },
  { roll: 96,  prefix: "Young",   suffix: "bay",    person: "Hobo",          personRewardAdj: -2, hexName: "TERRAIN of the Undead",        hexRewardAdj: 0,  mountName: "Ty" },
  { roll: 97,  prefix: "Zanm",    suffix: "axe",    person: "Vagabond",      personRewardAdj: -3, hexName: "The Shaking TERRAIN",          hexRewardAdj: 0,  mountName: "Whitley" },
  { roll: 98,  prefix: "Zelch",   suffix: "altar",  person: "Exile",         personRewardAdj: -3, hexName: "The Shadowy TERRAIN",          hexRewardAdj: 0,  mountName: "Wrangler" },
  { roll: 99,  prefix: "Zeldred", suffix: "ally",   person: "Vagrant",       personRewardAdj: -4, hexName: "TERRAIN of Pleasure",          hexRewardAdj: 1,  mountName: "Zani" },
  { roll: 100, prefix: "Zorl",    suffix: "after",  person: "Escaped Slave", personRewardAdj: -5, hexName: "TERRAIN of Delight",           hexRewardAdj: 0,  mountName: "Zip" },
];

export function getNameByRoll(roll: number): NamesEntry {
  const entry = NAMES_TABLE.find((e) => e.roll === roll);
  if (!entry) throw new Error(`Invalid name roll: ${roll}`);
  return entry;
}

/** Generate a hex name by replacing "TERRAIN" with the actual terrain type */
export function buildHexName(template: string, terrainType: string): string {
  return template.replace("TERRAIN", terrainType);
}

/** Build a settlement name from prefix + suffix rolls */
export function buildSettlementName(prefixRoll: number, suffixRoll: number): string {
  const prefixEntry = getNameByRoll(prefixRoll);
  const suffixEntry = getNameByRoll(suffixRoll);
  return `${prefixEntry.prefix}${suffixEntry.suffix}`;
}
