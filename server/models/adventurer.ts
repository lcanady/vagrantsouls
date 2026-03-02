import { z } from "zod";
import { ItemSchema, EquipmentSlotSchema } from "./item.ts";

export { EquipmentSlotSchema };
export type { EquipmentSlot } from "./item.ts";

// --- Beast Companion ---
export const BeastSchema = z.object({
  name: z.string(),
  level: z.number().int().min(1).max(10).default(1),
  bonus: z.number().int().default(0),           // beast bonus (can be negative)
  gpValue: z.number().int().min(0),             // base gp value per level
  abilities: z.array(z.string()),               // e.g. ["Guard","Guide"]
  hp: z.number().int().min(0),                  // max HP at current level
  currentHp: z.number().int().min(0),
  trainingPips: z.number().int().min(0).max(10).default(0),
  isCooperative: z.boolean().default(true),     // false after failed TRAIN test
  isDragonHatchling: z.boolean().default(false),
  dragonHearts: z.number().int().min(0).max(2).default(0), // only for dragon hatchlings
});
export type Beast = z.infer<typeof BeastSchema>;

// --- Arcanist ---
export const ArcanistSchema = z.object({
  order: z.enum(["Alchemy", "Elements", "Illusion", "Invocation", "Psyche", "Summoning", "Esoteric"]),
  rank: z.enum(["Initiate", "Neophyte", "Apprentice", "Magi", "Adept", "Tyro Magister", "Magister", "Tyro Magus", "Magus", "Master Magus"]).default("Initiate"),
  arcanistSpells: z.array(z.string()).default([]),  // spells in the Arcanist Spell Book
  ingredientsBagActive: z.boolean().default(false),
  ingredients: z.record(z.string(), z.number()).default({}), // ingredient name -> qty
  arcaneLawBroken: z.number().int().min(0).default(0), // running total, resets on successful concealment
  stafeEnergy: z.number().int().min(0).default(0),  // energy stored in stave/quarterstaff
});
export type Arcanist = z.infer<typeof ArcanistSchema>;

// --- Artisan ---
export const SchematicSchema = z.object({
  name: z.string(),
  modifier: z.number().int(),
  standardMaterials: z.record(z.string(), z.number()),
  upgradedMaterials: z.record(z.string(), z.number()).default({}),
  gpValue: z.number().int().min(0),
  slot: z.string().optional(),
  dmg: z.number().int().optional(),
  def: z.number().optional(),
  str: z.number().int().optional(),
  dex: z.number().int().optional(),
  int: z.number().int().optional(),
  hp: z.number().int().optional(),
});
export type Schematic = z.infer<typeof SchematicSchema>;

export const ArtisanSchema = z.object({
  art: z.number().int().min(0).max(80).default(40),
  salvageSkill: z.number().int().min(0).max(20).default(0),
  craftingSkill: z.number().int().min(0).max(20).default(0),
  artExperiencePips: z.number().int().min(0).default(0),
  salvageExperiencePips: z.number().int().min(0).default(0),
  craftingExperiencePips: z.number().int().min(0).default(0),
  // materials: full unit name -> quantity
  materials: z.record(z.string(), z.number()).default({}),
  schematics: z.array(SchematicSchema).default([]),
  scrapsPips: z.number().int().min(0).max(50).default(0), // dungeon scraps track
  guildStoragePaid: z.boolean().default(false),
});
export type Artisan = z.infer<typeof ArtisanSchema>;

// Witchery formula (learned recipe)
const WitcheryFormulaSchema = z.object({
  parts: z.array(z.string()).length(3),
  bonus: z.number().int(),
  effect: z.string(),
  mishap: z.string(),
});

// ============================================================
// World Builder (Book 6) Schemas
// ============================================================

/** Axial hex coordinate string, e.g. "q:0,r:0" */
const HexIdSchema = z.string().regex(/^q:-?\d+,r:-?\d+$/);

/** A single saddlebag slot on a mount */
const SaddlebagSlotSchema = z.object({
  /** Item with a damage track (one per bag) */
  trackItem: z.object({ name: z.string(), pips: z.number().int().min(0) }).nullable().optional(),
  /** Stackable items (up to 2 stacks of up to 10 each) */
  stackItems: z.array(z.object({ name: z.string(), qty: z.number().int().min(0) })).max(2).default([]),
});

