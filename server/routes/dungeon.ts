import { Hono, Context } from "hono";
import { checkDead } from "../middleware/game_logic.ts";
import { loadAdventurer } from "../middleware/adventurer.ts";
import { Book1TableService } from "../services/table_service.ts";
import { TimeService } from "../services/time.ts";
import { narratorGraph } from "../logic/narrator.ts";
import { Repository } from "../repository.ts";
import { GameState } from "../models/gamestate.ts";

const dungeonRoutes = new Hono<{ Variables: { repository: Repository, gameState: GameState, adventurerId: string } }>();
const tableService = new Book1TableService();
const timeService = new TimeService();

// Apply loadAdventurer middleware to all dungeon routes
dungeonRoutes.use("*", loadAdventurer);

dungeonRoutes.post("/move", checkDead, async (c: Context) => {
  const repo = c.get("repository");
  const adventurerId = c.get("adventurerId");
  const gameState = c.get("gameState");

  // 1. Time & Upkeep
  const { newState, report } = timeService.incrementTime(gameState);
  
  // 2. Roll for Room
  const roll = Math.floor(Math.random() * 100) + 1;
  const roomData = tableService.getTableM(roll);
  
  // 3. Update State
  const currentRoom = {
      roll,
      color: roomData.color,
      exits: roomData.exits,
      features: roomData.features,
      searched: false
  };
  
  newState.currentRoom = currentRoom;

  // 4. Generate Narrative
  let narrative = `You move into a ${currentRoom.color} room with ${currentRoom.exits} exits.`;
  
  if (report.messages.length > 0) {
      narrative = report.messages.join(" ") + "\n\n" + narrative;
  }

  try {
      const result = await narratorGraph.invoke({
          room: roomData,
          messages: []
      });
      const lastMsg = result.messages[result.messages.length - 1];
      if (lastMsg) {
          narrative = lastMsg.content.toString();
      }
  } catch (e) {
      console.error("Narrator Error:", e);
      narrative += "\nThe shadows deepen. (Narrator Error)";
  }

  // Persist the new state
  await repo.saveAdventurer(adventurerId, newState);

  return c.json({
    timeTrack: newState.timeTrack,
    roll,
    room: currentRoom,
    narrative: narrative.trim(),
    upkeepReport: report
  });
});

dungeonRoutes.post("/search", checkDead, async (c: Context) => {
    const repo = c.get("repository");
    const adventurerId = c.get("adventurerId");
    const gameState = c.get("gameState");

    if (!gameState.currentRoom) {
        return c.json({ error: "No room to search" }, 400);
    }
    
    if (gameState.currentRoom.searched) {
        return c.json({ message: "Room already searched", narrative: "You find nothing else of interest." });
    }

    // Spend Time
    const { newState, report } = timeService.incrementTime(gameState);
    
    // Roll for Search
    const roll = Math.floor(Math.random() * 100) + 1;
    const find = tableService.getTableS(roll);
    
    // Update State
    newState.currentRoom!.searched = true;
    
    let narrative = `You search the room... ${find.name === "Nothing" ? "and find nothing helpful." : "and find " + find.name + "!"}`;
    
    if (find.value) {
        newState.adventurer.gold += find.value;
        narrative += ` Added ${find.value} gold to your pouch.`;
    }
    
    await repo.saveAdventurer(adventurerId, newState);

    return c.json({
        roll,
        find,
        narrative,
        upkeepReport: report
    });
});

export default dungeonRoutes;
