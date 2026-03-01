/**
 * Tables SA1-SA6 — Arcanist Spell Tables (Book 4: Lost Tome of Extraordinary Rules)
 *
 * Each Order of Magic has its own table (SA1-SA6).  Spells are rolled on d100.
 * Each entry also shows the ingredient cost to cast and an optional upkeep cost.
 */

export type ArcanistOrder =
  | "Alchemy"
  | "Elements"
  | "Illusion"
  | "Invocation"
  | "Psyche"
  | "Summoning"
  | "Esoteric";

export interface ArcanistSpell {
  minRoll: number;
  maxRoll: number;
  name: string;
  description: string;
  /** HP cost to cast */
  castCost: number;
  /** HP upkeep cost per time-track tick (0 = no upkeep) */
  upkeepCost: number;
  /** Ingredients required (name -> quantity) */
  ingredients: Record<string, number>;
}

// ── SA1: Order of Alchemy ────────────────────────────────────────────────────

export const SA1_ALCHEMY: ArcanistSpell[] = [
  {
    minRoll: 1, maxRoll: 10,
    name: "Alchemist's Concoction",
    description: "Creates one of: Concoction of Def/Dex/Dmg/Int/Str. Choose before casting.",
    castCost: 2, upkeepCost: 0,
    ingredients: { "Empty Vial": 1, "Magic Stone": 1 },
  },
  {
    minRoll: 11, maxRoll: 20,
    name: "Poison Remedy",
    description: "Creates an Alchemist's Poison Remedy. Roll 1d6 when used: 1-2 remove 1 pip, 3-4 remove 2, 5-6 remove 3.",
    castCost: 2, upkeepCost: 0,
    ingredients: { "Empty Vial": 1, "Tail of a Scorpion": 1 },
  },
  {
    minRoll: 21, maxRoll: 30,
    name: "Disease Remedy",
    description: "Creates an Alchemist's Disease Remedy. Roll 1d6 when used: 1-2 remove 1 pip, 3-4 remove 2, 5-6 remove 3.",
    castCost: 3, upkeepCost: 0,
    ingredients: { "Empty Vial": 1, "Hair of a Zombie": 1 },
  },
  {
    minRoll: 31, maxRoll: 40,
    name: "Alchemist's Mixture",
    description: "Creates one of: Mixture of Def/Dex/Dmg/Int/Str (+2 Def, +20 Dex/Int/Str, or +4 Dmg). Choose before casting.",
    castCost: 3, upkeepCost: 0,
    ingredients: { "Empty Vial": 1, "Magic Rock": 1 },
  },
  {
    minRoll: 41, maxRoll: 50,
    name: "Tears of Awareness",
    description: "Creates Alchemist's Tears of Awareness. Adds AWARENESS to time track: re-roll any find table result once per turn, +5 Aware.",
    castCost: 4, upkeepCost: 0,
    ingredients: { "Eye Dropper": 1, "Eye of an Eagle": 1 },
  },
  {
    minRoll: 51, maxRoll: 60,
    name: "Potion of Grow",
    description: "Creates Alchemist's Grow Potion. +30 Str next d100 roll; in combat roll 2d6 for next damage die.",
    castCost: 4, upkeepCost: 0,
    ingredients: { "Empty Vial": 1, "Hair of a Giant": 1 },
  },
  {
    minRoll: 61, maxRoll: 70,
    name: "Healing Salve",
    description: "Creates Alchemist's Healing Salve. Restores 1d10 HP after next time track clock is shaded.",
    castCost: 4, upkeepCost: 0,
    ingredients: { "Empty Vial": 1, "Calendula Flower": 1 },
  },
  {
    minRoll: 71, maxRoll: 80,
    name: "Arcane Poison",
    description: "Creates Alchemist's Arcane Poison. Apply to weapon: +6 Dmg, reduces by 1 per successful hit.",
    castCost: 7, upkeepCost: 0,
    ingredients: { "Empty Vial": 1, "Venom from a Cobra": 1 },
  },
  {
    minRoll: 81, maxRoll: 90,
    name: "Resurrection Potion",
    description: "Creates Alchemist's Resurrection Potion. Adds RES to time track; resurrects adventurer once if killed.",
    castCost: 14, upkeepCost: 0,
    ingredients: { "Empty Vial": 1, "Wooden Cross": 1 },
  },
  {
    minRoll: 91, maxRoll: 100,
    name: "Vial of Boosts",
    description: "Creates Alchemist's Vial of X. Roll on table B-Boosts for the effect. May only be cast once per quest.",
    castCost: 15, upkeepCost: 0,
    ingredients: { "Empty Vial": 1, "Magic Rune": 1 },
  },
];

