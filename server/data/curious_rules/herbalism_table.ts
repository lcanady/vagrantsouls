// (WB) H – HERBALISM TABLE (Book 8: The Forgotten Tome of Curious Rules)
// Used during the World Builder Herbalism Action.

export type TerrainType =
  | "deserts"
  | "forests"
  | "grasslands"
  | "hills"
  | "jungles"
  | "marshlands"
  | "mountains"
  | "seas"
  | "swamps"
  | "tundras";

export const TERRAIN_TYPES: TerrainType[] = [
  "deserts", "forests", "grasslands", "hills", "jungles",
  "marshlands", "mountains", "seas", "swamps", "tundras",
];

/** Herbalism Modifier per terrain (deducted from Int for HERB COLLECTING test) */
export const HERBALISM_MODIFIERS: Record<TerrainType, number> = {
  deserts:    -20,
  forests:    -5,
  grasslands: -5,
  hills:      -10,
  jungles:    -5,
  marshlands: -5,
  mountains:  -10,
  seas:       -15,
  swamps:     -5,
  tundras:    -10,
};

/**
 * Herb table: d10 roll → herb name per terrain.
 * Index 0 unused; indices 1-10 match the d10 result.
 */
export const HERBALISM_TABLE: Record<TerrainType, string[]> = {
  //                         [0]        [1]           [2]           [3]           [4]           [5]           [6]           [7]           [8]           [9]           [10]
  deserts:    ["",      "Crabweed",   "Sandroot",   "Firemoss",   "Scarbark",   "Dustflower", "Copperweed", "Tongueroot", "Whelpmoss",  "Swiftbark",  "Stormflower"],
  forests:    ["",      "Elvenweed",  "Pixieroot",  "Fairymoss",  "Faebark",    "Entflower",  "Blackweed",  "Wetroot",    "Follymoss",  "Padbark",    "Driftflower"],
  grasslands: ["",      "Pipeweed",   "Smokeroot",  "Darkmoss",   "Everbark",   "Dragonflower","Gumweed",   "Pearlroot",  "Kingsmoss",  "Deathbark",  "Sedgeflower"],
  hills:      ["",      "Grubweed",   "Giantsroot", "Wildmoss",   "Drybark",    "Hagsflower", "Rainweed",   "Shankroot",  "Sundermoss", "Witchbark",  "Scrubflower"],
  jungles:    ["",      "Nightweed",  "Shaderoot",  "Runemoss",   "Felbark",    "Plagueflower","Thistleweed","Swineroot",  "Blinkmoss",  "Mindbark",   "Mageflower"],
  marshlands: ["",      "Copperweed", "Wetroot",    "Kingsmoss",  "Witchbark",  "Mageflower", "Crabweed",   "Shaderoot",  "Wildmoss",   "Everbark",   "Entflower"],
  mountains:  ["",      "Blackweed",  "Pearlroot",  "Sundermoss", "Mindbark",   "Stormflower","Elvenweed",  "Sandroot",   "Runemoss",   "Drybark",    "Dragonflower"],
  seas:       ["",      "Gumweed",    "Shankroot",  "Firemoss",   "Swiftbark",  "Driftflower","Pipeweed",   "Pixieroot",  "Fairymoss",  "Felbark",    "Hagsflower"],
  swamps:     ["",      "Rainweed",   "Smokeroot",  "Fairymoss",  "Scarbark",   "Sedgeflower","Grubweed",   "Smokeroot",  "Whelpmoss",  "Padbark",    "Plagueflower"],
  tundras:    ["",      "Thistleweed","Tongueroot", "Follymoss",  "Deathbark",  "Scrubflower","Nightweed",  "Giantsroot", "Darkmoss",   "Faebark",    "Dustflower"],
};

// ─── HERBALISM RECIPES ────────────────────────────────────────────────────────

export interface HerbalRecipe {
  name: string;
  value: number;        // GP — also the training cost
  ingredients: string[];
  effect: string;
  /** Must learn prerequisite before this recipe can be learnt */
  prerequisite?: string;
}

