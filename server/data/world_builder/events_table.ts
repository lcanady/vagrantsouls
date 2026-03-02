// (WB) E – EVENTS TABLE
// Roll d100 → event name, cross-referenced with terrain/settlement context

export type WBEventName =
  | "ATTACK"
  | "AVALANCHE"
  | "BITE"
  | "BOGLAND"
  | "BOOTY"
  | "BORROWED"
  | "BRAWL"
  | "BURGLARY"
  | "CAMEL"
  | "CAPTURE"
  | "CHANGE"
  | "CIRCUS"
  | "CONFRONT_MOUNT_THIEF"
  | "CROSSWINDS"
  | "FARM"
  | "FAY"
  | "FLASH_FLOODS"
  | "FOG"
  | "FORAGE_FISH"
  | "GAMBLE"
  | "GUILD"
  | "HANGING"
  | "HUNTED"
  | "HYBRID"
  | "IDENTITY"
  | "IMPASSABLE"
  | "ISLAND"
  | "JAIL"
  | "JUNGLE_FEVER"
  | "JUNGLE_WORM"
  | "LANDSLIDE"
  | "LAW"
  | "LOST"
  | "LUCKY_FIND"
  | "MALARIA"
  | "MIRAGE"
  | "MISSING"
  | "MONSTER"
  | "MOON"
  | "MOUNTS"
  | "MOUNT_THEFT"
  | "MYSTIC"
  | "NOMADS"
  | "OASIS"
  | "OUTPOST"
  | "PIRATES"
  | "PLAGUE"
  | "POISONOUS"
  | "QUEST"
  | "QUICKSAND"
  | "RAFT"
  | "RELATIVE"
  | "REPORT"
  | "REPORT_MOUNT_THEFT"
  | "REVENGE"
  | "ROBBED"
  | "ROMANCE"
  | "RUMOURS"
  | "RUNAWAY"
  | "SAND_STORM"
  | "SEA_FOG"
  | "SEA_MONSTER"
  | "SEA_STORMS"
  | "SIDE_QUEST"
  | "SHIP_ATTACK"
  | "SHIPMATES"
  | "SHRINE"
  | "SLAVERY"
  | "SNOWFALL"
  | "SQUALL"
  | "STALKED"
  | "STEAL_MOUNT"
  | "STEALING"
  | "STOLEN_ITEMS"
  | "STORMS"
  | "STRANGER"
  | "SWAMP_GAS"
  | "SWARMS"
  | "SWIM"
  | "TAVERN"
  | "TREASURE"
  | "VAMPIRE"
  | "WANTED"
  | "WAVES"
  | "WEREWOLF"
  | "WILDFIRE"
  | "WITCH"
  | "WITCHERY";

export type EventContext =
  | "settlement"
  | "Deserts"
  | "Forests"
  | "Grasslands"
  | "Hills"
  | "Jungles"
  | "Marshlands"
  | "Mountains"
  | "Seas"
  | "Swamps"
  | "Tundras";

interface EventRow {
  minRoll: number;
  maxRoll: number;
  settlement: WBEventName;
  Deserts: WBEventName;
  Forests: WBEventName;
  Grasslands: WBEventName;
  Hills: WBEventName;
  Jungles: WBEventName;
  Marshlands: WBEventName;
  Mountains: WBEventName;
  Seas: WBEventName;
  Swamps: WBEventName;
  Tundras: WBEventName;
}

