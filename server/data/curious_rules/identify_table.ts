// IB – IDENTIFY B TABLE (Book 8: The Forgotten Tome of Curious Rules)
// Roll d100 within the correct item group to reveal the item's identity.

export type IdentifyItemType =
  | "brew_lesser" | "brew_finer" | "brew_greater" | "brew_superior" | "brew_exceptional"
  | "potion_lesser" | "potion_finer" | "potion_greater" | "potion_superior" | "potion_exceptional"
  | "elixir_finer" | "elixir_greater" | "elixir_superior" | "elixir_exceptional"
  | "legendary";

export interface IdentifyEntry {
  minRoll: number;
  maxRoll: number;
  /** Full item name after identification */
  name: string;
  /** GP value (0 for cursed) */
  value: number;
  effect: string;
  /** True if this result is a cursed item — roll on CURSED_ITEMS with offset */
  cursed?: true;
  /** d100 offset to add when rolling on CURSED_ITEMS sub-table */
  cursedOffset?: number;
}

// ─── CURSED ITEMS SUB-TABLE ───────────────────────────────────────────────────
// When a cursed result is rolled, add the group's offset and roll 1-100 on this table.

export interface CursedItemEntry {
  minRoll: number;
  maxRoll: number;
  suffix: string;   // "(of) CURSED X" — prepend "of" for legendary items
  effect: string;
}

