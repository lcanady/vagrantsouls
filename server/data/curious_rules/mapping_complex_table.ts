// MC – MAPPING COMPLEX TABLE (Book 8: The Forgotten Tome of Curious Rules)
// Used as an alternative to Table M for dungeon area generation.
// Each d100 result maps to a colour code that determines what happens in the area.

export type MCColour = "Yellow" | "Red" | "Green" | "Blue";

/**
 * Yellow = Nothing special
 * Red    = Roll on the current encounter table
 * Green  = Roll on Table G (Geographic feature)
 * Blue   = Objective area (see Quest)
 */
export const MC_COLOUR_MEANINGS: Record<MCColour, string> = {
  Yellow: "Nothing",
  Red:    "Roll Encounter",
  Green:  "Roll Geographic",
  Blue:   "Objective (see Quest)",
};

/** Lookup: d100 roll → colour */
const MC_RAW: Array<[number, MCColour]> = [
  [1,   "Yellow"], [2,   "Red"],    [3,   "Yellow"], [4,   "Red"],    [5,   "Yellow"],
  [6,   "Green"],  [7,   "Red"],    [8,   "Yellow"], [9,   "Green"],  [10,  "Red"],
  [11,  "Green"],  [12,  "Red"],    [13,  "Yellow"], [14,  "Green"],  [15,  "Red"],
  [16,  "Red"],    [17,  "Yellow"], [18,  "Red"],    [19,  "Yellow"], [20,  "Green"],
  [21,  "Yellow"], [22,  "Red"],    [23,  "Yellow"], [24,  "Yellow"], [25,  "Red"],
  [26,  "Green"],  [27,  "Yellow"], [28,  "Yellow"], [29,  "Yellow"], [30,  "Red"],
  [31,  "Red"],    [32,  "Yellow"], [33,  "Red"],    [34,  "Yellow"], [35,  "Green"],
  [36,  "Red"],    [37,  "Yellow"], [38,  "Red"],    [39,  "Green"],  [40,  "Yellow"],
  [41,  "Yellow"], [42,  "Red"],    [43,  "Yellow"], [44,  "Green"],  [45,  "Yellow"],
  [46,  "Red"],    [47,  "Yellow"], [48,  "Red"],    [49,  "Yellow"], [50,  "Red"],
  [51,  "Green"],  [52,  "Yellow"], [53,  "Red"],    [54,  "Green"],  [55,  "Yellow"],
  [56,  "Red"],    [57,  "Green"],  [58,  "Red"],    [59,  "Yellow"], [60,  "Red"],
  [61,  "Red"],    [62,  "Yellow"], [63,  "Green"],  [64,  "Yellow"], [65,  "Green"],
  [66,  "Yellow"], [67,  "Yellow"], [68,  "Green"],  [69,  "Red"],    [70,  "Yellow"],
  [71,  "Green"],  [72,  "Red"],    [73,  "Yellow"], [74,  "Red"],    [75,  "Yellow"],
  [76,  "Yellow"], [77,  "Red"],    [78,  "Yellow"], [79,  "Red"],    [80,  "Green"],
  [81,  "Red"],    [82,  "Yellow"], [83,  "Green"],  [84,  "Red"],    [85,  "Yellow"],
  [86,  "Red"],    [87,  "Yellow"], [88,  "Green"],  [89,  "Yellow"], [90,  "Red"],
  [91,  "Blue"],   [92,  "Blue"],   [93,  "Blue"],   [94,  "Blue"],   [95,  "Blue"],
  [96,  "Blue"],   [97,  "Blue"],   [98,  "Blue"],   [99,  "Blue"],   [100, "Blue"],
];

/** Flat lookup array indexed by roll (index 1-100, index 0 unused) */
export const MC_TABLE: MCColour[] = new Array(101).fill("Yellow");
for (const [roll, colour] of MC_RAW) {
  MC_TABLE[roll] = colour;
}

/** Convenience function: get the colour for a d100 roll (1-100) */
export function getMCResult(roll: number): MCColour {
  if (roll < 1 || roll > 100) throw new Error(`MC roll must be 1-100, got ${roll}`);
  return MC_TABLE[roll];
}