export const EVENTS_TABLE: EventRow[] = [
  { minRoll: 1,   maxRoll: 5,   settlement: "LUCKY_FIND",   Deserts: "BOOTY",      Forests: "BOOTY",      Grasslands: "BOOTY",      Hills: "BOOTY",      Jungles: "BOOTY",      Marshlands: "BOOTY",      Mountains: "BOOTY",      Seas: "TREASURE",    Swamps: "BOOTY",      Tundras: "BOOTY" },
  { minRoll: 6,   maxRoll: 10,  settlement: "MOUNTS",       Deserts: "QUEST",      Forests: "QUEST",      Grasslands: "QUEST",      Hills: "QUEST",      Jungles: "QUEST",      Marshlands: "QUEST",      Mountains: "QUEST",      Seas: "SHIPMATES",   Swamps: "QUEST",      Tundras: "QUEST" },
  { minRoll: 11,  maxRoll: 20,  settlement: "GUILD",        Deserts: "SIDE_QUEST", Forests: "SIDE_QUEST", Grasslands: "SIDE_QUEST", Hills: "SIDE_QUEST", Jungles: "SIDE_QUEST", Marshlands: "SIDE_QUEST", Mountains: "SIDE_QUEST", Seas: "SIDE_QUEST",  Swamps: "SIDE_QUEST", Tundras: "SIDE_QUEST" },
  { minRoll: 21,  maxRoll: 25,  settlement: "STRANGER",     Deserts: "STRANGER",   Forests: "STRANGER",   Grasslands: "STRANGER",   Hills: "STRANGER",   Jungles: "STRANGER",   Marshlands: "STRANGER",   Mountains: "STRANGER",   Seas: "RAFT",        Swamps: "STRANGER",   Tundras: "STRANGER" },
  { minRoll: 26,  maxRoll: 30,  settlement: "WANTED",       Deserts: "WANTED",     Forests: "WANTED",     Grasslands: "WANTED",     Hills: "WANTED",     Jungles: "WANTED",     Marshlands: "WANTED",     Mountains: "WANTED",     Seas: "ISLAND",      Swamps: "WANTED",     Tundras: "WANTED" },
  { minRoll: 31,  maxRoll: 35,  settlement: "SHRINE",       Deserts: "SHRINE",     Forests: "SHRINE",     Grasslands: "SHRINE",     Hills: "SHRINE",     Jungles: "SHRINE",     Marshlands: "SHRINE",     Mountains: "SHRINE",     Seas: "SHRINE",      Swamps: "SHRINE",     Tundras: "SHRINE" },
  { minRoll: 36,  maxRoll: 40,  settlement: "TAVERN",       Deserts: "OASIS",      Forests: "FORAGE_FISH",Grasslands: "FARM",       Hills: "FARM",       Jungles: "FORAGE_FISH",Marshlands: "FORAGE_FISH",Mountains: "FORAGE_FISH",Seas: "FORAGE_FISH", Swamps: "FORAGE_FISH",Tundras: "FARM" },
  { minRoll: 41,  maxRoll: 45,  settlement: "CIRCUS",       Deserts: "CAMEL",      Forests: "MISSING",    Grasslands: "RUMOURS",    Hills: "RUMOURS",    Jungles: "MISSING",    Marshlands: "RUMOURS",    Mountains: "MISSING",    Seas: "MISSING",     Swamps: "RUMOURS",    Tundras: "RUMOURS" },
  { minRoll: 46,  maxRoll: 50,  settlement: "RUMOURS",      Deserts: "NOMADS",     Forests: "IMPASSABLE", Grasslands: "FLASH_FLOODS",Hills: "FLASH_FLOODS",Jungles: "IMPASSABLE", Marshlands: "FLASH_FLOODS",Mountains: "IMPASSABLE",Seas: "WAVES",      Swamps: "SWAMP_GAS",  Tundras: "FLASH_FLOODS" },
  { minRoll: 51,  maxRoll: 55,  settlement: "BURGLARY",     Deserts: "OUTPOST",    Forests: "OUTPOST",    Grasslands: "OUTPOST",    Hills: "OUTPOST",    Jungles: "OUTPOST",    Marshlands: "OUTPOST",    Mountains: "OUTPOST",    Seas: "PIRATES",     Swamps: "OUTPOST",    Tundras: "OUTPOST" },
  { minRoll: 56,  maxRoll: 60,  settlement: "RELATIVE",     Deserts: "SAND_STORM", Forests: "STALKED",    Grasslands: "CROSSWINDS", Hills: "CROSSWINDS", Jungles: "STALKED",    Marshlands: "BOGLAND",    Mountains: "SNOWFALL",   Seas: "SHIP_ATTACK", Swamps: "BOGLAND",    Tundras: "CROSSWINDS" },
  { minRoll: 61,  maxRoll: 65,  settlement: "MYSTIC",       Deserts: "QUICKSAND",  Forests: "SWARMS",     Grasslands: "WILDFIRE",   Hills: "WILDFIRE",   Jungles: "SWARMS",     Marshlands: "SWARMS",     Mountains: "AVALANCHE",  Seas: "PIRATES",     Swamps: "SWARMS",     Tundras: "WILDFIRE" },
  { minRoll: 66,  maxRoll: 70,  settlement: "ROBBED",       Deserts: "MIRAGE",     Forests: "FAY",        Grasslands: "FOG",        Hills: "LANDSLIDE",  Jungles: "JUNGLE_FEVER",Marshlands: "FOG",        Mountains: "LANDSLIDE",  Seas: "SEA_FOG",     Swamps: "FOG",        Tundras: "FOG" },
  { minRoll: 71,  maxRoll: 75,  settlement: "ROMANCE",      Deserts: "LOST",       Forests: "LOST",       Grasslands: "LOST",       Hills: "LOST",       Jungles: "LOST",       Marshlands: "LOST",       Mountains: "LOST",       Seas: "LOST",        Swamps: "LOST",       Tundras: "LOST" },
  { minRoll: 76,  maxRoll: 80,  settlement: "IDENTITY",     Deserts: "STORMS",     Forests: "STORMS",     Grasslands: "STORMS",     Hills: "STORMS",     Jungles: "STORMS",     Marshlands: "STORMS",     Mountains: "STORMS",     Seas: "SEA_STORMS",  Swamps: "STORMS",     Tundras: "STORMS" },
  { minRoll: 81,  maxRoll: 85,  settlement: "BRAWL",        Deserts: "POISONOUS",  Forests: "POISONOUS",  Grasslands: "POISONOUS",  Hills: "POISONOUS",  Jungles: "POISONOUS",  Marshlands: "POISONOUS",  Mountains: "POISONOUS",  Seas: "POISONOUS",   Swamps: "POISONOUS",  Tundras: "POISONOUS" },
  { minRoll: 86,  maxRoll: 90,  settlement: "ATTACK",       Deserts: "ATTACK",     Forests: "ATTACK",     Grasslands: "ATTACK",     Hills: "ATTACK",     Jungles: "ATTACK",     Marshlands: "ATTACK",     Mountains: "ATTACK",     Seas: "STEALING",    Swamps: "ATTACK",     Tundras: "ATTACK" },
  { minRoll: 91,  maxRoll: 95,  settlement: "MOUNT_THEFT",  Deserts: "MONSTER",    Forests: "MONSTER",    Grasslands: "MONSTER",    Hills: "MONSTER",    Jungles: "MONSTER",    Marshlands: "MONSTER",    Mountains: "MONSTER",    Seas: "SEA_MONSTER", Swamps: "MONSTER",    Tundras: "MONSTER" },
  { minRoll: 96,  maxRoll: 99,  settlement: "PLAGUE",       Deserts: "PLAGUE",     Forests: "PLAGUE",     Grasslands: "PLAGUE",     Hills: "PLAGUE",     Jungles: "PLAGUE",     Marshlands: "PLAGUE",     Mountains: "PLAGUE",     Seas: "PIRATES",     Swamps: "PLAGUE",     Tundras: "PLAGUE" },
  { minRoll: 100, maxRoll: 100, settlement: "VAMPIRE",      Deserts: "VAMPIRE",    Forests: "VAMPIRE",    Grasslands: "VAMPIRE",    Hills: "VAMPIRE",    Jungles: "VAMPIRE",    Marshlands: "VAMPIRE",    Mountains: "VAMPIRE",    Seas: "SQUALL",      Swamps: "VAMPIRE",    Tundras: "VAMPIRE" },
];

export function lookupEvent(roll: number, context: EventContext): WBEventName {
  const row = EVENTS_TABLE.find((r) => roll >= r.minRoll && roll <= r.maxRoll);
  if (!row) throw new Error(`Invalid event roll: ${roll}`);
  if (context === "settlement") return row.settlement;
  return row[context as keyof Omit<EventRow, "minRoll" | "maxRoll">] as WBEventName;
}
