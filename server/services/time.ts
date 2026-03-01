import { GameState } from "../models/gamestate.ts";

export interface UpkeepReport {
  timeIncremented: number;
  oilConsumed: number;
  foodConsumed: number;
  darknessApplied: boolean;
  starvationApplied: boolean;
  damageTaken: number;
  messages: string[];
}

export class TimeService {
  /**
   * Increments time by 1 and performs upkeep checks (Oil, Food).
   * @param currentState The current game state.
   * @returns An object containing the new game state simulation (or mutations) and a report.
   * Note: This mutates the passed state for simplicity in this architecture, 
   * but returning the mutated reference is good practice.
   */
  incrementTime(currentState: GameState): { newState: GameState; report: UpkeepReport } {
    const report: UpkeepReport = {
      timeIncremented: 0,
      oilConsumed: 0,
      foodConsumed: 0,
      darknessApplied: false,
      starvationApplied: false,
      damageTaken: 0,
      messages: [],
    };

    // 1. Increment Time
    currentState.timeTrack += 1;
    report.timeIncremented = 1;

    // 2. Oil Check (Every 10 pips)
    // If we hit 10 or 20, we consume oil. 
    // actually, is it "hits a multiple of 10"? Yes.
    if (currentState.timeTrack % 10 === 0) {
      if (currentState.adventurer.oil > 0) {
        currentState.adventurer.oil -= 1;
        report.oilConsumed += 1;
        report.messages.push("The lantern flickers. You feed the dying flame another precious drop of Oil.");
      } else {
        // Oil is 0, apply Darkness
        if (!currentState.adventurer.darkness) {
            currentState.adventurer.darkness = true;
            report.darknessApplied = true;
            report.messages.push("The oil runs dry. Darkness is not an absence of light, but a physical weight on your soul.");
        } else {
            report.messages.push("The shadows continue to gnaw at your mind.");
        }
      }
    }

    // 3. Food/Rest Check (At 20 pips)
    if (currentState.timeTrack >= 20) {
       if (currentState.adventurer.food > 0) {
           currentState.adventurer.food -= 1;
           report.foodConsumed += 1;
           report.messages.push("You huddle in the dirt to eat. The food is ash, but it keeps the heart beating.");
       } else {
           // Starvation
           currentState.adventurer.starvation = true;
           report.starvationApplied = true;
           
           // Apply Damage
           currentState.adventurer.hp -= 1;
           if (currentState.adventurer.hp < 0) currentState.adventurer.hp = 0;
           report.damageTaken += 1;
           report.messages.push("Your stomach is a hollow scream. Starvation withers your strength. You lose 1 HP.");
       }
       
       // Cycle Reset
       currentState.timeTrack = 0;
       report.messages.push("A new cycle of misery begins.");
    }

    return { newState: currentState, report };
  }
}
