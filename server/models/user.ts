import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(20),
  passwordHash: z.string(),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;