// ── SA2: Order of Elements ───────────────────────────────────────────────────

export const SA2_ELEMENTS: ArcanistSpell[] = [
  {
    minRoll: 1, maxRoll: 10,
    name: "Call of Light",
    description: "When required to spend oil, cast instead to avoid removing oil.",
    castCost: 1, upkeepCost: 0,
    ingredients: { "Abdomen of a Giant Firefly": 1 },
  },
  {
    minRoll: 11, maxRoll: 20,
    name: "Air Totem",
    description: "Creates an Air Totem. Roll two location dice for monster attack, choose which. Grounds Fly ability. Lasts until monster hits 4 times.",
    castCost: 2, upkeepCost: 0,
    ingredients: { "Feather from a Giant Pegasus": 1 },
  },
  {
    minRoll: 21, maxRoll: 30,
    name: "Fire Totem",
    description: "Creates a Fire Totem. Monster suffers 2 HP at start of each combat round. Lasts 4 damage applications.",
    castCost: 3, upkeepCost: 0,
    ingredients: { "Igneous Rock": 1 },
  },
  {
    minRoll: 31, maxRoll: 40,
    name: "Water Totem",
    description: "Creates a Water Totem. Heals adventurer for up to 2 HP each time monster damages them. Lasts 4 heals.",
    castCost: 3, upkeepCost: 0,
    ingredients: { "Rain Drop": 1 },
  },
  {
    minRoll: 41, maxRoll: 50,
    name: "Earth Totem",
    description: "Creates an Earth Totem. Each combat round gains a bonus (+10 Str/Dex/Int, +1 HP/DMG/DEF). Lasts 4 bonuses.",
    castCost: 4, upkeepCost: 0,
    ingredients: { "Soil from a Giant Worm": 1 },
  },
  {
    minRoll: 51, maxRoll: 60,
    name: "Reconstruct",
    description: "Roll on table G-Geographic and overwrite the current green area.",
    castCost: 4, upkeepCost: 0,
    ingredients: { "Aether Dust": 1 },
  },
  {
    minRoll: 61, maxRoll: 70,
    name: "Totem Command",
    description: "All current and future totems in this combat gain +1 or +10 bonus to relevant abilities.",
    castCost: 5, upkeepCost: 0,
    ingredients: { "Straw Totem Effigy": 1 },
  },
  {
    minRoll: 71, maxRoll: 80,
    name: "Tornado",
    description: "For 1d6 rounds: monster -10 AV and -1 Dmg; adventurer +10 all characteristics and +1 Dmg. Stack up to 3 tornados.",
    castCost: 5, upkeepCost: 0,
    ingredients: { "Ice Brinicle": 1 },
  },
  {
    minRoll: 81, maxRoll: 90,
    name: "Stone Elemental",
    description: "Stone elemental with AV 60, Dmg +5 attacks at start of each round. Lasts 4 attack rolls.",
    castCost: 5, upkeepCost: 0,
    ingredients: { "Rock Dust": 1 },
  },
  {
    minRoll: 91, maxRoll: 100,
    name: "Tangled Vines",
    description: "Monster is entangled: -10 AV, cannot escape. Adventurer may escape freely. Lasts until 4 escape reactions.",
    castCost: 5, upkeepCost: 0,
    ingredients: { "Pollen from a Tangled Vine": 1 },
  },
];

