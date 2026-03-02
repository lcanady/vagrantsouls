import { z } from "zod";

// Equipment Slots
export const EquipmentSlotSchema = z.enum(["Head", "Torso", "Back", "MainHand", "OffHand", "Belt", "Belt1", "Belt2"]);
export type EquipmentSlot = z.infer<typeof EquipmentSlotSchema>;

// Stat Modifiers
export const StatModifiersSchema = z.object({
  str: z.number().int().optional(),
  dex: z.number().int().optional(),
  int: z.number().int().optional(),
});
export type StatModifiers = z.infer<typeof StatModifiersSchema>;

// Item Schema
export const ItemSchema = z.object({
  id: z.string().uuid().optional(), // Optional ID for tracking specific instances if needed
  name: z.string(),
  description: z.string().optional(),
  slot: EquipmentSlotSchema.optional(),
  modifiers: StatModifiersSchema.optional(),
  twoHanded: z.boolean().default(false),
  usable: z.boolean().default(false),
  effect: z.string().optional(), // e.g., "HEAL:10", "BUFF:STR:5"
  damage: z.string().optional(), // e.g., "1d6", "2d4", or just "5"
  bonus: z.number().int().default(0),
  value: z.number().int().min(0).default(0),
  fix: z.number().int().min(0).default(0),
  damagePips: z.number().int().min(0).max(5).default(0),
  // Book 8 extensions
  def: z.number().int().optional(),            // defense value for armour/shields
  rv: z.number().int().min(0).optional(),      // resilience value (reinforced belts)
  spiked: z.boolean().optional(),              // spiked shield flag
});
export type Item = z.infer<typeof ItemSchema>;