/** A mount owned by the adventurer */
const WBMountSchema = z.object({
  slotNumber: z.number().int().min(1).max(6),
  name: z.string(),
  type: z.string(), // "horse", "mule", "camel", "dragon", "unicorn", "flying_carpet", etc.
  rations: z.number().int().min(0).max(30).default(0),
  malnutrition: z.number().int().min(0).max(10).default(0), // pips; full = death check
  saddlebags: z.array(SaddlebagSlotSchema).max(4).default([]),
  notes: z.string().default(""),
  value: z.number().int().min(0), // gp value
  isStolen: z.boolean().default(false),
  stolenDaysAgo: z.number().int().min(0).default(0),
});

/** A world-builder quest record */
const WBQuestRecordSchema = z.object({
  code: z.string(), // "Q1" through "Q25"
  hexId: z.string(), // hex where the quest is located
  tableRoll: z.number().int().min(1).max(100), // # rolled on (WB) Q
  name: z.string(),
  details: z.string(),
  qc: z.number().int().min(0), // Q¢
  pc: z.number().int().min(0), // P¢ (from NPC / PERSON)
  hc: z.number().int(), // H¢ (from hex name reward adjustment)
  rv: z.number().int(), // Reward Value = Q¢ + P¢ + H¢
  successText: z.string(), // [S] outcome
  failureText: z.string(), // [F] outcome
  encMod: z.number().int(), // encounter modifier for this quest
  npcName: z.string().optional(), // generated [PERSON] name
  isUnique: z.boolean().default(false),
  requiresHandIn: z.boolean().default(false),
  status: z.enum(["active", "complete", "failed"]).default("active"),
});

/** A single circled date on the back of the calendar */
const CircledDateSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  /** Description of what triggers on this date */
  entry: z.string(),
  /** True if this recurs monthly until resolved */
  isOngoing: z.boolean().default(false),
});

/** Calendar state */
const WBCalendarSchema = z.object({
  year: z.number().int().min(1).default(1072),
  month: z.number().int().min(1).max(12).default(1),
  day: z.number().int().min(1).max(31).default(1),
  /** Rations on the calendar sheet (max 30) */
  rations: z.number().int().min(0).max(30).default(15),
  /** Fatigue pips shaded (0-10) */
  fatigue: z.number().int().min(0).max(10).default(0),
  /** Quest time track pips shaded (used for leaving-mounts check) */
  questTimePips: z.number().int().min(0).default(0),
  /** Circled dates recorded on calendar back */
  circledDates: z.array(CircledDateSchema).default([]),
});

/** Data for a single generated hex on the hex sheet */
const HexDataSchema = z.object({
  id: HexIdSchema,
  sheetId: z.number().int().min(1),
  terrain: z.enum(["Deserts", "Tundras", "Grasslands", "Forests", "Jungles", "Marshlands", "Swamps", "Hills", "Mountains", "Seas"]),
  name: z.string(),
  /** Reward adjustment ¢ from hex name (e.g. +1, -1, 0) */
  rewardAdjustment: z.number().int().default(0),
  settlement: z.object({
    type: z.enum(["camp", "village", "town", "city"]),
    name: z.string(),
  }).optional(),
  /** Road edges (1-6 using flat-top hex direction convention) */
  roads: z.array(z.number().int().min(1).max(6)).default([]),
  /** River edges (1-6) */
  rivers: z.array(z.number().int().min(1).max(6)).default([]),
  /** Quest code placed in this hex, if any (e.g. "Q1") */
  questCode: z.string().optional(),
  /** Completed side quest name placed in this hex, if any */
  completedSideQuest: z.string().optional(),
  /** Whether this hex is marked AT WAR (-10 encounter modifier) */
  atWar: z.boolean().default(false),
  /** Whether a camp (▲) has been made in this hex */
  hasCamp: z.boolean().default(false),
});

/** One hex sheet (one land of 25 quest slots) */
const HexSheetSchema = z.object({
  sheetId: z.number().int().min(1),
  hexes: z.record(HexIdSchema, HexDataSchema).default({}),
  /** Quest records for this sheet (Q1–Q25) */
  quests: z.array(WBQuestRecordSchema).default([]),
  /** Number of quests completed on this sheet */
  questsCompleted: z.number().int().min(0).default(0),
  /** True when all 25 quests on this sheet are complete (land is done) */
  isComplete: z.boolean().default(false),
  /** Links this sheet to a named continent in the world (e.g. 1 = Caldoria) */
  continentId: z.number().int().min(1).optional(),
  /** Display name of the continent (e.g. "Caldoria") */
  continentName: z.string().optional(),
});