// ── SA3: Order of Illusion ───────────────────────────────────────────────────

export const SA3_ILLUSION: ArcanistSpell[] = [
  {
    minRoll: 1, maxRoll: 10,
    name: "Death Becomes Me",
    description: "Illusion of death. Monster wanders off if roll ≤ 80 (with A reward) or 40 (without).",
    castCost: 2, upkeepCost: 0,
    ingredients: { "Gloop of Ectoplasm": 1 },
  },
  {
    minRoll: 11, maxRoll: 20,
    name: "Lasting Might",
    description: "Adds +10 Str to time track modifier until end of quest.",
    castCost: 2, upkeepCost: 0,
    ingredients: { "Fingernail from a Cyclops": 1 },
  },
  {
    minRoll: 21, maxRoll: 30,
    name: "Finding Brightness",
    description: "Before rolling on table F or FA: make up to 4 rolls, keeping or discarding each result in sequence.",
    castCost: 2, upkeepCost: 0,
    ingredients: { "Schistostega": 1 },
  },
  {
    minRoll: 31, maxRoll: 40,
    name: "Illusionary Weapons",
    description: "Weapon takes on appearance of another from table W; apply both damage modifiers on hit. Upkeep each combat round.",
    castCost: 3, upkeepCost: 1,
    ingredients: { "Conjured Iron": 1 },
  },
  {
    minRoll: 41, maxRoll: 50,
    name: "Silence",
    description: "Monster's Dark Magic ability is disabled. Monster rolls 1d10 each round to break (on 10 it succeeds). Upkeep required.",
    castCost: 3, upkeepCost: 1,
    ingredients: { "Tongue of a Devil": 1 },
  },
  {
    minRoll: 51, maxRoll: 60,
    name: "Monster's Monster",
    description: "Transforms adventurer into monster's greatest fear. Each round choose: +2 reaction, -20 AV, -2 Def, -2 Dmg, or -1 ability. Upkeep required.",
    castCost: 3, upkeepCost: 1,
    ingredients: { "Hair from a Ghoul": 1 },
  },
  {
    minRoll: 61, maxRoll: 70,
    name: "Invisibleness",
    description: "Adventurer becomes invisible until moving or casting another spell. In combat: +20 all characteristics, +2 Dmg, free escape.",
    castCost: 5, upkeepCost: 0,
    ingredients: { "Dust from a Vanquished Vampire": 1 },
  },
  {
    minRoll: 71, maxRoll: 80,
    name: "Monster Diminish",
    description: "Monster believes it is tiny. When monster rolls natural 5 or 6 on damage die, subtract 2 from result. Upkeep required.",
    castCost: 5, upkeepCost: 1,
    ingredients: { "Ants Brains": 1 },
  },
  {
    minRoll: 81, maxRoll: 90,
    name: "Phantasmic Eruptions",
    description: "When monster attacks, roll 1d100; if > AV it misses. Upkeep required each round.",
    castCost: 6, upkeepCost: 2,
    ingredients: { "Volcanic Ash": 1 },
  },
  {
    minRoll: 91, maxRoll: 100,
    name: "Monster Melt",
    description: "Monster believes it is on fire for 2 rounds: no reaction, no attack. Adventurer suffers -30 to attack characteristic.",
    castCost: 6, upkeepCost: 0,
    ingredients: { "Breath of a Dragon": 1 },
  },
];

// ── SA4: Order of Invocation ─────────────────────────────────────────────────

