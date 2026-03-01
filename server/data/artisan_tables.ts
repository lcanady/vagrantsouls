/**
 * Artisan Tables
 *
 * X1  – Salvage Armour
 * X2  – Salvage Weapons
 * X6  – Crafting Armour
 * X7  – Crafting Weapons
 * X10 – Contacts
 * X11 – Schematics
 *
 * Materials:
 *  Standard: "Wood/Bone", "Leather/Hide", "Iron"
 *  Upgraded: "Bronze/Silver/Gold", "Azure"
 *  Lessor:   "Wood/Bone Splinters", "Leather/Hide Scraps", "Iron Ingots",
 *             "Bronze/Silver/Gold Ingots", "Azure Ingots"
 */

export interface SalvageEntry {
  name: string;
  standard: { "Wood/Bone"?: number; "Leather/Hide"?: number; Iron?: number };
  finer:    { "Bronze/Silver/Gold"?: number; Azure?: number };
  greater:  { "Bronze/Silver/Gold"?: number; Azure?: number };
  superior: { "Bronze/Silver/Gold"?: number; Azure?: number };
  legend:   { "Bronze/Silver/Gold"?: number; Azure?: number };
}

export interface CraftEntry {
  name: string;
  standard: { "Wood/Bone"?: number; "Leather/Hide"?: number; Iron?: number };
  upgraded?: { "Bronze/Silver/Gold"?: number; Azure?: number };
  /** For prefix items requiring a schematic; modifier applied to crafting test */
  schematicModifier?: number;
}

// ── X1: Salvage Armour (key items) ──────────────────────────────────────────

