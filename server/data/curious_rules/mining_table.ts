// (WB) M – MINING TABLE (Book 8: The Forgotten Tome of Curious Rules)
// Used during the World Builder Mining Action by Artisan adventurers.

import type { TerrainType } from "./herbalism_table.ts";

/** Geology Modifier per terrain (deducted from Art for GEOLOGY test) */
export const GEOLOGY_MODIFIERS: Record<TerrainType, number> = {
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

export interface MiningMaterial {
  name: string;
  /** Gold piece value per unit */
  value: number;
  /** "ingot" (metal) | "shard" | "crystal" */
  type: "ingot" | "shard" | "crystal";
}

// Canonical material definitions
export const MATERIALS: Record<string, MiningMaterial> = {
  "Iron Ingot":      { name: "Iron Ingot",      value: 1,   type: "ingot" },
  "Bronze Ingot":    { name: "Bronze Ingot",     value: 2,   type: "ingot" },
  "Silver Ingot":    { name: "Silver Ingot",     value: 3,   type: "ingot" },
  "Gold Ingot":      { name: "Gold Ingot",       value: 4,   type: "ingot" },
  "Azure Ingot":     { name: "Azure Ingot",      value: 6,   type: "ingot" },
  "Violet Shard":    { name: "Violet Shard",     value: 8,   type: "shard" },
  "Red Shard":       { name: "Red Shard",        value: 8,   type: "shard" },
  "Orange Shard":    { name: "Orange Shard",     value: 8,   type: "shard" },
  "Indigo Shard":    { name: "Indigo Shard",     value: 8,   type: "shard" },
  "Yellow Shard":    { name: "Yellow Shard",     value: 8,   type: "shard" },
  "Green Shard":     { name: "Green Shard",      value: 8,   type: "shard" },
  "Blue Shard":      { name: "Blue Shard",       value: 8,   type: "shard" },
  "Red Crystal":     { name: "Red Crystal",      value: 80,  type: "crystal" },
  "Orange Crystal":  { name: "Orange Crystal",   value: 80,  type: "crystal" },
  "Green Crystal":   { name: "Green Crystal",    value: 80,  type: "crystal" },
  "Blue Crystal":    { name: "Blue Crystal",     value: 80,  type: "crystal" },
  "Indigo Crystal":  { name: "Indigo Crystal",   value: 80,  type: "crystal" },
  "Yellow Crystal":  { name: "Yellow Crystal",   value: 80,  type: "crystal" },
  "Violet Crystal":  { name: "Violet Crystal",   value: 80,  type: "crystal" },
};

/**
 * Mining results table: d10 roll → material name per terrain.
 * Index 0 unused; indices 1-10 match the d10 result.
 */
export const MINING_TABLE: Record<TerrainType, string[]> = {
  //               [0]   [1]             [2]             [3]             [4]             [5]             [6]             [7]             [8]             [9]             [10]
  deserts:    ["", "Iron Ingot",    "Silver Ingot",  "Bronze Ingot", "Iron Ingot",   "Silver Ingot",  "Iron Ingot",   "Iron Ingot",   "Iron Ingot",   "Violet Shard",  "Orange Shard"],
  forests:    ["", "Bronze Ingot",  "Gold Ingot",    "Silver Ingot", "Bronze Ingot", "Gold Ingot",    "Bronze Ingot", "Bronze Ingot", "Bronze Ingot", "Red Shard",     "Green Crystal"],
  grasslands: ["", "Silver Ingot",  "Azure Ingot",   "Gold Ingot",   "Silver Ingot", "Azure Ingot",   "Silver Ingot", "Silver Ingot", "Silver Ingot", "Orange Shard",  "Blue Crystal"],
  hills:      ["", "Gold Ingot",    "Iron Ingot",    "Azure Ingot",  "Gold Ingot",   "Iron Ingot",    "Gold Ingot",   "Gold Ingot",   "Gold Ingot",   "Indigo Shard",  "Green Shard"],
  jungles:    ["", "Azure Ingot",   "Bronze Ingot",  "Iron Ingot",   "Azure Ingot",  "Bronze Ingot",  "Azure Ingot",  "Azure Ingot",  "Azure Ingot",  "Yellow Shard",  "Indigo Shard"],
  marshlands: ["", "Bronze Ingot",  "Silver Ingot",  "Iron Ingot",   "Bronze Ingot", "Silver Ingot",  "Bronze Ingot", "Bronze Ingot", "Bronze Ingot", "Green Shard",   "Red Crystal"],
  mountains:  ["", "Silver Ingot",  "Gold Ingot",    "Bronze Ingot", "Silver Ingot", "Gold Ingot",    "Silver Ingot", "Silver Ingot", "Silver Ingot", "Blue Shard",    "Orange Crystal"],
  seas:       ["", "Gold Ingot",    "Azure Ingot",   "Silver Ingot", "Gold Ingot",   "Bronze Ingot",  "Gold Ingot",   "Gold Ingot",   "Gold Ingot",   "Blue Shard",    "Indigo Crystal"],
  swamps:     ["", "Azure Ingot",   "Iron Ingot",    "Gold Ingot",   "Azure Ingot",  "Iron Ingot",    "Azure Ingot",  "Azure Ingot",  "Azure Ingot",  "Red Shard",     "Yellow Crystal"],
  tundras:    ["", "Iron Ingot",    "Bronze Ingot",  "Azure Ingot",  "Iron Ingot",   "Bronze Ingot",  "Iron Ingot",   "Iron Ingot",   "Iron Ingot",   "Yellow Shard",  "Violet Crystal"],
};

/** Get the material name for a d10 roll in a given terrain */
export function getMiningMaterial(terrain: TerrainType, roll: number): string {
  if (roll < 1 || roll > 10) throw new Error(`Mining roll must be 1-10, got ${roll}`);
  return MINING_TABLE[terrain][roll];
}

/** Get the full material object by name */
export function getMaterial(name: string): MiningMaterial | undefined {
  return MATERIALS[name];
}
