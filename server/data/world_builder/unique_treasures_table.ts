// (WB) UT – UNIQUE TREASURES TABLE
// Unique treasures are found by completing unique quests (WB) Q #87-100.
// After a unique quest is completed, roll 1d10: only on a 10 is the unique item found.

export interface UniqueTreasureEntry {
  /** Item name (used as key) */
  name: string;
  /** Quest number that can yield this item (87-100) */
  questRoll: number;
  /** Gold value */
  value: number;
  /** Where the item is equipped / stored */
  slot: string | null;
  /** Stat bonuses as a record (null if none) */
  statBonuses: Partial<Record<"str" | "dex" | "int" | "hp" | "dmg" | "def", number>> | null;
  /** Armour value (null if not armour) */
  armourValue: number | null;
  /** Full description of item ability */
  description: string;
  /** Alternative item found if the unique treasure is NOT rolled (d10 result 1-9) */
  alternativeOnFail: string;
  /** Whether this item can be sold */
  canBeSold: boolean;
}

export const UNIQUE_TREASURES_TABLE: UniqueTreasureEntry[] = [
  {
    name: "TALISMAN OF SEARCHING",
    questRoll: 87,
    value: 3500,
    slot: "Neck",
    statBonuses: null,
    armourValue: null,
    description: "Each time the player rolls on table F or FA, they roll twice and may choose either result for the adventurer.",
    alternativeOnFail: "A necklace worth 7000gp (the three objective items combined), can be worn or stored in backpack.",
    canBeSold: true,
  },
  {
    name: "CLOAK OF STEEL",
    questRoll: 88,
    value: 3600,
    slot: "Back",
    statBonuses: null,
    armourValue: 4,
    description: "The cloak is made from a magical thread as strong as steel but as light as silk. Once per combat, after the monster's damage roll and location has been determined, the wearer may pull the cloak over themselves to provide all locations with +4A.",
    alternativeOnFail: "Roll on table TC+20 for a powerful treasure instead.",
    canBeSold: true,
  },
  {
    name: "SWORD OF PROTECTION",
    questRoll: 89,
    value: 3600,
    slot: "Hand",
    statBonuses: { dmg: 10 }, // 1d10 damage
    armourValue: 3,
    description: "(H) 1d10 Dmg, AV 3. If Mighty Blow is active and a 10 is scored on its damage die, it may be re-rolled, just like the d6.",
    alternativeOnFail: "A legendary weapon — roll on table W and table L (Legends) in the usual way.",
    canBeSold: true,
  },
  {
    name: "CLOAK OF BRAVERY",
    questRoll: 90,
    value: 3600,
    slot: "Back",
    statBonuses: null,
    armourValue: 3,
    description: "The adventurer may ignore a monster's Fear ability and need never perform a FEAR test.",
    alternativeOnFail: "An upgraded cloak — roll 1d6: 1=Greater Leather Cloak (A0 +0.4 Def), 2=Greater Studded Leather Cape (A1 +0.4 Def), 3=Greater Mail Shawl (A2 +0.4 Def), 4=Superior Leather Cloak (A0 +0.6 Def), 5=Superior Studded Leather Cape (A1 +0.6 Def), 6=Superior Mail Shawl (A2 +0.6 Def).",
    canBeSold: true,
  },
  {
    name: "BOOK OF ARCANE SKILL",
    questRoll: 91,
    value: 4000,
    slot: null,
    statBonuses: null,
    armourValue: null,
    description: "This magical book may be read at the start of any quest to provide the adventurer with a +5 bonus to any single skill for the duration of the quest.",
    alternativeOnFail: "A Book of SKILL (+5 SKILL when read) (500gp). Roll for a random skill and replace SKILL with that skill's name. May be read anytime not on a quest; retains value after reading.",
    canBeSold: true,
  },
  {
    name: "BOOK OF SPELLS",
    questRoll: 92,
    value: 4500,
    slot: null,
    statBonuses: null,
    armourValue: null,
    description: "This magical spell book may be read at the start of any quest to provide the adventurer with a random spell (roll 1d100 on table S – Spells). The adventurer knows the spell for the quest duration, may cast it for 1 HP (or 1 Str if usual cost is Str), and casting uses a +25 spell bonus.",
    alternativeOnFail: "A spell book containing 4 arcane spells — roll four times on table S–Spells and add results to the adventurer's spell book.",
    canBeSold: true,
  },
  {
    name: "RING OF ENCOURAGEMENT",
    questRoll: 93,
    value: 4500,
    slot: "Ring",
    statBonuses: null,
    armourValue: null,
    description: "Once per quest the adventurer may roll on table B.",
    alternativeOnFail: "A Legendary Ring — roll on table L in the usual way.",
    canBeSold: true,
  },
  {
    name: "AMULET OF LIFE",
    questRoll: 94,
    value: 4500,
    slot: "Neck",
    statBonuses: null,
    armourValue: null,
    description: "Every time the time track is refreshed whilst the adventurer is wearing the amulet, they will recover 1d6 HP.",
    alternativeOnFail: "A Legendary Necklace — roll on table L in the usual way.",
    canBeSold: true,
  },
  {
    name: "TITAN SCALE",
    questRoll: 95,
    value: 5000,
    slot: "Torso",
    statBonuses: { str: 10, dex: 5, int: 5 },
    armourValue: 5,
    description: "Whilst worn the adventurer may ignore a monster's LARGE ability. The armour does not use a damage track and is indestructible. May also deflect up to 3 points of damage during combat instead of the normal 2.",
    alternativeOnFail: "A piece of legendary armour — roll on table A and table L in the usual way.",
    canBeSold: true,
  },
  {
    name: "BAND OF SKALKAR",
    questRoll: 96,
    value: 5000,
    slot: "Ring",
    statBonuses: { dex: 10, int: 10, def: 2 },
    armourValue: null,
    description: "One of two rings crafted over the Anvil of Power. If the adventurer also owns the Band of Bralkar, remove both rings and add the BAND OF UNITY to the adventure sheet (+10 STR, +10 DEX, +10 INT, +10 HP, +5 DMG, +2 DEF) (15,000gp).",
    alternativeOnFail: "A Legendary Ring — roll on table L in the usual way.",
    canBeSold: true,
  },
  {
    name: "BAND OF BRALKAR",
    questRoll: 97,
    value: 5500,
    slot: "Ring",
    statBonuses: { str: 10, hp: 10, dmg: 5 },
    armourValue: null,
    description: "One of two rings crafted over the Anvil of Power. If the adventurer also owns the Band of Skalkar, remove both rings and add the BAND OF UNITY to the adventure sheet (+10 STR, +10 DEX, +10 INT, +10 HP, +5 DMG, +2 DEF) (15,000gp).",
    alternativeOnFail: "A Legendary Ring — roll on table L in the usual way.",
    canBeSold: true,
  },
  {
    name: "UNICORN MOUNT",
    questRoll: 98,
    value: 0, // cannot be sold
    slot: "Notes (adventurer sheet)",
    statBonuses: null,
    armourValue: null,
    description: "Does not use up a mount slot. Cannot be sold or fitted with saddlebags or carry rations. Whilst recorded on the adventurer sheet, blesses the adventurer with +10 spell bonus to all spells. May be called for any riding test and will instantly appear. Does not remove when suffering the SWIM event.",
    alternativeOnFail: "Collect any 1 elixir the player likes from table TC and add it to the adventure sheet.",
    canBeSold: false,
  },
  {
    name: "FLYING CARPET MOUNT",
    questRoll: 99,
    value: 10000,
    slot: "Backpack (no damage track)",
    statBonuses: null,
    armourValue: null,
    description: "Does not use up a mount slot. Cannot be fitted with saddlebags or carry rations. Use Int instead of Dex for riding tests. Ignores ride penalty of current hex. Adventurer does not remove Flying Carpet when suffering SWIM event. Automatically succeeds at: MOSS POOLS, MOSS SLIPPERY, MOSS BOULDERS, CROSS BRIDGE, LAVA PATH, JUMP PIT, SWIM RIVER geographic tests. Can ignore CHASM restrictions.",
    alternativeOnFail: "A magic carpet — roll 1d6: 1=Carpet of Repair (5500gp, remove all damage from one item once per quest), 2=Carpet of Casting (6000gp, pass any cast spell/scroll test once per quest), 3=Carpet of Healing (6500gp, restore all lost HP once per quest), 4=Carpet of Might (6000gp, +10 to next damage roll once per quest), 5=Carpet of Learning (7500gp, gain experience on 60 or less once per quest), 6=Carpet of Life (8000gp, resurrect when killed once per quest).",
    canBeSold: true,
  },
  {
    name: "DRAGON MOUNT",
    questRoll: 100,
    value: 15000,
    slot: "Mount sheet (uses all 6 slots)",
    statBonuses: null,
    armourValue: null,
    description: "Uses all 6 mount slots, allowing up to 24 saddlebags total. Can carry 180 rations (30 per slot). Provides flying: ride penalty of current hex is never applied to riding tests. Does not need to be fed — does not cost any rations. Will not allow itself to be stolen and will never get eaten. All mount-stolen/mount-eaten events may be ignored. Cannot be removed by the SWIM event.",
    alternativeOnFail: "The dragon is killed — receive its [K] reward + 1d100 × 10gp from its horde.",
    canBeSold: false,
  },
];

/** Special combined item created when both Band of Bralkar and Band of Skalkar are owned */
export const BAND_OF_UNITY = {
  name: "BAND OF UNITY",
  value: 15000,
  slot: "Ring",
  statBonuses: { str: 10, dex: 10, int: 10, hp: 10, dmg: 5, def: 2 },
  armourValue: null,
  description: "Created when both the Band of Bralkar and Band of Skalkar are owned. Remove both predecessor rings and add the Band of Unity. (+10 STR, +10 DEX, +10 INT, +10 HP, +5 DMG, +2 DEF)",
  canBeSold: true,
} as const;

export function getUniqueTreasureByQuest(questRoll: number): UniqueTreasureEntry | undefined {
  return UNIQUE_TREASURES_TABLE.find((e) => e.questRoll === questRoll);
}

export function getUniqueTreasureByName(name: string): UniqueTreasureEntry | undefined {
  return UNIQUE_TREASURES_TABLE.find((e) => e.name === name);
}