export const CURSED_ITEMS: CursedItemEntry[] = [
  { minRoll: 1,   maxRoll: 3,   suffix: "CURSED WRATH",         effect: "Whilst cursed -5 adjusted Str, -5 adjusted Dex, -5 adjusted Int, and -5 adjusted HP." },
  { minRoll: 4,   maxRoll: 6,   suffix: "CURSED ABILITY",       effect: "Whilst cursed all skills suffer -5 skill bonus." },
  { minRoll: 7,   maxRoll: 9,   suffix: "CURSED ENLIGHTENMENT", effect: "Whilst cursed no experience points are gained." },
  { minRoll: 10,  maxRoll: 12,  suffix: "CURSED CLUMSINESS",    effect: "Whilst cursed shade in 1 additional damage pip when an item suffers damage." },
  { minRoll: 13,  maxRoll: 15,  suffix: "CURSED TIME",          effect: "Whilst cursed each clock shaded on the time track roll 1d6. On a roll of 6 suffer -2HP." },
  { minRoll: 16,  maxRoll: 18,  suffix: "CURSED ATTRACTION",    effect: "Whilst cursed add +1 to the wandering monster value on the time track." },
  { minRoll: 19,  maxRoll: 21,  suffix: "CURSED RESISTANCE",    effect: "Whilst cursed shade in 1 additional damage pip when the adventurer suffers poison or disease." },
  { minRoll: 22,  maxRoll: 24,  suffix: "CURSED MAGIC",         effect: "Whilst cursed all spell costs are doubled." },
  { minRoll: 25,  maxRoll: 27,  suffix: "CURSED DANGER",        effect: "Whilst cursed the most current encounter modifier gains +10." },
  { minRoll: 28,  maxRoll: 30,  suffix: "CURSED WEAKNESS",      effect: "Whilst cursed -5 adjusted HP." },
  { minRoll: 31,  maxRoll: 33,  suffix: "CURSED STRENGTH",      effect: "Whilst cursed -5 adjusted Str." },
  { minRoll: 34,  maxRoll: 36,  suffix: "CURSED DEXTERITY",     effect: "Whilst cursed -5 adjusted Dex." },
  { minRoll: 37,  maxRoll: 39,  suffix: "CURSED INTELLIGENCE",  effect: "Whilst cursed -5 adjusted Int." },
  { minRoll: 40,  maxRoll: 42,  suffix: "CURSED DAMAGE",        effect: "Whilst cursed -2 Dmg." },
  { minRoll: 43,  maxRoll: 45,  suffix: "CURSED DEFENCE",       effect: "Whilst cursed -1 DEF." },
  { minRoll: 46,  maxRoll: 48,  suffix: "CURSED DISEASE",       effect: "Whilst cursed shade in 1 additional damage pip when the adventurer suffers disease." },
  { minRoll: 49,  maxRoll: 51,  suffix: "CURSED POISON",        effect: "Whilst cursed shade in 1 additional damage pip when the adventurer suffers poison." },
  { minRoll: 52,  maxRoll: 54,  suffix: "CURSED AGILITY",       effect: "Whilst cursed -5 Agility skill bonus." },
  { minRoll: 55,  maxRoll: 57,  suffix: "CURSED AWARENESS",     effect: "Whilst cursed -5 Aware skill bonus." },
  { minRoll: 58,  maxRoll: 60,  suffix: "CURSED BRAVERY",       effect: "Whilst cursed -5 Bravery skill bonus." },
  { minRoll: 61,  maxRoll: 63,  suffix: "CURSED DODGE",         effect: "Whilst cursed -5 Dodge skill bonus." },
  { minRoll: 64,  maxRoll: 66,  suffix: "CURSED ESCAPING",      effect: "Whilst cursed -5 Escape skill bonus." },
  { minRoll: 67,  maxRoll: 69,  suffix: "CURSED LOCK PICKING",  effect: "Whilst cursed -5 Locks skill bonus." },
  { minRoll: 70,  maxRoll: 72,  suffix: "CURSED LUCK",          effect: "Whilst cursed -5 Luck skill bonus." },
  { minRoll: 73,  maxRoll: 75,  suffix: "CURSED MAGIC",         effect: "Whilst cursed -5 Magic skill bonus." },
  { minRoll: 76,  maxRoll: 78,  suffix: "CURSED POWER",         effect: "Whilst cursed -5 Strong skill bonus." },
  { minRoll: 79,  maxRoll: 81,  suffix: "CURSED TRAPS",         effect: "Whilst cursed -5 Traps skill bonus." },
  { minRoll: 82,  maxRoll: 84,  suffix: "CURSED REPAIR",        effect: "Whilst cursed all items cost double GP to repair their damage pips." },
  { minRoll: 85,  maxRoll: 87,  suffix: "CURSED PROTECTION",    effect: "Whilst cursed all encountered monsters gain +2 Dmg bonus." },
  { minRoll: 88,  maxRoll: 90,  suffix: "CURSED COMBAT",        effect: "Whilst cursed all encountered monsters gain +10 AV." },
  { minRoll: 91,  maxRoll: 93,  suffix: "CURSED PARRY",         effect: "Whilst cursed when the monster rolls for a location in combat roll the D6." },
  { minRoll: 94,  maxRoll: 96,  suffix: "CURSED SPELLS",        effect: "Whilst cursed before casting a spell, roll 1d6; on a result of 6 remove the spell from the spell book." },
  { minRoll: 97,  maxRoll: 100, suffix: "CURSED WEALTH",        effect: "Whilst cursed all gold gained whilst on a quest is halved (rounding down)." },
];

// ─── ITEM TABLES ──────────────────────────────────────────────────────────────

