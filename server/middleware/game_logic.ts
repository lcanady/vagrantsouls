import { Context, Next } from "hono";

export const checkDead = async (c: Context, next: Next) => {
  const gameState = c.get("gameState");
  
  if (!gameState || !gameState.adventurer) {
    // If not loaded by middleware, fallback to legacy singleton for now? 
    // No, let's be strict.
    return c.json({ error: "No adventurer loaded" }, 400);
  }

  const { adventurer } = gameState;
  if (adventurer.hp <= 0) {
    return c.json({ error: "Adventurer is dead. Game over." }, 403);
  }
  await next();
};
