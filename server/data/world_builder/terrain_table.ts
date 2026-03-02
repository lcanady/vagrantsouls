// (WB) T – TERRAIN TABLE
// D100 roll → terrain entry

export type TerrainType =
  | "Deserts"
  | "Tundras"
  | "Grasslands"
  | "Forests"
  | "Jungles"
  | "Marshlands"
  | "Swamps"
  | "Hills"
  | "Mountains"
  | "Seas";

export interface TerrainEntry {
  minRoll: number;
  maxRoll: number;
  terrain: TerrainType;
  /** Base action points to MOVE out of this hex */
  moveAP: number;
  /** Forage penalty applied to test */
  foragePenalty: number;
  /** Rations gained on successful forage */
  forageRations: number;
  /** Ride penalty applied to Dex test */
  ridePenalty: number;
  /** Base % chance hex contains a settlement (roll ≤ this) */
  settlementChance: number;
  /** Base % chance a road passes through */
  roadChance: number;
  /** Base % chance a river passes through */
  riverChance: number;
  /** Base % population for cart/lay-of-land/news-of-quests */
  populationChance: number;
  /** CSS-style colour for map rendering */
  colour: string;
}

export const TERRAIN_TABLE: TerrainEntry[] = [
  {
    minRoll: 1,
    maxRoll: 8,
    terrain: "Deserts",
    moveAP: 8,
    foragePenalty: -30,
    forageRations: 5,
    ridePenalty: -10,
    settlementChance: 15,
    roadChance: 15,
    riverChance: 15,
    populationChance: 15,
    colour: "#F5E642",
  },
  {
    minRoll: 9,
    maxRoll: 16,
    terrain: "Tundras",
    moveAP: 4,
    foragePenalty: -10,
    forageRations: 6,
    ridePenalty: 0,
    settlementChance: 35,
    roadChance: 30,
    riverChance: 30,
    populationChance: 40,
    colour: "#D0D8D8",
  },
  {
    minRoll: 17,
    maxRoll: 31,
    terrain: "Grasslands",
    moveAP: 4,
    foragePenalty: -5,
    forageRations: 9,
    ridePenalty: 0,
    settlementChance: 40,
    roadChance: 50,
    riverChance: 30,
    populationChance: 40,
    colour: "#5CB85C",
  },
  {
    minRoll: 32,
    maxRoll: 43,
    terrain: "Forests",
    moveAP: 5,
    foragePenalty: -5,
    forageRations: 9,
    ridePenalty: -15,
    settlementChance: 25,
    roadChance: 20,
    riverChance: 45,
    populationChance: 35,
    colour: "#8BC34A",
  },
  {
    minRoll: 44,
    maxRoll: 52,
    terrain: "Jungles",
    moveAP: 6,
    foragePenalty: -5,
    forageRations: 8,
    ridePenalty: -15,
    settlementChance: 20,
    roadChance: 15,
    riverChance: 45,
    populationChance: 25,
    colour: "#2E7D32",
  },
  {
    minRoll: 53,
    maxRoll: 60,
    terrain: "Marshlands",
    moveAP: 6,
    foragePenalty: -5,
    forageRations: 8,
    ridePenalty: -10,
    settlementChance: 35,
    roadChance: 25,
    riverChance: 60,
    populationChance: 35,
    colour: "#9C27B0",
  },
  {
    minRoll: 61,
    maxRoll: 67,
    terrain: "Swamps",
    moveAP: 6,
    foragePenalty: -15,
    forageRations: 8,
    ridePenalty: -10,
    settlementChance: 20,
    roadChance: 15,
    riverChance: 60,
    populationChance: 30,
    colour: "#CE93D8",
  },
  {
    minRoll: 68,
    maxRoll: 80,
    terrain: "Hills",
    moveAP: 5,
    foragePenalty: -10,
    forageRations: 7,
    ridePenalty: -5,
    settlementChance: 30,
    roadChance: 25,
    riverChance: 35,
    populationChance: 35,
    colour: "#795548",
  },
  {
    minRoll: 81,
    maxRoll: 90,
    terrain: "Mountains",
    moveAP: 8,
    foragePenalty: -15,
    forageRations: 7,
    ridePenalty: -20,
    settlementChance: 25,
    roadChance: 15,
    riverChance: 40,
    populationChance: 30,
    colour: "#9E9E9E",
  },
  {
    minRoll: 91,
    maxRoll: 100,
    terrain: "Seas",
    moveAP: 8,
    foragePenalty: -10,
    forageRations: 6,
    ridePenalty: 0, // N/A for seas
    settlementChance: 0, // seas have no settlements
    roadChance: 0,
    riverChance: 0,
    populationChance: 15,
    colour: "#2196F3",
  },
];

/**
 * Modifiers added to road/river/settlement/population chance
 * based on what is already in the hex.
 */
export const TERRAIN_MODIFIERS = {
  /** Settlement modifier for road/river chance */
  village: 5,
  town: 10,
  city: 20,
  /** Pop modifier for roads/rivers flowing through hex */
  roadPresent: 10,
  riverPresent: 10,
} as const;

export function getTerrainByRoll(roll: number): TerrainEntry {
  const entry = TERRAIN_TABLE.find((e) => roll >= e.minRoll && roll <= e.maxRoll);
  if (!entry) throw new Error(`Invalid terrain roll: ${roll}`);
  return entry;
}

export function getTerrainByType(terrain: TerrainType): TerrainEntry {
  const entry = TERRAIN_TABLE.find((e) => e.terrain === terrain);
  if (!entry) throw new Error(`Unknown terrain type: ${terrain}`);
  return entry;
}

/** Starting terrain by race (Book 6 p.9) */
export const RACE_HOME_TERRAIN: Record<string, TerrainType[]> = {
  Human: ["Grasslands", "Hills"],
  Dwarf: ["Mountains", "Hills"],
  Elf: ["Forests"],
  Halfling: ["Marshlands", "Jungles"],
  "Half Elf": ["Forests", "Grasslands"],
  "Half Giant": ["Hills"],
  "High Elf": ["Forests"],
  "Mountain Dwarf": ["Mountains"],
};

/** Direction hex: d6 roll → axial direction vector [q, r] (flat-top hexes) */
export const DIRECTION_VECTORS: Record<number, [number, number]> = {
  1: [0, -1],  // North
  2: [1, -1],  // North-East
  3: [1, 0],   // South-East
  4: [0, 1],   // South
  5: [-1, 1],  // South-West
  6: [-1, 0],  // North-West
};

/** Opposite edge for a given direction (for road/river flow-through) */
export const OPPOSITE_EDGE: Record<number, number> = {
  1: 4,
  2: 5,
  3: 6,
  4: 1,
  5: 2,
  6: 3,
};
