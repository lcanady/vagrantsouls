import { z } from "zod";

export const PartyStatus = z.enum(["LOBBY", "DUNGEON", "COMBAT"]);
export type PartyStatus = z.infer<typeof PartyStatus>;

export const PartySchema = z.object({
  id: z.string(),
  name: z.string().default("Adventuring Party"),
  leaderId: z.string(),
  members: z.array(z.string()), // Adventurer IDs
  status: PartyStatus.default("LOBBY"),
  // We might want to store the GameState here or link to it on a per-party basis
  // For now, let's keep it simple: A Party has members, and potentially a shared dungeon state in the future.
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type Party = z.infer<typeof PartySchema>;