export const SA4_INVOCATION: ArcanistSpell[] = [
  {
    minRoll: 1, maxRoll: 10,
    name: "Hand of Keys",
    description: "+20 to Dex when next testing to open a locked door or chest.",
    castCost: 1, upkeepCost: 0,
    ingredients: { "Spring from a Lock": 1 },
  },
  {
    minRoll: 11, maxRoll: 20,
    name: "Ethereal Door",
    description: "Pass through any non-magical door. Roll 1d6; if ≤ door code number take that number in damage.",
    castCost: 2, upkeepCost: 0,
    ingredients: { "Miniature Key": 1 },
  },
  {
    minRoll: 21, maxRoll: 30,
    name: "Reconstruct (Invocation)",
    description: "Repair damaged item: roll item damage as normal, remove that many pips from damage track (once per quest per item).",
    castCost: 2, upkeepCost: 0,
    ingredients: { "Small Hammer": 1 },
  },
  {
    minRoll: 31, maxRoll: 40,
    name: "Lasting Agility",
    description: "Adds +10 Dex to time track modifier until end of quest.",
    castCost: 2, upkeepCost: 0,
    ingredients: { "Head of a Cobra": 1 },
  },
  {
    minRoll: 41, maxRoll: 50,
    name: "Conjure Food",
    description: "Creates 1d6 Conjured Food items that can replace normal food usage.",
    castCost: 2, upkeepCost: 0,
    ingredients: { "Inscribed Fork": 1 },
  },
  {
    minRoll: 51, maxRoll: 60,
    name: "Reinforced Belt",
    description: "All belt checks ignored while active. Upkeep each time track clock is triggered.",
    castCost: 3, upkeepCost: 1,
    ingredients: { "Cobalt Dust": 1 },
  },
  {
    minRoll: 61, maxRoll: 70,
    name: "Reinforced Weapon",
    description: "Main-hand and off-hand damage pips reduced to ½ per hit. Upkeep each time track clock.",
    castCost: 4, upkeepCost: 1,
    ingredients: { "Cobalt Ingot": 1 },
  },
  {
    minRoll: 71, maxRoll: 80,
    name: "Arcane Trap",
    description: "Trap entangles monster: -10 AV, escapes ignored. Each round pay upkeep; roll 1d100—if ≥ monster AV, inflict 1d6+Dmg damage.",
    castCost: 5, upkeepCost: 3,
    ingredients: { "Miniature Fenn Trap": 1 },
  },
  {
    minRoll: 81, maxRoll: 90,
    name: "Reinforced Armour",
    description: "All worn armour damage pips reduced to ½ per hit. Upkeep each time track clock.",
    castCost: 6, upkeepCost: 2,
    ingredients: { "Cobalt Bar": 1 },
  },
  {
    minRoll: 91, maxRoll: 100,
    name: "Arrow Storm",
    description: "At start of next combat round: roll 1d6; for each result monster suffers -1d6 HP.",
    castCost: 8, upkeepCost: 0,
    ingredients: { "Golden Arrowhead": 1 },
  },
];

// ── SA5: Order of Psyche ─────────────────────────────────────────────────────

