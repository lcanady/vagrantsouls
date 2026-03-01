import { assertEquals } from "@std/assert";
import { TimeService } from "../../server/services/time.ts";
import { createInitialState } from "../../server/state.ts";

Deno.test("TimeService Tests", async (t) => {
  const timeService = new TimeService();

  await t.step("Increment Time - Basic", () => {
    const state = createInitialState();
    state.timeTrack = 0;
    
    const { newState, report } = timeService.incrementTime(state);
    
    assertEquals(newState.timeTrack, 1);
    assertEquals(report.timeIncremented, 1);
    assertEquals(report.oilConsumed, 0);
  });

  await t.step("Oil Check - At 10 Pips", () => {
    const state = createInitialState();
    state.timeTrack = 9;
    state.adventurer.oil = 5;
    
    const { newState, report } = timeService.incrementTime(state);
    
    assertEquals(newState.timeTrack, 10);
    assertEquals(newState.adventurer.oil, 4);
    assertEquals(report.oilConsumed, 1);
    assertEquals(report.darknessApplied, false);
  });

  await t.step("Oil Check - Run Out (Darkness)", () => {
    const state = createInitialState();
    state.timeTrack = 9;
    state.adventurer.oil = 0;
    
    const { newState, report } = timeService.incrementTime(state);
    
    assertEquals(newState.timeTrack, 10);
    assertEquals(newState.adventurer.oil, 0);
    assertEquals(newState.adventurer.darkness, true);
    assertEquals(report.darknessApplied, true);
  });

  await t.step("Food Check - At 20 Pips (Rest)", () => {
    const state = createInitialState();
    state.timeTrack = 19;
    state.adventurer.food = 5;
    
    const { newState, report } = timeService.incrementTime(state);
    
    assertEquals(newState.timeTrack, 0); // Should reset
    assertEquals(newState.adventurer.food, 4);
    assertEquals(report.foodConsumed, 1);
    assertEquals(report.starvationApplied, false);
  });

  await t.step("Food Check - Run Out (Starvation & Damage)", () => {
    const state = createInitialState();
    state.timeTrack = 19;
    state.adventurer.food = 0;
    state.adventurer.hp = 10;
    
    const { newState, report } = timeService.incrementTime(state);
    
    assertEquals(newState.timeTrack, 0);
    assertEquals(newState.adventurer.food, 0);
    assertEquals(newState.adventurer.starvation, true);
    assertEquals(newState.adventurer.hp, 9);
    assertEquals(report.starvationApplied, true);
    assertEquals(report.damageTaken, 1);
  });

  await t.step("Simultaneous Oil & Food Check (At 20)", () => {
      // The rules say "If timeTrack hits a multiple of 10... oil check"
      // And "If timeTrack hits 20... food check"
      // So at 20, BOTH should happen?
      // My implementation does 10 check for % 10 === 0. 20 % 10 is 0.
      // So yes, both checks happen.
      
      const state = createInitialState();
      state.timeTrack = 19;
      state.adventurer.oil = 5;
      state.adventurer.food = 5;
      
      const { newState, report } = timeService.incrementTime(state);
      
      assertEquals(newState.timeTrack, 0); 
      // Logic check:
      // 1. time becomes 20.
      // 2. 20 % 10 == 0 -> Oil consumed (oil=4)
      // 3. time >= 20 -> Food consumed (food=4), time reset to 0.
      
      assertEquals(newState.adventurer.oil, 4);
      assertEquals(newState.adventurer.food, 4);
      assertEquals(report.oilConsumed, 1);
      assertEquals(report.foodConsumed, 1);
  });

});