export const IDENTIFY_TABLES: Record<IdentifyItemType, IdentifyEntry[]> = {

  brew_lesser: [
    { minRoll: 1,  maxRoll: 10,  name: "Brew of Lesser Cursed",   value: 0,   effect: "Roll on CURSED ITEMS +25.", cursed: true, cursedOffset: 25 },
    { minRoll: 11, maxRoll: 28,  name: "Brew of Lesser Dmg",      value: 35,  effect: "Drink to gain +1 Dmg to your next damage roll." },
    { minRoll: 29, maxRoll: 46,  name: "Brew of Lesser Str",      value: 45,  effect: "Drink to gain +3 Str to your next d100 dice roll." },
    { minRoll: 47, maxRoll: 64,  name: "Brew of Lesser Dex",      value: 45,  effect: "Drink to gain +3 Dex to your next d100 dice roll." },
    { minRoll: 65, maxRoll: 82,  name: "Brew of Lesser Int",      value: 45,  effect: "Drink to gain +3 Int to your next d100 dice roll." },
    { minRoll: 83, maxRoll: 100, name: "Brew of Lesser Def",      value: 50,  effect: "Drink to gain +1 Def on a Monster's next damage roll." },
  ],

  brew_finer: [
    { minRoll: 1,  maxRoll: 10,  name: "Brew of Finer Cursed",    value: 0,   effect: "Roll on CURSED ITEMS +20.", cursed: true, cursedOffset: 20 },
    { minRoll: 11, maxRoll: 28,  name: "Brew of Finer Dmg",       value: 70,  effect: "Drink to gain +2 Dmg to your next damage roll." },
    { minRoll: 29, maxRoll: 46,  name: "Brew of Finer Str",       value: 75,  effect: "Drink to gain +5 Str to your next d100 dice roll." },
    { minRoll: 47, maxRoll: 64,  name: "Brew of Finer Dex",       value: 75,  effect: "Drink to gain +5 Dex to your next d100 dice roll." },
    { minRoll: 65, maxRoll: 82,  name: "Brew of Finer Int",       value: 75,  effect: "Drink to gain +5 Int to your next d100 dice roll." },
    { minRoll: 83, maxRoll: 100, name: "Brew of Finer Def",       value: 100, effect: "Drink to gain +2 Def on a Monster's next damage roll." },
  ],

  brew_greater: [
    { minRoll: 1,  maxRoll: 10,  name: "Brew of Greater Cursed",  value: 0,   effect: "Roll on CURSED ITEMS +15.", cursed: true, cursedOffset: 15 },
    { minRoll: 11, maxRoll: 28,  name: "Brew of Greater Dmg",     value: 105, effect: "Drink to gain +3 Dmg to your next damage roll." },
    { minRoll: 29, maxRoll: 46,  name: "Brew of Greater Def",     value: 150, effect: "Drink to gain +3 Def on a Monster's next damage roll." },
    { minRoll: 47, maxRoll: 64,  name: "Brew of Greater Str",     value: 150, effect: "Drink to gain +10 Str to your next d100 dice roll." },
    { minRoll: 65, maxRoll: 82,  name: "Brew of Greater Dex",     value: 150, effect: "Drink to gain +10 Dex to your next d100 dice roll." },
    { minRoll: 83, maxRoll: 100, name: "Brew of Greater Int",     value: 150, effect: "Drink to gain +10 Int to your next d100 dice roll." },
  ],

  brew_superior: [
    { minRoll: 1,  maxRoll: 10,  name: "Brew of Superior Cursed", value: 0,   effect: "Roll on CURSED ITEMS +10.", cursed: true, cursedOffset: 10 },
    { minRoll: 11, maxRoll: 28,  name: "Brew of Superior Dmg",    value: 140, effect: "Drink to gain +4 Dmg to your next damage roll." },
    { minRoll: 29, maxRoll: 46,  name: "Brew of Superior Def",    value: 200, effect: "Drink to gain +4 Def on a Monster's next damage roll." },
    { minRoll: 47, maxRoll: 64,  name: "Brew of Superior Str",    value: 225, effect: "Drink to gain +15 Str to your next d100 dice roll." },
    { minRoll: 65, maxRoll: 82,  name: "Brew of Superior Dex",    value: 225, effect: "Drink to gain +15 Dex to your next d100 dice roll." },
    { minRoll: 83, maxRoll: 100, name: "Brew of Superior Int",    value: 225, effect: "Drink to gain +15 Int to your next d100 dice roll." },
  ],

  brew_exceptional: [
    { minRoll: 1,  maxRoll: 10,  name: "Brew of Exceptional Cursed", value: 0,   effect: "Roll on CURSED ITEMS +5.", cursed: true, cursedOffset: 5 },
    { minRoll: 11, maxRoll: 28,  name: "Brew of Exceptional Dmg",    value: 175, effect: "Drink to gain +5 Dmg to your next damage roll." },
    { minRoll: 29, maxRoll: 46,  name: "Brew of Exceptional Def",    value: 250, effect: "Drink to gain +5 Def on a monster's next damage roll." },
    { minRoll: 47, maxRoll: 64,  name: "Brew of Exceptional Str",    value: 300, effect: "Drink to gain +20 Str to the next d100 dice roll." },
    { minRoll: 65, maxRoll: 82,  name: "Brew of Exceptional Dex",    value: 300, effect: "Drink to gain +20 Dex to the next d100 dice roll." },
    { minRoll: 83, maxRoll: 100, name: "Brew of Exceptional Int",    value: 300, effect: "Drink to gain +20 Int to the next d100 dice roll." },
  ],

  potion_lesser: [
    { minRoll: 1,  maxRoll: 10,  name: "Potion of Lesser Cursed",          value: 0,   effect: "Roll on CURSED ITEMS +20.", cursed: true, cursedOffset: 20 },
    { minRoll: 11, maxRoll: 22,  name: "Potion of Lesser Remove Poison",   value: 80,  effect: "Drink to remove up to 2 shaded pips on the Poison Track." },
    { minRoll: 23, maxRoll: 35,  name: "Potion of Lesser Healing",         value: 80,  effect: "Drink to restore up to 4 lost HP." },
    { minRoll: 36, maxRoll: 48,  name: "Potion of Lesser Str",             value: 90,  effect: "Drink to gain +3 Str until you next shade a clock on the Time Track." },
    { minRoll: 49, maxRoll: 61,  name: "Potion of Lesser Dex",             value: 90,  effect: "Drink to gain +3 Dex until you next shade a clock on the Time Track." },
    { minRoll: 62, maxRoll: 74,  name: "Potion of Lesser Int",             value: 90,  effect: "Drink to gain +3 Int until you next shade a clock on the Time Track." },
    { minRoll: 75, maxRoll: 87,  name: "Potion of Lesser Cure Disease",    value: 130, effect: "Drink to remove up to 2 shaded pips on the Disease Track." },
    { minRoll: 88, maxRoll: 100, name: "Potion of Lesser Fate",            value: 400, effect: "Drink to add +20 to a result when rolling on the next table." },
  ],

  potion_finer: [
    { minRoll: 1,  maxRoll: 10,  name: "Potion of Finer Cursed",           value: 0,   effect: "Roll on CURSED ITEMS +15.", cursed: true, cursedOffset: 15 },
    { minRoll: 11, maxRoll: 22,  name: "Potion of Finer Str",              value: 150, effect: "Drink to gain +5 Str until you next shade a clock on the Time Track." },
    { minRoll: 23, maxRoll: 35,  name: "Potion of Finer Dex",              value: 150, effect: "Drink to gain +5 Dex until you next shade a clock on the Time Track." },
    { minRoll: 36, maxRoll: 48,  name: "Potion of Finer Int",              value: 150, effect: "Drink to gain +5 Int until you next shade a clock on the Time Track." },
    { minRoll: 49, maxRoll: 61,  name: "Potion of Finer Remove Poison",    value: 160, effect: "Drink to remove up to 4 shaded pips on the Poison Track." },
    { minRoll: 62, maxRoll: 74,  name: "Potion of Finer Healing",          value: 160, effect: "Drink to restore up to 8 lost HP." },
    { minRoll: 75, maxRoll: 87,  name: "Potion of Finer Cure Disease",     value: 260, effect: "Drink to remove up to 4 shaded pips on the Disease Track." },
    { minRoll: 88, maxRoll: 100, name: "Potion of Finer Fate",             value: 800, effect: "Drink to add +40 to a result when rolling on the next table." },
  ],

  potion_greater: [
    { minRoll: 1,  maxRoll: 10,  name: "Potion of Greater Cursed",         value: 0,   effect: "Roll on CURSED ITEMS +10.", cursed: true, cursedOffset: 10 },
    { minRoll: 11, maxRoll: 22,  name: "Potion of Greater Remove Poison",  value: 240, effect: "Drink to remove up to 6 shaded pips on the Poison Track." },
    { minRoll: 23, maxRoll: 35,  name: "Potion of Greater Healing",        value: 240, effect: "Drink to restore up to 12 lost HP." },
    { minRoll: 36, maxRoll: 48,  name: "Potion of Greater Str",            value: 300, effect: "Drink to gain +10 Str until you next shade a clock on the Time Track." },
    { minRoll: 49, maxRoll: 61,  name: "Potion of Greater Dex",            value: 300, effect: "Drink to gain +10 Dex until you next shade a clock on the Time Track." },
    { minRoll: 62, maxRoll: 74,  name: "Potion of Greater Int",            value: 300, effect: "Drink to gain +10 Int until you next shade a clock on the Time Track." },
    { minRoll: 75, maxRoll: 87,  name: "Potion of Greater Cure Disease",   value: 390, effect: "Drink to remove up to 6 shaded pips on the Disease Track." },
    { minRoll: 88, maxRoll: 100, name: "Potion of Greater Fate",           value: 1200, effect: "Drink to add +60 to a result when rolling on the next table." },
  ],

  potion_superior: [
    { minRoll: 1,  maxRoll: 10,  name: "Potion of Superior Cursed",        value: 0,   effect: "Roll on CURSED ITEMS +5.", cursed: true, cursedOffset: 5 },
    { minRoll: 11, maxRoll: 22,  name: "Potion of Superior Remove Poison", value: 320, effect: "Drink to remove up to 8 shaded pips on the Poison Track." },
    { minRoll: 23, maxRoll: 35,  name: "Potion of Superior Healing",       value: 320, effect: "Drink to restore up to 16 lost HP." },
    { minRoll: 36, maxRoll: 48,  name: "Potion of Superior Str",           value: 450, effect: "Drink to gain +15 Str until you next shade a clock on the Time Track." },
    { minRoll: 49, maxRoll: 61,  name: "Potion of Superior Dex",           value: 450, effect: "Drink to gain +15 Dex until you next shade a clock on the Time Track." },
    { minRoll: 62, maxRoll: 74,  name: "Potion of Superior Int",           value: 450, effect: "Drink to gain +15 Int until you next shade a clock on the Time Track." },
    { minRoll: 75, maxRoll: 87,  name: "Potion of Superior Cure Disease",  value: 520, effect: "Drink to remove up to 8 shaded pips on the Disease Track." },
    { minRoll: 88, maxRoll: 100, name: "Potion of Superior Fate",          value: 1600, effect: "Drink to add +80 to a result when rolling on the next table." },
  ],

  potion_exceptional: [
    { minRoll: 1,  maxRoll: 10,  name: "Potion of Exceptional Cursed",         value: 0,   effect: "Roll on CURSED ITEMS +0.", cursed: true, cursedOffset: 0 },
    { minRoll: 11, maxRoll: 22,  name: "Potion of Exceptional Remove Poison",  value: 400, effect: "Drink to remove all shaded pips from the Poison Track." },
    { minRoll: 23, maxRoll: 35,  name: "Potion of Exceptional Healing",        value: 400, effect: "Drink to restore up to 20 lost HP." },
    { minRoll: 36, maxRoll: 48,  name: "Potion of Exceptional Str",            value: 600, effect: "Drink to gain +20 Str until you next shade a clock on the Time Track." },
    { minRoll: 49, maxRoll: 61,  name: "Potion of Exceptional Dex",            value: 600, effect: "Drink to gain +20 Dex until you next shade a clock on the Time Track." },
    { minRoll: 62, maxRoll: 74,  name: "Potion of Exceptional Int",            value: 600, effect: "Drink to gain +20 Int until you next shade a clock on the Time Track." },
    { minRoll: 75, maxRoll: 87,  name: "Potion of Exceptional Cure Disease",   value: 650, effect: "Drink to remove all shaded pips from the Disease track." },
    { minRoll: 88, maxRoll: 100, name: "Potion of Exceptional Fate",           value: 2000, effect: "Drink to add +100 or -100 to a result when rolling on the next table." },
  ],

  elixir_finer: [
    { minRoll: 1,  maxRoll: 10,  name: "Elixir of Finer Cursed",  value: 0,    effect: "Roll on CURSED ITEMS +15.", cursed: true, cursedOffset: 15 },
    { minRoll: 11, maxRoll: 25,  name: "Elixir of Finer Fate",    value: 200,  effect: "Drink to gain 1 Fate Point." },
    { minRoll: 26, maxRoll: 40,  name: "Elixir of Finer Str",     value: 300,  effect: "Drink to gain 1 point of Primary Str." },
    { minRoll: 41, maxRoll: 55,  name: "Elixir of Finer Dex",     value: 300,  effect: "Drink to gain 1 point of Primary Dex." },
    { minRoll: 56, maxRoll: 70,  name: "Elixir of Finer Int",     value: 300,  effect: "Drink to gain 1 point of Primary Int." },
    { minRoll: 71, maxRoll: 85,  name: "Elixir of Finer Health",  value: 400,  effect: "Drink to gain 1 point of Primary HP." },
    { minRoll: 86, maxRoll: 100, name: "Elixir of Finer Life",    value: 1000, effect: "Drink to gain 1 Life Point." },
  ],

  elixir_greater: [
    { minRoll: 1,  maxRoll: 10,  name: "Elixir of Greater Cursed", value: 0,    effect: "Roll on CURSED ITEMS +10.", cursed: true, cursedOffset: 10 },
    { minRoll: 11, maxRoll: 25,  name: "Elixir of Greater Fate",   value: 400,  effect: "Drink to gain 2 Fate Points." },
    { minRoll: 26, maxRoll: 40,  name: "Elixir of Greater Health", value: 800,  effect: "Drink to gain 2 points of Primary HP." },
    { minRoll: 41, maxRoll: 55,  name: "Elixir of Greater Str",    value: 900,  effect: "Drink to gain 3 points of Primary Str." },
    { minRoll: 56, maxRoll: 70,  name: "Elixir of Greater Dex",    value: 900,  effect: "Drink to gain 3 points of Primary Dex." },
    { minRoll: 71, maxRoll: 85,  name: "Elixir of Greater Int",    value: 900,  effect: "Drink to gain 3 points of Primary Int." },
    { minRoll: 86, maxRoll: 100, name: "Elixir of Greater Life",   value: 3000, effect: "Drink to gain 3 Life Points." },
  ],

  elixir_superior: [
    { minRoll: 1,  maxRoll: 10,  name: "Elixir of Superior Cursed", value: 0,    effect: "Roll on CURSED ITEMS +5.", cursed: true, cursedOffset: 5 },
    { minRoll: 11, maxRoll: 25,  name: "Elixir of Superior Fate",   value: 600,  effect: "Drink to gain 3 Fate Points." },
    { minRoll: 26, maxRoll: 40,  name: "Elixir of Superior Health", value: 1200, effect: "Drink to gain 3 points of Primary HP." },
    { minRoll: 41, maxRoll: 55,  name: "Elixir of Superior Str",    value: 1500, effect: "Drink to gain 5 points of Primary Str." },
    { minRoll: 56, maxRoll: 70,  name: "Elixir of Superior Dex",    value: 1500, effect: "Drink to gain 5 points of Primary Dex." },
    { minRoll: 71, maxRoll: 85,  name: "Elixir of Superior Int",    value: 1500, effect: "Drink to gain 5 points of Primary Int." },
    { minRoll: 86, maxRoll: 100, name: "Elixir of Superior Life",   value: 5000, effect: "Drink to gain 5 Life Points." },
  ],

  elixir_exceptional: [
    { minRoll: 1,  maxRoll: 10,  name: "Elixir of Exceptional Cursed",    value: 0,    effect: "Roll on CURSED ITEMS +0.", cursed: true, cursedOffset: 0 },
    { minRoll: 11, maxRoll: 15,  name: "Elixir of Exceptional Agility",   value: 500,  effect: "Drink to gain +5 to the Agility skill." },
    { minRoll: 16, maxRoll: 21,  name: "Elixir of Exceptional Awareness", value: 500,  effect: "Drink to gain +5 to the Aware skill." },
    { minRoll: 22, maxRoll: 26,  name: "Elixir of Exceptional Bravery",   value: 500,  effect: "Drink to gain +5 to the Bravery skill." },
    { minRoll: 27, maxRoll: 32,  name: "Elixir of Exceptional Dodge",     value: 500,  effect: "Drink to gain +5 to the Dodge skill." },
    { minRoll: 33, maxRoll: 38,  name: "Elixir of Exceptional Escape",    value: 500,  effect: "Drink to gain +5 to the Escape skill." },
    { minRoll: 39, maxRoll: 43,  name: "Elixir of Exceptional Locks",     value: 500,  effect: "Drink to gain +5 to the Locks skill." },
    { minRoll: 44, maxRoll: 49,  name: "Elixir of Exceptional Luck",      value: 500,  effect: "Drink to gain +5 to the Lucky skill." },
    { minRoll: 50, maxRoll: 54,  name: "Elixir of Exceptional Magic",     value: 500,  effect: "Drink to gain +5 to the Magic skill." },
    { minRoll: 55, maxRoll: 60,  name: "Elixir of Exceptional Strength",  value: 500,  effect: "Drink to gain +5 to the Strong skill." },
    { minRoll: 61, maxRoll: 66,  name: "Elixir of Exceptional Traps",     value: 500,  effect: "Drink to gain +5 to the Traps skill." },
    { minRoll: 67, maxRoll: 71,  name: "Elixir of Exceptional Fate",      value: 800,  effect: "Drink to gain 4 Fate Points." },
    { minRoll: 72, maxRoll: 77,  name: "Elixir of Exceptional Health",    value: 1600, effect: "Drink to gain 4 points of primary HP." },
    { minRoll: 78, maxRoll: 83,  name: "Elixir of Exceptional Str",       value: 2100, effect: "Drink to gain 7 points of primary Str." },
    { minRoll: 84, maxRoll: 88,  name: "Elixir of Exceptional Dex",       value: 2100, effect: "Drink to gain 7 points of primary Dex." },
    { minRoll: 89, maxRoll: 94,  name: "Elixir of Exceptional Int",       value: 2100, effect: "Drink to gain 7 points of primary Int." },
    { minRoll: 95, maxRoll: 100, name: "Elixir of Exceptional Life",      value: 7000, effect: "Drink to gain 7 Life points." },
  ],

  legendary: [
    { minRoll: 1,  maxRoll: 10,  name: "CURSED",                      value: 0,    effect: "Roll on CURSED ITEMS -5.", cursed: true, cursedOffset: -5 },
    { minRoll: 11, maxRoll: 15,  name: "LEGEND of the Crab",          value: 500,  effect: "+1 Def. (500gp/100gp)" },
    { minRoll: 16, maxRoll: 19,  name: "LEGEND of the Sky",           value: 750,  effect: "+5 Int. (750gp/150gp)" },
    { minRoll: 20, maxRoll: 23,  name: "LEGEND of the Bear",          value: 750,  effect: "+5 Str. (750gp/150gp)" },
    { minRoll: 24, maxRoll: 27,  name: "LEGEND of the Spider",        value: 750,  effect: "+5 Dex. (750gp/150gp)" },
    { minRoll: 28, maxRoll: 31,  name: "LEGEND of the Giants",        value: 900,  effect: "+3 Dmg. (900gp/180gp)" },
    { minRoll: 32, maxRoll: 35,  name: "LEGEND of the Turtle",        value: 1000, effect: "+2 Def. (1000gp/200gp)" },
    { minRoll: 36, maxRoll: 39,  name: "LEGEND of the Lords",         value: 1200, effect: "+3 HP. (1200gp/240gp)" },
    { minRoll: 40, maxRoll: 43,  name: "LEGEND of the Colossus",      value: 1200, effect: "+4 Dmg. (1200gp/240gp)" },
    { minRoll: 44, maxRoll: 51,  name: "SPELL",                       value: 1200, effect: "Roll on Table S for a spell imbued into the item. (1200gp/240gp)" },
    { minRoll: 52, maxRoll: 55,  name: "LEGEND of the Stars",         value: 1500, effect: "+10 Int. (1500gp/300gp)" },
    { minRoll: 56, maxRoll: 60,  name: "LEGEND of the Ox",            value: 1500, effect: "+10 Str. (1500gp/300gp)" },
    { minRoll: 61, maxRoll: 64,  name: "LEGEND of the Cobra",         value: 1500, effect: "+10 Dex. (1500gp/300gp)" },
    { minRoll: 65, maxRoll: 68,  name: "LEGEND of the Titans",        value: 1500, effect: "+5 Dmg. (1500gp/300gp)" },
    { minRoll: 69, maxRoll: 72,  name: "LEGEND of the Dragon",        value: 1500, effect: "+3 Def. (1500gp/300gp)" },
    { minRoll: 73, maxRoll: 76,  name: "LEGEND of the Gorilla",       value: 2250, effect: "+15 Str. (2250gp/450gp)" },
    { minRoll: 77, maxRoll: 80,  name: "LEGEND of the Scorpion",      value: 2250, effect: "+15 Dex. (2250gp/450gp)" },
    { minRoll: 81, maxRoll: 84,  name: "LEGEND of the Moon",          value: 2250, effect: "+15 Int. (2250gp/450gp)" },
    { minRoll: 85, maxRoll: 88,  name: "LEGEND of the Kings",         value: 2400, effect: "+6 HP. (2400gp/480gp)" },
    { minRoll: 89, maxRoll: 92,  name: "LEGEND of the Cheetah",       value: 3000, effect: "+20 Dex. (3000gp/600gp)" },
    { minRoll: 93, maxRoll: 96,  name: "LEGEND of the Sun",           value: 3000, effect: "+20 Int. (3000gp/600gp)" },
    { minRoll: 97, maxRoll: 98,  name: "LEGEND of the Lion",          value: 3000, effect: "+20 Str. (3000gp/600gp)" },
    { minRoll: 99, maxRoll: 100, name: "LEGEND of the Gods",          value: 3600, effect: "+9 HP. (3600gp/720gp)" },
  ],
};