export const SALVAGE_ARMOUR: SalvageEntry[] = [
  { name: "Buckler Shield",       standard: { "Wood/Bone": 4, "Leather/Hide": 1, Iron: 1 },             finer: { "Bronze/Silver/Gold": 1 }, greater: { "Bronze/Silver/Gold": 1 }, superior: { "Bronze/Silver/Gold": 1 }, legend: { "Bronze/Silver/Gold": 1 } },
  { name: "Heater Shield",        standard: { "Wood/Bone": 13, "Leather/Hide": 1, Iron: 2 },            finer: { "Bronze/Silver/Gold": 2 }, greater: { "Bronze/Silver/Gold": 2 }, superior: { "Bronze/Silver/Gold": 2 }, legend: { "Bronze/Silver/Gold": 2 } },
  { name: "Kite Shield",          standard: { "Wood/Bone": 19, "Leather/Hide": 1, Iron: 3 },            finer: { "Bronze/Silver/Gold": 2 }, greater: { "Bronze/Silver/Gold": 2 }, superior: { "Bronze/Silver/Gold": 2 }, legend: { "Bronze/Silver/Gold": 2 } },
  { name: "Leather Arm Guards",   standard: { "Leather/Hide": 1, Iron: 3 },                             finer: { "Bronze/Silver/Gold": 2 }, greater: { "Bronze/Silver/Gold": 2 }, superior: { "Bronze/Silver/Gold": 2 }, legend: { "Bronze/Silver/Gold": 2 } },
  { name: "Leather Boots",        standard: { "Leather/Hide": 3, Iron: 2 },                             finer: { "Bronze/Silver/Gold": 1 }, greater: { "Bronze/Silver/Gold": 1 }, superior: { "Bronze/Silver/Gold": 1 }, legend: { "Bronze/Silver/Gold": 1 } },
  { name: "Leather Cap",          standard: { "Leather/Hide": 4, Iron: 2 },                             finer: { "Bronze/Silver/Gold": 1 }, greater: { "Bronze/Silver/Gold": 1 }, superior: { "Bronze/Silver/Gold": 1 }, legend: { "Bronze/Silver/Gold": 1 } },
  { name: "Leather Cloak",        standard: { "Leather/Hide": 4, Iron: 3 },                             finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Leather Cuirass",      standard: { "Leather/Hide": 4, Iron: 3 },                             finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Leather Gauntlets",    standard: { "Leather/Hide": 4, Iron: 2 },                             finer: { "Bronze/Silver/Gold": 1 }, greater: { "Bronze/Silver/Gold": 1 }, superior: { "Bronze/Silver/Gold": 1 }, legend: { "Bronze/Silver/Gold": 1 } },
  { name: "Mail Coif",            standard: { "Wood/Bone": 2, Iron: 6 },                                finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 1 }, superior: { "Bronze/Silver/Gold": 1 }, legend: { "Bronze/Silver/Gold": 1 } },
  { name: "Mail Cuisse",          standard: { "Leather/Hide": 1, Iron: 2 },                             finer: { "Bronze/Silver/Gold": 5 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Mail Handwraps",       standard: { "Wood/Bone": 2, Iron: 5 },                                finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 1 }, superior: { "Bronze/Silver/Gold": 1 }, legend: { "Bronze/Silver/Gold": 1 } },
  { name: "Mail Shirt",           standard: { "Wood/Bone": 2, "Leather/Hide": 4, Iron: 5 },             finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Plate Mail Breastplate", standard: { "Wood/Bone": 3, "Leather/Hide": 9, Iron: 12 },          finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Scale Mail Hauberk",   standard: { "Wood/Bone": 2, "Leather/Hide": 4, Iron: 9 },             finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Studded Leather Brigandine", standard: { "Leather/Hide": 1, Iron: 3 },                       finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Targe Shield",         standard: { "Wood/Bone": 8, "Leather/Hide": 1 },                      finer: { "Bronze/Silver/Gold": 1 }, greater: { "Bronze/Silver/Gold": 1 }, superior: { "Bronze/Silver/Gold": 1 }, legend: { "Bronze/Silver/Gold": 1 } },
];

// ── X2: Salvage Weapons (key items) ─────────────────────────────────────────

export const SALVAGE_WEAPONS: SalvageEntry[] = [
  { name: "Arbalest",   standard: { "Wood/Bone": 11, Iron: 11 },                         finer: { "Bronze/Silver/Gold": 4 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Axe",        standard: { "Wood/Bone": 2, Iron: 7 },                           finer: { "Bronze/Silver/Gold": 2 }, greater: { "Bronze/Silver/Gold": 2 }, superior: { "Bronze/Silver/Gold": 2 }, legend: { "Bronze/Silver/Gold": 2 } },
  { name: "Bastard Sword", standard: { "Wood/Bone": 2, Iron: 17 },                       finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Battle Axe", standard: { "Wood/Bone": 3, "Leather/Hide": 2, Iron: 11 },      finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Bow",        standard: { "Wood/Bone": 6, "Leather/Hide": 5 },                finer: { "Bronze/Silver/Gold": 2 }, greater: { "Bronze/Silver/Gold": 2 }, superior: { "Bronze/Silver/Gold": 2 }, legend: { "Bronze/Silver/Gold": 2 } },
  { name: "Broadsword", standard: { "Wood/Bone": 1, Iron: 8 },                          finer: { "Bronze/Silver/Gold": 2 }, greater: { "Bronze/Silver/Gold": 2 }, superior: { "Bronze/Silver/Gold": 2 }, legend: { "Bronze/Silver/Gold": 2 } },
  { name: "Claymore",   standard: { "Wood/Bone": 3, Iron: 12 },                         finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Crossbow",   standard: { "Wood/Bone": 9, "Leather/Hide": 9 },                finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Dagger",     standard: { "Wood/Bone": 1, "Leather/Hide": 1, Iron: 1 },       finer: { "Bronze/Silver/Gold": 1 }, greater: { "Bronze/Silver/Gold": 1 }, superior: { "Bronze/Silver/Gold": 1 }, legend: { "Bronze/Silver/Gold": 1 } },
  { name: "Great Sword",standard: { "Wood/Bone": 2, Iron: 19 },                         finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Long Bow",   standard: { "Wood/Bone": 15, "Leather/Hide": 14 },              finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Long Sword", standard: { "Wood/Bone": 3, Iron: 11 },                         finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Mace",       standard: { "Wood/Bone": 2, "Leather/Hide": 1, Iron: 2 },       finer: { "Bronze/Silver/Gold": 1 }, greater: { "Bronze/Silver/Gold": 1 }, superior: { "Bronze/Silver/Gold": 1 }, legend: { "Bronze/Silver/Gold": 1 } },
  { name: "Maul",       standard: { "Wood/Bone": 3, "Leather/Hide": 2, Iron: 10 },      finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Mighty Claymore", standard: { "Wood/Bone": 3, "Leather/Hide": 0, Iron: 21 }, finer: { "Bronze/Silver/Gold": 3 }, greater: { "Bronze/Silver/Gold": 3 }, superior: { "Bronze/Silver/Gold": 3 }, legend: { "Bronze/Silver/Gold": 3 } },
  { name: "Quarterstaff", standard: { "Wood/Bone": 5, "Leather/Hide": 1 },              finer: { "Bronze/Silver/Gold": 1 }, greater: { "Bronze/Silver/Gold": 1 }, superior: { "Bronze/Silver/Gold": 1 }, legend: { "Bronze/Silver/Gold": 1 } },
  { name: "Short Sword", standard: { "Wood/Bone": 1, "Leather/Hide": 3, Iron: 1 },      finer: { "Bronze/Silver/Gold": 1 }, greater: { "Bronze/Silver/Gold": 1 }, superior: { "Bronze/Silver/Gold": 1 }, legend: { "Bronze/Silver/Gold": 1 } },
];

// ── X6: Crafting Armour (standard items, no schematic needed) ────────────────

export const CRAFT_ARMOUR: CraftEntry[] = [
  { name: "Buckler Shield",       standard: { "Wood/Bone": 5, "Leather/Hide": 2, Iron: 2 } },
  { name: "Heater Shield",        standard: { "Wood/Bone": 15, "Leather/Hide": 2, Iron: 4 } },
  { name: "Leather Boots",        standard: { "Leather/Hide": 4, Iron: 3 } },
  { name: "Leather Cap",          standard: { "Leather/Hide": 5, Iron: 3 } },
  { name: "Leather Cloak",        standard: { "Leather/Hide": 5, Iron: 4 } },
  { name: "Leather Cuirass",      standard: { "Leather/Hide": 5, Iron: 4 } },
  { name: "Leather Gauntlets",    standard: { "Leather/Hide": 5, Iron: 3 } },
  { name: "Mail Coif",            standard: { "Wood/Bone": 3, Iron: 8 } },
  { name: "Mail Handwraps",       standard: { "Wood/Bone": 4, Iron: 6 } },
  { name: "Mail Shirt",           standard: { "Wood/Bone": 4, "Leather/Hide": 10, Iron: 6 } },
  { name: "Plate Mail Breastplate", standard: { "Wood/Bone": 4, "Leather/Hide": 10, Iron: 6 } },
  { name: "Scale Mail Hauberk",   standard: { "Wood/Bone": 3, "Leather/Hide": 5, Iron: 10 } },
  { name: "Studded Leather Brigandine", standard: { "Leather/Hide": 2, Iron: 4 } },
  { name: "Targe Shield",         standard: { "Wood/Bone": 10, "Leather/Hide": 2 } },
];

// ── X7: Crafting Weapons (standard items, no schematic needed) ───────────────

export const CRAFT_WEAPONS: CraftEntry[] = [
  { name: "Axe",        standard: { "Wood/Bone": 3, Iron: 8 } },
  { name: "Bastard Sword", standard: { "Wood/Bone": 3, Iron: 18 } },
  { name: "Battle Axe", standard: { "Wood/Bone": 4, "Leather/Hide": 3, Iron: 12 } },
  { name: "Bow",        standard: { "Wood/Bone": 7, "Leather/Hide": 6 } },
  { name: "Broadsword", standard: { "Wood/Bone": 2, Iron: 9 } },
  { name: "Claymore",   standard: { "Wood/Bone": 4, Iron: 13 } },
  { name: "Crossbow",   standard: { "Wood/Bone": 10, "Leather/Hide": 10 } },
  { name: "Dagger",     standard: { "Wood/Bone": 2, "Leather/Hide": 2, Iron: 2 } },
  { name: "Great Sword", standard: { "Wood/Bone": 3, Iron: 20 } },
  { name: "Long Bow",   standard: { "Wood/Bone": 16, "Leather/Hide": 15 } },
  { name: "Long Sword", standard: { "Wood/Bone": 4, Iron: 12 } },
  { name: "Mace",       standard: { "Wood/Bone": 3, "Leather/Hide": 2, Iron: 3 } },
  { name: "Maul",       standard: { "Wood/Bone": 4, "Leather/Hide": 3, Iron: 11 } },
  { name: "Quarterstaff", standard: { "Wood/Bone": 6, "Leather/Hide": 2 } },
  { name: "Short Sword", standard: { "Wood/Bone": 2, "Leather/Hide": 4, Iron: 2 } },
];

// Combined salvage lookup
export const ALL_SALVAGE_ENTRIES: SalvageEntry[] = [
  ...SALVAGE_ARMOUR,
  ...SALVAGE_WEAPONS,
];

// Combined craft lookup
export const ALL_CRAFT_ENTRIES: CraftEntry[] = [
  ...CRAFT_ARMOUR,
  ...CRAFT_WEAPONS,
];

/** Material hierarchy for conversion (1 full = 10 lesser) */
export const MATERIAL_HIERARCHY: Record<string, string> = {
  "Wood/Bone Splinters": "Wood/Bone",
  "Leather/Hide Scraps":  "Leather/Hide",
  "Iron Ingots":          "Iron",
  "Bronze/Silver/Gold Ingots": "Bronze/Silver/Gold",
  "Azure Ingots":         "Azure",
};

/** Reverse hierarchy: full → lesser */
export const MATERIAL_HIERARCHY_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(MATERIAL_HIERARCHY).map(([lesser, full]) => [full, lesser]),
);

export function findSalvageEntry(itemName: string): SalvageEntry | undefined {
  const lower = itemName.toLowerCase();
  return ALL_SALVAGE_ENTRIES.find(e => e.name.toLowerCase() === lower ||
    lower.includes(e.name.toLowerCase()));
}

export function findCraftEntry(itemName: string): CraftEntry | undefined {
  const lower = itemName.toLowerCase();
  return ALL_CRAFT_ENTRIES.find(e => e.name.toLowerCase() === lower ||
    lower.includes(e.name.toLowerCase()));
}
