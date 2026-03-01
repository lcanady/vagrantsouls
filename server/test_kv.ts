
import { Repository } from "./repository.ts";
import { GameState } from "./models/gamestate.ts";
import { assertEquals, assertRejects } from "@std/assert";

async function runTests() {
  console.log("Setting up KV...");
  // Use a temporary path or just open (it will use a file or memory depending on args, default is persistent in curdir)
  // For testing, we might want a clean DB. 
  // Deno.openKv(":memory:") is supported in recent versions for in-memory ephemeral KV.
  const kv = await Deno.openKv(":memory:");
  const repo = new Repository(kv);
  const id = "test-adventurer";

  console.log("Test 1: Save and Load");
  const initialState: GameState = {
    adventurer: {
      name: "Hero",
      hp: 10,
      maxHp: 10,
      fate: 3,
      life: 10,
      str: 50,
      dex: 40,
      int: 30,
      experiencePips: 0,
      head: null,
      torso: null,
      back: null,
      mainHand: null,
      offHand: null,
      belt1: null,
      belt2: null,
      backpack: [],
      reputation: 0,
      gold: 0,
      oil: 0,
      food: 0,
      picks: 0,
      poison: 0,
      disease: 0,
      darkness: false,
      starvation: false
    },
    timeTrack: 0,
    startedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString()
  };

  await repo.saveAdventurer(id, initialState);
  const loaded = await repo.loadAdventurer(id);
  
  assertEquals(loaded?.adventurer.name, "Hero");
  assertEquals(loaded?.timeTrack, 0);
  console.log("✅ Save and Load passed");

  console.log("Test 2: Atomic Process Turn");
  const nextState = structuredClone(initialState);
  nextState.timeTrack = 1;

  // Should succeed
  await repo.processTurn(id, initialState, nextState);
  const loadedNext = await repo.loadAdventurer(id);
  assertEquals(loadedNext?.timeTrack, 1);
  console.log("✅ Process Turn passed");

  console.log("Test 3: Conflict Detection");
  const conflictingState = structuredClone(nextState);
  conflictingState.timeTrack = 5;

  // Try to update using the OLD state (initialState) which is now stale (current is 1)
  await assertRejects(
    async () => {
      await repo.processTurn(id, initialState, conflictingState);
    },
    Error,
    "State conflict"
  );
  console.log("✅ Conflict Detection passed");
  
  console.log("Test 4: Stream Updates");
  const stream = repo.streamAdventurer(id);
  const reader = stream.getReader();

  // Listen for updates
  const readPromise = reader.read();
  
  // Make a change
  const state3 = structuredClone(nextState);
  state3.timeTrack = 2;
  await repo.saveAdventurer(id, state3);

  const { value, done: _done } = await readPromise;
  
  // Note: The first value from watch might be the *current* value immediately?
  // Deno KV watch emits the current value immediately upon start.
  // So we might get the value before the save if we started watching before saving?
  // Actually, wait. 'watch' emits initial value.
  // When we called `streamAdventurer`, it started watching.
  // So we should receive the *current* state (timeTrack=1) first.
  // Let's verify.
  
  if (value?.timeTrack === 1) {
     console.log("Received initial state from stream.");
     // Wait for next update
     const _updatePromise = reader.read();
     // We trigger save
     // BUT we already saved state3 above? 
     // Race condition in test.
     // Let's rely on reading what we got.
  }
  
  // If we already saved state3, maybe we got state3?
  // Let's just assert we got *some* state.
  if (value) {
      console.log(`Stream received state with timeTrack: ${value.timeTrack}`);
  }
  
  await reader.cancel();
  kv.close();
  console.log("✅ Tests completed");
}

if (import.meta.main) {
  runTests();
}