// ─── UNIDENTIFIED ITEM VALUES ─────────────────────────────────────────────────

export interface UnidentifiedValue {
  brews: number;
  potions: number;
  elixirs: number;
}

export const UNIDENTIFIED_VALUES: Record<string, UnidentifiedValue> = {
  lesser:     { brews: 15,   potions: 50,  elixirs: 0     },
  finer:      { brews: 30,   potions: 110, elixirs: 200   },
  greater:    { brews: 45,   potions: 150, elixirs: 500   },
  superior:   { brews: 85,   potions: 200, elixirs: 700   },
  exceptional:{ brews: 125,  potions: 250, elixirs: 900   },
  legendary:  { brews: 1000, potions: 0,   elixirs: 0     },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Roll on the identify table for a given item type */
export function identify(type: IdentifyItemType, roll: number): IdentifyEntry {
  if (roll < 1 || roll > 100) throw new Error(`Identify roll must be 1-100, got ${roll}`);
  const table = IDENTIFY_TABLES[type];
  const entry = table.find((e) => roll >= e.minRoll && roll <= e.maxRoll);
  if (!entry) throw new Error(`No identify entry for type=${type} roll=${roll}`);
  return entry;
}

/** Roll on the cursed items sub-table */
export function getCursedItem(roll: number): CursedItemEntry {
  // Clamp to valid range
  const clamped = Math.max(1, Math.min(100, roll));
  const entry = CURSED_ITEMS.find((e) => clamped >= e.minRoll && clamped <= e.maxRoll);
  if (!entry) throw new Error(`No cursed item for roll=${roll}`);
  return entry;
}