/** Full World Builder state nested inside Adventurer */
export const WorldBuilderStateSchema = z.object({
  /** All hex sheets travelled; index 0 = first land */
  hexSheets: z.array(HexSheetSchema).default([]),
  /** Current sheet index (0-based into hexSheets) */
  currentSheetIndex: z.number().int().min(0).default(0),
  /** Current position in axial coords */
  currentHexId: HexIdSchema,
  /** Calendar / time tracking */
  calendar: WBCalendarSchema,
  /** Mounts owned (max 6 slots; dragon = all 6) */
  mounts: z.array(WBMountSchema).default([]),
  /** Lawless Points (LP) accumulated */
  lawlessPoints: z.number().int().min(0).default(0),
  /** Accumulated witch-suspicion (witchery event trigger) */
  witchSuspicion: z.number().int().min(0).default(0),
  /** World Builder skills unlocked at start (+5 to each) */
  wbStartingSkills: z.array(z.string()).default([]),
  /** Unique treasures already found (can't be found again) */
  uniqueTreasuresFound: z.array(z.string()).default([]),
  /** Whether both Band of Bralkar and Band of Skalkar are owned (creates Band of Unity) */
  hasBandOfUnity: z.boolean().default(false),
});
export type WorldBuilderState = z.infer<typeof WorldBuilderStateSchema>;
export type HexData = z.infer<typeof HexDataSchema>;
export type HexSheet = z.infer<typeof HexSheetSchema>;
export type WBQuestRecord = z.infer<typeof WBQuestRecordSchema>;
export type WBCalendar = z.infer<typeof WBCalendarSchema>;
export type WBMount = z.infer<typeof WBMountSchema>;
export type CircledDate = z.infer<typeof CircledDateSchema>;

// ============================================================
// Book 8 (Curious Rules) Schemas
// ============================================================

/** Butchery Roll + experience pips */
const ButcherySchema = z.object({
  br: z.number().int().min(1).default(1),   // Butchery Roll (starts at 1, increments per 10 pips)
  pips: z.number().int().min(0).max(10).default(0),
});

/** Spell Mana pool */
const SpellManaSchema = z.object({
  primary: z.number().int().min(0).default(0),   // base from class/path
  adjusted: z.number().int().default(0),         // modifier from equipment/effects
  total: z.number().int().min(0).default(0),     // primary + adjusted
  current: z.number().int().min(0).default(0),   // remaining mana this quest
  magicPower: z.boolean().default(false),        // Magic Power mode: spell fail = -1d3 HP instead of Table C
});

/** Ammunition holders */
const AmmunitionSchema = z.object({
  pouch: z.object({
    smoothStones: z.number().int().min(0).default(0),
    leadShot: z.number().int().min(0).default(0),
  }).optional(),
  quiver: z.object({
    bodkinArrows: z.number().int().min(0).default(0),
    broadheadArrows: z.number().int().min(0).default(0),
  }).optional(),
  bandolier: z.object({
    crossbowBolts: z.number().int().min(0).default(0),
    heavyQuarrels: z.number().int().min(0).default(0),
  }).optional(),
});

/** One herb bag (herbalism) */
const HerbBagSchema = z.object({
  label: z.string(),
  herbs: z.record(z.string(), z.number().int().min(0)).default({}),
});

// ============================================================
// Adventurer Schema
// ============================================================

