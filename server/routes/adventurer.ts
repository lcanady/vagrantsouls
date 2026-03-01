import { Hono, Context } from "hono";
import { Repository } from "../repository.ts";
import { loadAdventurer } from "../middleware/adventurer.ts";
import { GameState } from "../models/gamestate.ts";
import { EquipmentManager } from "../logic/equipment.ts";
import { EquipmentSlotSchema } from "../models/item.ts";
import { z } from "zod";

const adventurerRoutes = new Hono<{ Variables: { repository: Repository, gameState: GameState, adventurerId: string } }>();

// GET /api/v1/adventurer
adventurerRoutes.get("/", loadAdventurer, (c: Context) => {
  const gameState = c.get("gameState");
  return c.json(gameState.adventurer);
});

// POST /api/v1/adventurer/equip
adventurerRoutes.post("/equip", loadAdventurer, async (c: Context) => {
  const repo = c.get("repository");
  const adventurerId = c.get("adventurerId");
  const gameState = c.get("gameState");
  const body = await c.req.json();
  
  const schema = z.object({
    itemId: z.string(),
    slot: EquipmentSlotSchema
  });
  
  const result = schema.safeParse(body);
  if (!result.success) return c.json({ error: "Invalid request", details: result.error }, 400);
  
  const { itemId, slot } = result.data;
  const adventurer = gameState.adventurer;
  
  // Find item in backpack
  const itemIndex = adventurer.backpack.findIndex((i: { id?: string }) => i.id === itemId);
  if (itemIndex === -1) return c.json({ error: "Item not found in backpack" }, 404);
  
  const item = adventurer.backpack[itemIndex];
  
  try {
      // 1. Remove from backpack
      const newBackpack = [...adventurer.backpack];
      newBackpack.splice(itemIndex, 1);
      
      // 2. Equip
      const interimAdv = { ...adventurer, backpack: newBackpack };
      const updatedAdv = EquipmentManager.equip(interimAdv, item, slot);
      
      const updatedState = { ...gameState, adventurer: updatedAdv };
      await repo.saveAdventurer(adventurerId, updatedState);
      
      return c.json({ message: `Equipped ${item.name} into ${slot}`, adventurer: updatedAdv });
  } catch (e) {
      const error = e as Error;
      return c.json({ error: error.message }, 400);
  }
});

// POST /api/v1/adventurer/unequip
adventurerRoutes.post("/unequip", loadAdventurer, async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");
    const body = await c.req.json();
    
    const schema = z.object({
      slot: z.enum(["Head", "Torso", "Back", "MainHand", "OffHand", "Belt1", "Belt2"])
    });
    
    const result = schema.safeParse(body);
    if (!result.success) return c.json({ error: "Invalid request", details: result.error }, 400);
    
    try {
        const updatedAdv = EquipmentManager.unequip(gameState.adventurer, result.data.slot);
        const updatedState = { ...gameState, adventurer: updatedAdv };
        await repo.saveAdventurer(adventurerId, updatedState);
        
        return c.json({ message: `Unequipped item from ${result.data.slot}`, adventurer: updatedAdv });
    } catch (e) {
        const error = e as Error;
        return c.json({ error: error.message }, 400);
    }
});

// For backward compatibility or direct stat updates (though chargen handles this now)
adventurerRoutes.post("/update", loadAdventurer, async (c) => {
  const repo = c.get("repository");
  const adventurerId = c.get("adventurerId");
  const gameState = c.get("gameState");
  const body = await c.req.json();
  
  const updatedState = { ...gameState, adventurer: { ...gameState.adventurer, ...body } };
  await repo.saveAdventurer(adventurerId, updatedState);
  
  return c.json(updatedState.adventurer);
});

export default adventurerRoutes;
