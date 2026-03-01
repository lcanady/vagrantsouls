import { Context, Next } from "hono";
import { Repository } from "../repository.ts";

export const loadAdventurer = async (c: Context, next: Next) => {
  const repo = c.get("repository") as Repository;
  const adventurerId = c.req.header("X-Adventurer-Id");
  const user = c.get("user"); // Set by authMiddleware

  if (!adventurerId) {
    return c.json({ error: "Missing X-Adventurer-Id header" }, 400);
  }

  const state = await repo.loadAdventurer(adventurerId);
  if (!state) {
    return c.json({ error: "Adventurer not found" }, 404);
  }

  if (state.adventurer.userId && user && state.adventurer.userId !== user.id) {
    return c.json({ error: "Unauthorized: You do not own this adventurer" }, 403);
  }

  c.set("adventurerId", adventurerId);
  c.set("gameState", state);
  await next();
};