export const SA5_PSYCHE: ArcanistSpell[] = [
  {
    minRoll: 1, maxRoll: 10,
    name: "Manipulation",
    description: "Take control of monster's mind for one reaction: choose the next reaction result instead of rolling.",
    castCost: 1, upkeepCost: 0,
    ingredients: { "Scalp of a Devil": 1 },
  },
  {
    minRoll: 11, maxRoll: 20,
    name: "Lasting Knowledge",
    description: "Adds +10 Int to time track modifier until end of quest.",
    castCost: 2, upkeepCost: 0,
    ingredients: { "Unwritten Book": 1 },
  },
  {
    minRoll: 21, maxRoll: 30,
    name: "Turn Undead",
    description: "Against undead (C on table): roll 1d10; if < monster Def value, monster flees and combat ends.",
    castCost: 3, upkeepCost: 0,
    ingredients: { "Holy Cross": 1 },
  },
  {
    minRoll: 31, maxRoll: 40,
    name: "Mind Blast",
    description: "Monster suffers damage equal to its Dmg modifier (undead suffer ½, rounded up). Negates simultaneous combat.",
    castCost: 3, upkeepCost: 0,
    ingredients: { "Brain of a Devil": 1 },
  },
  {
    minRoll: 41, maxRoll: 50,
    name: "Arcane Attunement",
    description: "Trade Str/Dex for Int in +5 increments (up to +15 Int). Upkeep each time track clock.",
    castCost: 3, upkeepCost: 1,
    ingredients: { "Straw Effigy": 1 },
  },
  {
    minRoll: 51, maxRoll: 60,
    name: "Control Dark Magic",
    description: "Take control of monster's Dark Magic: roll player-friendly dark magic results instead.",
    castCost: 4, upkeepCost: 1,
    ingredients: { "Obsidian Pebble": 1 },
  },
  {
    minRoll: 61, maxRoll: 70,
    name: "Magic Mastery",
    description: "If a spell test fails, immediately cast Magic Mastery to convert the failure to success. If Mastery also fails: two rolls on C-Curses.",
    castCost: 4, upkeepCost: 0,
    ingredients: { "Dust from an Arcane Crystal": 1 },
  },
  {
    minRoll: 71, maxRoll: 80,
    name: "Psionic Revenge",
    description: "After monster attacks: all HP the adventurer suffered is also applied to the monster. Forfeit next action.",
    castCost: 5, upkeepCost: 0,
    ingredients: { "Bone Gavel": 1 },
  },
  {
    minRoll: 81, maxRoll: 90,
    name: "Mind Control",
    description: "Roll 1d10; if ≤ monster Def, control its mind (combat ends). Monster becomes summonable ally. Upkeep each time track clock.",
    castCost: 6, upkeepCost: 2,
    ingredients: { "Skull of a Devil": 1 },
  },
  {
    minRoll: 91, maxRoll: 100,
    name: "Psychic Mirror",
    description: "Monster trapped in psychic dimension for 1d6 rounds: no reaction, no attack, adventurer may escape freely. Upkeep each round.",
    castCost: 7, upkeepCost: 2,
    ingredients: { "Mirror Dust": 1 },
  },
];

// ── SA6: Order of Summoning ──────────────────────────────────────────────────

export const SA6_SUMMONING: ArcanistSpell[] = [
  {
    minRoll: 1, maxRoll: 10,
    name: "Banish Demon",
    description: "On d10=10: banish demon permanently. On 1-9: banish while upkeep paid. Monster-type restriction: d-marked only.",
    castCost: 2, upkeepCost: 1,
    ingredients: { "Sweat from a Devil": 1 },
  },
  {
    minRoll: 11, maxRoll: 20,
    name: "Banish Undead",
    description: "On d10=10: banish undead permanently. On 1-9: banish while upkeep paid. Monster-type restriction: C-marked only.",
    castCost: 2, upkeepCost: 1,
    ingredients: { "Spirit Dust": 1 },
  },
  {
    minRoll: 21, maxRoll: 30,
    name: "Monsters Mash",
    description: "Switch the current monster to the one directly above or below on the same encounter table (full HP).",
    castCost: 2, upkeepCost: 0,
    ingredients: { "Shrunken Monster Heads": 1 },
  },
  {
    minRoll: 31, maxRoll: 40,
    name: "Summon Legendary Sword",
    description: "Summons Legendary Sword (H, +1 Dmg + table L legend bonus) for 1d6 rounds. Upkeep each round.",
    castCost: 3, upkeepCost: 1,
    ingredients: { "Conjured Steel": 1 },
  },
  {
    minRoll: 41, maxRoll: 50,
    name: "Summon Legendary Bow",
    description: "Summons Legendary Bow for 1d6 rounds. Upkeep each round.",
    castCost: 3, upkeepCost: 1,
    ingredients: { "Conjured Wood": 1 },
  },
  {
    minRoll: 51, maxRoll: 60,
    name: "Summon Legendary Shield",
    description: "Summons Legendary Shield for 1d6 rounds. Upkeep each round.",
    castCost: 3, upkeepCost: 1,
    ingredients: { "Conjured Iron": 1 },
  },
  {
    minRoll: 61, maxRoll: 70,
    name: "Summon Creature",
    description: "Summons a creature to fight alongside the adventurer for 1d6 rounds. Roll on table E for creature type.",
    castCost: 4, upkeepCost: 1,
    ingredients: { "Conjured Bag": 1 },
  },
  {
    minRoll: 71, maxRoll: 80,
    name: "Summon Monster",
    description: "Summons a monster from the encounter table to fight for the adventurer while upkeep is paid.",
    castCost: 5, upkeepCost: 2,
    ingredients: { "Bone Dust": 1 },
  },
  {
    minRoll: 81, maxRoll: 90,
    name: "Reanimate",
    description: "Reanimates a defeated monster to fight for the adventurer for 1d6 rounds.",
    castCost: 6, upkeepCost: 2,
    ingredients: { "Dried Flesh": 1 },
  },
  {
    minRoll: 91, maxRoll: 100,
    name: "Summon Dragon",
    description: "Summons a Dragon Hatchling to fight alongside the adventurer for 1d6 rounds.",
    castCost: 8, upkeepCost: 3,
    ingredients: { "Breath of a Dragon": 1 },
  },
];