export const HERBALISM_RECIPES: HerbalRecipe[] = [
  // Anti-Venom tier
  {
    name: "Anti-Venom Rub",
    value: 50,
    ingredients: ["Nightweed", "Sandroot", "Fairymoss"],
    effect: "Apply to remove 1d3 shaded pips from the poison track.",
  },
  {
    name: "Anti-Venom Balm",
    value: 100,
    ingredients: ["Nightweed", "Sandroot", "Fairymoss", "Everbark"],
    effect: "Apply to remove 1d6 shaded pips from the poison track.",
    prerequisite: "Anti-Venom Rub",
  },
  {
    name: "Anti-Venom Salve",
    value: 200,
    ingredients: ["Nightweed", "Sandroot", "Fairymoss", "Everbark", "Hagsflower"],
    effect: "Apply to remove 1d10 shaded pips from the poison track.",
    prerequisite: "Anti-Venom Balm",
  },
  // Healing tier
  {
    name: "Healing Rub",
    value: 50,
    ingredients: ["Elvenweed", "Smokeroot", "Wildmoss"],
    effect: "Apply to restore 1d3 lost HP.",
  },
  {
    name: "Healing Balm",
    value: 100,
    ingredients: ["Elvenweed", "Smokeroot", "Wildmoss", "Felbark"],
    effect: "Apply to restore 1d6 lost HP.",
    prerequisite: "Healing Rub",
  },
  {
    name: "Healing Salve",
    value: 200,
    ingredients: ["Elvenweed", "Smokeroot", "Wildmoss", "Felbark", "Dustflower"],
    effect: "Apply to restore 1d10 lost HP.",
    prerequisite: "Healing Balm",
  },
  // Dexterity tier
  {
    name: "Dexterity Dram",
    value: 50,
    ingredients: ["Thistleweed", "Wetroot", "Sundermoss"],
    effect: "Drink before an action to gain +1d3 Dexterity for the duration of the next action.",
  },
  {
    name: "Dexterity Drink",
    value: 100,
    ingredients: ["Thistleweed", "Wetroot", "Sundermoss", "Swiftbark"],
    effect: "Drink before an action to gain +1d6 Dexterity for the duration of the next action.",
    prerequisite: "Dexterity Dram",
  },
  {
    name: "Dexterity Flask",
    value: 200,
    ingredients: ["Thistleweed", "Wetroot", "Sundermoss", "Swiftbark", "Sedgeflower"],
    effect: "Drink before an action to gain +1d10 Dexterity for the duration of the next action.",
    prerequisite: "Dexterity Drink",
  },
  // Intelligence tier
  {
    name: "Intelligence Dram",
    value: 50,
    ingredients: ["Rainweed", "Tongueroot", "Kingsmoss"],
    effect: "Drink before an action to gain +1d3 Intelligence for the duration of the next action.",
  },
  {
    name: "Intelligence Drink",
    value: 100,
    ingredients: ["Rainweed", "Tongueroot", "Kingsmoss", "Mindbark"],
    effect: "Drink before an action to gain +1d6 Intelligence for the duration of the next action.",
    prerequisite: "Intelligence Dram",
  },
  {
    name: "Intelligence Flask",
    value: 200,
    ingredients: ["Rainweed", "Tongueroot", "Kingsmoss", "Mindbark", "Driftflower"],
    effect: "Drink before an action to gain +1d10 Intelligence for the duration of the next action.",
    prerequisite: "Intelligence Drink",
  },
  // Dodge tier
  {
    name: "Dodge Dram",
    value: 50,
    ingredients: ["Gumweed", "Swineroot", "Follymoss"],
    effect: "Drink before an action to gain +1 Def for the duration of the next action.",
  },
  {
    name: "Dodge Drink",
    value: 100,
    ingredients: ["Gumweed", "Swineroot", "Follymoss", "Witchbark"],
    effect: "Drink before an action to gain +2 Def for the duration of the next action.",
    prerequisite: "Dodge Dram",
  },
  {
    name: "Dodge Flask",
    value: 200,
    ingredients: ["Gumweed", "Swineroot", "Follymoss", "Witchbark", "Stormflower"],
    effect: "Drink before an action to gain +3 Def for the duration of the next action.",
    prerequisite: "Dodge Drink",
  },
  // Mighty tier
  {
    name: "Mighty Dram",
    value: 50,
    ingredients: ["Grubweed", "Shaderoot", "Firemoss"],
    effect: "Drink before an action to gain +1 Dmg for the duration of the next action.",
  },
  {
    name: "Mighty Drink",
    value: 100,
    ingredients: ["Grubweed", "Shaderoot", "Firemoss", "Faebark"],
    effect: "Drink before an action to gain +2 Dmg for the duration of the next action.",
    prerequisite: "Mighty Dram",
  },
  {
    name: "Mighty Flask",
    value: 200,
    ingredients: ["Grubweed", "Shaderoot", "Firemoss", "Faebark", "Dragonflower"],
    effect: "Drink before an action to gain +3 Dmg for the duration of the next action.",
    prerequisite: "Mighty Drink",
  },
  // Strength tier
  {
    name: "Strength Dram",
    value: 50,
    ingredients: ["Pipeweed", "Giantsroot", "Runemoss"],
    effect: "Drink before an action to gain +1d3 Strength for the duration of the next action.",
  },
  {
    name: "Strength Drink",
    value: 100,
    ingredients: ["Pipeweed", "Giantsroot", "Runemoss", "Scarbark"],
    effect: "Drink before an action to gain +1d6 Strength for the duration of the next action.",
    prerequisite: "Strength Dram",
  },
  {
    name: "Strength Flask",
    value: 200,
    ingredients: ["Pipeweed", "Giantsroot", "Runemoss", "Scarbark", "Entflower"],
    effect: "Drink before an action to gain +1d10 Strength for the duration of the next action.",
    prerequisite: "Strength Drink",
  },
  // Mount tier
  {
    name: "Mount Treat",
    value: 50,
    ingredients: ["Copperweed", "Pearlroot", "Blinkmoss"],
    effect: "Feed to a mount in place of a ration and remove 1 shaded pip on its malnutrition track.",
  },
  {
    name: "Mount Bar",
    value: 100,
    ingredients: ["Copperweed", "Pearlroot", "Blinkmoss", "Padbark"],
    effect: "Feed to a mount in place of a ration and remove 2 shaded pips on its malnutrition track.",
    prerequisite: "Mount Treat",
  },
  {
    name: "Mount Cake",
    value: 200,
    ingredients: ["Copperweed", "Pearlroot", "Blinkmoss", "Padbark", "Scrubflower"],
    effect: "Feed to a mount in place of a ration and remove 3 shaded pips on its malnutrition track.",
    prerequisite: "Mount Bar",
  },
  // Sickness tier
  {
    name: "Sickness Rub",
    value: 50,
    ingredients: ["Crabweed", "Pixieroot", "Darkmoss"],
    effect: "Apply to remove 1d3 shaded pips from the disease track.",
  },
  {
    name: "Sickness Balm",
    value: 100,
    ingredients: ["Crabweed", "Pixieroot", "Darkmoss", "Drybark"],
    effect: "Apply to remove 1d6 shaded pips from the disease track.",
    prerequisite: "Sickness Rub",
  },
  {
    name: "Sickness Salve",
    value: 200,
    ingredients: ["Crabweed", "Pixieroot", "Darkmoss", "Drybark", "Plagueflower"],
    effect: "Apply to remove 1d10 shaded pips from the disease track.",
    prerequisite: "Sickness Balm",
  },
  // Vitality tier
  {
    name: "Vitality Dram",
    value: 50,
    ingredients: ["Blackweed", "Shankroot", "Whelpmoss"],
    effect: "Drink to remove 1d3 shaded pips from the fatigue track.",
  },
  {
    name: "Vitality Drink",
    value: 100,
    ingredients: ["Blackweed", "Shankroot", "Whelpmoss", "Deathbark"],
    effect: "Drink to remove 1d6 shaded pips from the fatigue track.",
    prerequisite: "Vitality Dram",
  },
  {
    name: "Vitality Flask",
    value: 200,
    ingredients: ["Blackweed", "Shankroot", "Whelpmoss", "Deathbark", "Mageflower"],
    effect: "Drink to remove 1d10 shaded pips from the fatigue track.",
    prerequisite: "Vitality Drink",
  },
];

/** Lookup a recipe by name (case-insensitive) */
export function getRecipe(name: string): HerbalRecipe | undefined {
  return HERBALISM_RECIPES.find(
    (r) => r.name.toLowerCase() === name.toLowerCase(),
  );
}

/** Get the herb name for a d10 roll in a given terrain */
export function getHerb(terrain: TerrainType, roll: number): string {
  if (roll < 1 || roll > 10) throw new Error(`Herb roll must be 1-10, got ${roll}`);
  return HERBALISM_TABLE[terrain][roll];
}
