// RB – RACE B (Book 8: The Forgotten Tome of Curious Rules)
// New playable races for character creation.

export type RaceBName = "Gnome" | "Dragon Scar" | "Half Orc" | "Wood Elf";

export interface RaceBEntry {
  minRoll: number;
  maxRoll: number;
  name: RaceBName;
  /** Modifiers applied to Primary characteristics at step 1 */
  primaryMods: { str: number; dex: number; int: number };
  /**
   * Stat assignment at step 1 (assign these fixed values to the three
   * characteristics in any order, rather than the standard 50/35/25).
   */
  statAssignment: [number, number, number];
  /** Skill bonuses granted at character creation */
  skillBonuses: Array<{ skill: string; bonus: number }>;
  /** Extra starting Fate Points (in addition to the standard 3) */
  extraFate: number;
  /** Override starting HP (0 = use standard 20) */
  startingHp: number;
  /** Override starting Life Points (0 = use standard 3) */
  startingLifePoints: number;
  /** Override starting Rep points (0 = use standard 1) */
  startingRep: number;
  /** Flavour text */
  description: string;
}

export const RACE_B_TABLE: RaceBEntry[] = [
  {
    minRoll: 1,
    maxRoll: 25,
    name: "Gnome",
    primaryMods: { str: -10, dex: +10, int: +10 },
    statAssignment: [50, 35, 25],
    skillBonuses: [
      { skill: "Dodge",    bonus: 5 },
      { skill: "Escape",   bonus: 5 },
      { skill: "Lucky",    bonus: 5 },
      { skill: "Magic",    bonus: 5 },
      { skill: "Fishing",  bonus: 5 }, // World Builder skill
    ],
    extraFate: 4,        // starts with 7 Fate instead of 3
    startingHp: 0,
    startingLifePoints: 0,
    startingRep: 0,
    description:
      "Small, resourceful, and magically gifted. Gnomes begin with 7 Fate Points " +
      "and assign 50/35/25 to their characteristics at creation.",
  },
  {
    minRoll: 26,
    maxRoll: 50,
    name: "Dragon Scar",
    primaryMods: { str: +5, dex: 0, int: +5 },
    statAssignment: [60, 30, 20],
    skillBonuses: [
      { skill: "Bravery", bonus: 5 },
      { skill: "Strong",  bonus: 5 },
      { skill: "Dodge",   bonus: 5 },
      { skill: "Escape",  bonus: 5 },
      { skill: "Haggle",  bonus: 5 },
    ],
    extraFate: 0,
    startingHp: 0,
    startingLifePoints: 0,
    startingRep: 1, // starts with 2 Rep instead of 1 (+1 extra)
    description:
      "Humans, dwarfs, or elves born with dragon-scale mutations. They assign " +
      "60/30/20 and begin with 2 Rep points.",
  },
  {
    minRoll: 51,
    maxRoll: 75,
    name: "Half Orc",
    primaryMods: { str: +15, dex: -5, int: 0 },
    statAssignment: [45, 35, 30],
    skillBonuses: [
      { skill: "Bravery",  bonus: 5 },
      { skill: "Strong",   bonus: 5 },
      { skill: "Hunting",  bonus: 5 }, // World Builder skill
      { skill: "Traps",    bonus: 5 },
      { skill: "Survival", bonus: 5 }, // World Builder skill
    ],
    extraFate: 0,
    startingHp: 24,   // 24 HP instead of 20
    startingLifePoints: 0,
    startingRep: 0,
    description:
      "Hardy and powerful. Half Orcs assign 45/35/30 and begin with 24 HP.",
  },
  {
    minRoll: 76,
    maxRoll: 100,
    name: "Wood Elf",
    primaryMods: { str: -5, dex: +15, int: 0 },
    statAssignment: [40, 30, 30],
    skillBonuses: [
      { skill: "Agility",  bonus: 5 },
      { skill: "Dodge",    bonus: 5 },
      { skill: "Escape",   bonus: 5 },
      { skill: "Fishing",  bonus: 5 }, // World Builder skill
      { skill: "Hunting",  bonus: 5 }, // World Builder skill
    ],
    extraFate: 0,
    startingHp: 0,
    startingLifePoints: 2, // 5 Life Points instead of 3 (+2 extra)
    startingRep: 0,
    description:
      "Swift and nature-attuned. Wood Elves assign 40/30/30 and begin with 5 Life Points.",
  },
];