/** All six spell tables indexed by order */
export const ARCANIST_SPELL_TABLES: Record<string, ArcanistSpell[]> = {
  Alchemy:    SA1_ALCHEMY,
  Elements:   SA2_ELEMENTS,
  Illusion:   SA3_ILLUSION,
  Invocation: SA4_INVOCATION,
  Psyche:     SA5_PSYCHE,
  Summoning:  SA6_SUMMONING,
};

/** Orders available to each hero path */
export const PATH_ORDERS: Record<string, ArcanistOrder[]> = {
  Druid:          ["Elements", "Illusion", "Psyche", "Summoning"],
  Warlock:        ["Alchemy", "Elements", "Invocation", "Psyche", "Summoning"],
  Sorcerer:       ["Alchemy", "Elements", "Illusion", "Invocation", "Summoning"],
  "Arcane Wizard":["Alchemy", "Illusion", "Esoteric", "Invocation", "Psyche"],
};

/** Rank names by number of order-spells in Arcanist Spell Book */
export const ARCANIST_RANKS: Record<number, { rank: string; ability: string }> = {
  1:  { rank: "Initiate",      ability: "Cancel Dark Magic: once per encounter ignore Dark Magic results." },
  2:  { rank: "Neophyte",      ability: "Arcane Wall: once per encounter re-roll monster's escape reaction." },
  3:  { rank: "Apprentice",    ability: "Light: spend 1 HP instead of oil when time track clock triggers." },
  4:  { rank: "Magi",          ability: "Dazzling Victory: when monster is defeated, combat ends immediately (no attack)." },
  5:  { rank: "Adept",         ability: "Attunement: spells from Arcanist Spell Book cost 1 less HP." },
  6:  { rank: "Tyro Magister", ability: "Arcane Weapon: all attacks considered spells for Ethereal ability." },
  7:  { rank: "Magister",      ability: "Arcane Barrier: all locations gain +2A including main/off hand slots." },
  8:  { rank: "Tyro Magus",    ability: "Spell Switch: freely move spells between spell books." },
  9:  { rank: "Magus",         ability: "It's a Kind of Magic: use Int for attack rolls with any weapon (no power cost)." },
  10: { rank: "Master Magus",  ability: "Eternal Healing: restore 1 HP each time track clock triggers; HP restored to max at quest start." },
};

/** Look up a spell by table and roll */
export function getArcanistSpell(order: string, roll: number): ArcanistSpell | undefined {
  const table = ARCANIST_SPELL_TABLES[order];
  if (!table) return undefined;
  return table.find(s => roll >= s.minRoll && roll <= s.maxRoll);
}

/** Get rank info for a given number of order-spells learned */
export function getArcanistRank(spellCount: number): { rank: string; ability: string } {
  const capped = Math.min(spellCount, 10);
  return ARCANIST_RANKS[capped] ?? { rank: "Initiate", ability: ARCANIST_RANKS[1].ability };
}