export const AdventurerSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  name: z.string(),

  // Primary Stats
  hp: z.number().int().min(0),
  maxHp: z.number().int().min(0),
  fate: z.number().int().min(0),
  life: z.number().int().min(0),

  // Base Stats (for reference/storage if not always 50/40/30)
  str: z.number().int().default(50),
  dex: z.number().int().default(40),
  int: z.number().int().default(30),

  // Resources / Tracks
  experiencePips: z.number().int().min(0),

  // Equipment Slots
  head: ItemSchema.nullable().optional(),
  torso: ItemSchema.nullable().optional(),
  back: ItemSchema.nullable().optional(),
  mainHand: ItemSchema.nullable().optional(),
  offHand: ItemSchema.nullable().optional(),

  // Belt Slots (strictly 2 per requirements)
  belt1: ItemSchema.nullable().optional(),
  belt2: ItemSchema.nullable().optional(),

  // Inventory / Backpack
  backpack: z.array(ItemSchema).default([]),

  // Hero paths
  path: z.enum([
    "Warrior", "Rogue", "Sorcerer",
    "Knight", "Paladin", "Assassin", "Scoundrel", "Warlock", "Druid",
    "Barbarian", "Hunter", "Arcane Wizard"
  ]).optional(),

  // Races
  race: z.enum([
    "Dwarf", "Elf", "Human",
    "Halfling", "Half Elf", "Half Giant", "High Elf", "Mountain Dwarf"
  ]).optional(),

  reputation: z.number().int().default(0), // 'Rep'
  gold: z.number().int().min(0).default(0),

  // Resources found in dungeon
  oil: z.number().int().min(0).default(0),
  food: z.number().int().min(0).default(0),
  picks: z.number().int().min(0).default(0),

  // Skills (e.g., Bravery, Locks, Traps, etc. with bonuses)
  skills: z.record(z.string(), z.number()).default({}),

  // Spells (e.g., Fireball, Heal, etc. with pips)
  spells: z.record(z.string(), z.number()).default({}),

  // Status Effects
  poison: z.number().int().min(0).default(0),
  disease: z.number().int().min(0).default(0),

  // Conditions
  darkness: z.boolean().default(false),
  starvation: z.boolean().default(false),

  // Downtime specific
  investments: z.record(z.string(), z.object({
    shares: z.number().int().default(0),
    pips: z.number().int().min(0).max(5).default(0)
  })).default({}),

  // --- Witchery ---
  // Monster parts looted (stored in backpack but typed separately for clarity)
  monsterParts: z.array(z.object({
    name: z.string(),
    rarity: z.enum(["normal", "uncommon", "scarce", "rare"]),
    value: z.number().int().min(0),
  })).default([]),
  // Learned witchery formulas: key = sorted part names joined by "|"
  witcheryFormulas: z.record(z.string(), WitcheryFormulaSchema).default({}),
  // Active witchery effects for the current quest (cleared at end of quest)
  witcheryEffects: z.array(z.string()).default([]),
  // Active mishap penalties for the current quest
  witcheryMishaps: z.array(z.string()).default([]),

  // --- Quest Tracking ---
  // Campaign quest states: questId -> status
  campaignQuests: z.record(z.string(), z.enum(["pending", "complete", "failed"])).default({}),
  // Side quest states: questId -> status
  sideQuests: z.record(z.string(), z.enum(["complete", "failed"])).default({}),
  // Total quests completed / failed (used for fast-track and progression)
  questsCompleted: z.number().int().min(0).default(0),
  questsFailed: z.number().int().min(0).default(0),

  // --- Beast Mastery ---
  beast: BeastSchema.nullable().optional(),

  // --- Arcanist ---
  arcanist: ArcanistSchema.nullable().optional(),

  // --- Artisan ---
  artisan: ArtisanSchema.nullable().optional(),

  // --- Combat Experience ---
  // monster name -> number of kill pips (max 20)
  combatExperience: z.record(z.string(), z.number().int().min(0).max(20)).default({}),

  // --- Property ---
  property: z.object({
    name: z.string(),
    slots: z.number().int().min(0),          // max items storable
    security: z.number().int().min(0).max(90).default(0), // base security value
    upkeep: z.number().int().min(0),
    storedItems: z.array(z.string()).default([]), // item names stored
  }).nullable().optional(),

  // --- Guilds ---
  guildId: z.string().nullable().optional(),
  guildStanding: z.number().int().min(0).max(100).default(0),

  // --- World Builder (Book 6) ---
  worldBuilder: WorldBuilderStateSchema.nullable().optional(),

  // --- Book 8: Curious Rules ---
  butchery: ButcherySchema.nullable().optional(),
  dualWield: z.boolean().nullable().optional(),
  weaponProficiency: z.record(z.string(), z.number().int().min(0)).nullable().optional(),
  cheatDeath: z.enum(["active"]).nullable().optional(),
  spellMana: SpellManaSchema.nullable().optional(),
  ammunition: AmmunitionSchema.nullable().optional(),
  herbBags: z.array(HerbBagSchema).nullable().optional(),
  artisanSheet: z.record(z.string(), z.number().int().min(0)).nullable().optional(), // mining/herbalism materials
  accolades: z.record(z.string(), z.boolean()).nullable().optional(),
  honourPoints: z.number().int().min(0).nullable().optional(),
  heroicItemTracker: z.object({ pips: z.number().int().min(0) }).nullable().optional(),
  yellowEventTracker: z.object({ pips: z.number().int().min(0) }).nullable().optional(),
  weaponProficiencyTracker: z.record(z.string(), z.number().int().min(0)).nullable().optional(),
});

export type Adventurer = z.infer<typeof AdventurerSchema>;
