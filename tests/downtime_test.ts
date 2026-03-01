import { assertEquals } from "@std/assert";
import { DowntimeService } from "../server/services/DowntimeService.ts";
import { Book1TableService } from "../server/services/table_service.ts";
import { createInitialState } from "../server/state.ts";

const tableService = new Book1TableService();
const downtimeService = new DowntimeService(tableService);

Deno.test("DowntimeService - refreshTracks should reset timeTrack", () => {
    let state = createInitialState();
    state.timeTrack = 10;
    state = downtimeService.refreshTracks(state);
    assertEquals(state.timeTrack, 0);
});

Deno.test("DowntimeService - heal should spend gold and increase HP", () => {
    let state = createInitialState();
    state.adventurer.hp = 10;
    state.adventurer.maxHp = 20;
    state.adventurer.gold = 100;
    
    state = downtimeService.heal(state, 5);
    assertEquals(state.adventurer.hp, 15);
    assertEquals(state.adventurer.gold, 50);
});

Deno.test("DowntimeService - repairItem should spend gold and remove damage pips", () => {
    let state = createInitialState();
    const itemId = "test-item";
    state.adventurer.backpack.push({
        id: itemId,
        name: "Rusty Sword",
        value: 100,
        fix: 10,
        damagePips: 3,
        bonus: 0,
        twoHanded: false,
        usable: false
    });
    state.adventurer.gold = 100;

    state = downtimeService.repairItem(state, itemId, 2);
    assertEquals(state.adventurer.backpack[0].damagePips, 1);
    assertEquals(state.adventurer.gold, 80);
});

Deno.test("DowntimeService - sellItem should remove item and add gold", () => {
    let state = createInitialState();
    const itemId = "sell-item";
    state.adventurer.backpack.push({
        id: itemId,
        name: "Valuable Gem",
        value: 500,
        fix: 50,
        damagePips: 2,
        bonus: 0,
        twoHanded: false,
        usable: false
    });
    state.adventurer.gold = 0;

    // Value = 500 - (50 * 2) = 400
    state = downtimeService.sellItem(state, itemId);
    assertEquals(state.adventurer.backpack.length, 0);
    assertEquals(state.adventurer.gold, 400);
});

Deno.test("DowntimeService - buyNeededItem should update resources", () => {
    let state = createInitialState();
    state.adventurer.gold = 100;
    state.adventurer.food = 0;

    state = downtimeService.buyNeededItem(state, "Food");
    assertEquals(state.adventurer.food, 1);
    assertEquals(state.adventurer.gold, 95);

    state = downtimeService.buyNeededItem(state, "Bandage");
    assertEquals(state.adventurer.backpack.length, 1);
    assertEquals(state.adventurer.backpack[0].name, "Bandage");
});

Deno.test("DowntimeService - train should increase skills/stats", () => {
    let state = createInitialState();
    state.adventurer.gold = 1000;
    state.adventurer.skills["Bravery"] = 5;

    state = downtimeService.train(state, "Bravery", 2);
    assertEquals(state.adventurer.skills["Bravery"], 7);
    assertEquals(state.adventurer.gold, 600); // 200 * 2 = 400 cost
});

Deno.test("DowntimeService - magicTuition should increase spell pips", () => {
    let state = createInitialState();
    state.adventurer.gold = 5000;
    state.adventurer.spells["Fireball"] = 1;

    state = downtimeService.magicTuition(state, "Fireball", 2);
    assertEquals(state.adventurer.spells["Fireball"], 3);
    assertEquals(state.adventurer.gold, 1000); // 2000 * 2 = 4000 cost
});

Deno.test("DowntimeService - processInvestments should update shares and pips", () => {
    let state = createInitialState();
    state.adventurer.investments["TRADE"] = { shares: 2, pips: 0 };
    
    // Major Boom (roll 100) -> +4 change * 100% of shares? 
    // Wait, DowntimeService.ts says: totalChange = result.change * investment.shares;
    // result.change for Major Boom is 4.
    // So 4 * 2 = 8 pips added.
    // 8 pips -> +1 share (5 pips) and 3 leftover pips.
    state = downtimeService.processInvestments(state, { "TRADE": 100 });
    assertEquals(state.adventurer.investments["TRADE"].shares, 3);
    assertEquals(state.adventurer.investments["TRADE"].pips, 3);
});
