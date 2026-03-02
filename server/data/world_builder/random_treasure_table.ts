// (WB) RT – RANDOM TREASURE TABLE
// Roll 1d10 to determine which table to roll on for a random treasure reward

export interface RandomTreasureEntry {
  roll: number;
  /** Name of the table to roll on (e.g. "P1", "A", "W", "I", "TB", "TC", "TA") */
  table: string;
  /** Additional gold added to the item value */
  goldBonus: number;
  /** Description for players */
  description: string;
}

export const RANDOM_TREASURE_TABLE: RandomTreasureEntry[] = [
  { roll: 1,  table: "P",      goldBonus: 20, description: "Roll on table P +20gp" },
  { roll: 2,  table: "I",      goldBonus: 20, description: "Roll on table I +20gp" },
  { roll: 3,  table: "N",      goldBonus: 20, description: "Roll on table N +20gp" },
  { roll: 4,  table: "A",      goldBonus: 20, description: "Roll on table A +20gp" },
  { roll: 5,  table: "W",      goldBonus: 20, description: "Roll on table W +20gp" },
  { roll: 6,  table: "S",      goldBonus: 0,  description: "Roll on table S" },
  { roll: 7,  table: "TA",     goldBonus: 0,  description: "Roll on table TA" },
  { roll: 8,  table: "TB",     goldBonus: 0,  description: "Roll on table TB" },
  { roll: 9,  table: "TC",     goldBonus: 0,  description: "Roll on table TC" },
  { roll: 10, table: "choice", goldBonus: 0,  description: "Roll on table TA, TB, TC, or TD (player's choice, TD requires The Lost Tome)" },
];

export function getRandomTreasureEntry(roll: number): RandomTreasureEntry {
  const entry = RANDOM_TREASURE_TABLE.find((e) => e.roll === roll);
  if (!entry) throw new Error(`Invalid random treasure roll: ${roll}`);
  return entry;
}

/**
 * The player may forfeit rolls to add +1 to a remaining roll.
 * This modifier is cumulative.
 * Example: forfeit 3 of 4 rolls → +3 modifier to the 4th roll.
 */
export function applyForfeitBonus(baseRoll: number, forfeitCount: number): number {
  return Math.min(baseRoll + forfeitCount, 10);
}
