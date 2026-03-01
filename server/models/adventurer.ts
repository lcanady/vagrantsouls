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

// Adventurer Schema
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
});

export type Adventurer = z.infer<typeof AdventurerSchema>;
