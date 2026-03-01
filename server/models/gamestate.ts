import { z } from "zod";
import { AdventurerSchema } from "./adventurer.ts";

export const GameStateSchema = z.object({
  adventurer: AdventurerSchema,
  
  // Time Track (0-20 pips)
  timeTrack: z.number().int().min(0).max(20).default(0),
  
  // Dungeon State
  currentArea: z.number().int().optional(),
  currentRoom: z.object({
    id: z.string().uuid().optional(),
    roll: z.number().int(),
    color: z.string(),
    exits: z.number().int(),
    features: z.array(z.string()),
    searched: z.boolean().default(false),
  }).optional(),
  
  // Meta data
  startedAt: z.string().datetime().default(() => new Date().toISOString()),
  lastSavedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type GameState = z.infer<typeof GameStateSchema>;
