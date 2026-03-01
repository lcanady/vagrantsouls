import { assertEquals, assertExists } from "@std/assert";
import { WitcheryService } from "../server/services/WitcheryService.ts";
import { Adventurer } from "../server/models/adventurer.ts";

// A minimal adventurer for witchery tests
function makeAdventurer(overrides: Partial<Adventurer> = {}): Adventurer {
    return {
        id: "test-id",
        name: "Hero",
        hp: 30, maxHp: 30,
        fate: 3, life: 3,
        str: 50, dex: 40, int: 50,
        experiencePips: 0,
        head: null, torso: null, back: null,
        mainHand: null, offHand: null,
        belt1: null, belt2: null,
        backpack: [],
        reputation: 0, gold: 0,
        oil: 0, food: 0, picks: 0,
        poison: 0, disease: 0,
        darkness: false, starvation: false,
        skills: {}, spells: {}, investments: {},
        monsterParts: [
            { name: "Goblin Claw", rarity: "normal",   value: 10 },
            { name: "Rat Tail",    rarity: "uncommon",  value: 20 },
            { name: "Spider Fang", rarity: "scarce",    value: 30 },
        ],
        witcheryFormulas: {},
        witcheryEffects: [],
        witcheryMishaps: [],
        ...overrides,
    } as Adventurer;
}

const svc = new WitcheryService();

// ── Validation ────────────────────────────────────────────────────────────────

Deno.test("WitcheryService - rejects duplicate parts", () => {
    const adv = makeAdventurer();
    const { result } = svc.attempt(adv, {
        parts: ["Goblin Claw", "Goblin Claw", "Rat Tail"],
        roll: 10, tableRoll: 1,
    });
    assertEquals(result.success, false);
    assertEquals(result.message.includes("different"), true);
});

Deno.test("WitcheryService - rejects parts not in adventurer inventory", () => {
    const adv = makeAdventurer();
    const { result } = svc.attempt(adv, {
        parts: ["Goblin Claw", "Rat Tail", "Dragon Scale"],
        roll: 10, tableRoll: 1,
    });
    assertEquals(result.success, false);
    assertEquals(result.message.includes("Dragon Scale"), true);
});

// ── Parts are consumed regardless of outcome ──────────────────────────────────

Deno.test("WitcheryService - success: parts removed from inventory", () => {
    const adv = makeAdventurer();
    const { adventurer } = svc.attempt(adv, {
        parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
        roll: 10,      // int=50, no formula bonus → threshold=50; roll 10 ≤ 50 = success
        tableRoll: 1,
    });
    assertEquals(adventurer.monsterParts.length, 0);
});

Deno.test("WitcheryService - failure: parts still removed from inventory", () => {
    const adv = makeAdventurer();
    const { adventurer } = svc.attempt(adv, {
        parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
        roll: 80,      // roll 80 > threshold 50 = failure
        tableRoll: 1,
    });
    assertEquals(adventurer.monsterParts.length, 0);
});

// ── Success path ──────────────────────────────────────────────────────────────

Deno.test("WitcheryService - success: adds effect to witcheryEffects", () => {
    const adv = makeAdventurer();
    const { adventurer, result } = svc.attempt(adv, {
        parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
        roll: 10,
        tableRoll: 1,
    });
    assertEquals(result.success, true);
    assertEquals(adventurer.witcheryEffects!.length, 1);
    assertExists(result.effect);
});

Deno.test("WitcheryService - success: learns formula on first attempt", () => {
    const adv = makeAdventurer();
    const { adventurer, result } = svc.attempt(adv, {
        parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
        roll: 10,
        tableRoll: 1,
    });
    assertEquals(result.success, true);
    assertExists(result.formulaKey);
    const storedFormula = adventurer.witcheryFormulas![result.formulaKey!];
    assertExists(storedFormula);
});

Deno.test("WitcheryService - success: formula bonus calculated from part rarities", () => {
    const adv = makeAdventurer();
    const { result } = svc.attempt(adv, {
        parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
        roll: 10,
        tableRoll: 1,
    });
    // RARITY_BONUS: normal=5, uncommon=10, scarce=15 → total=30
    assertEquals(result.formulaBonus, 30);
});

Deno.test("WitcheryService - success: formula not re-learned on repeat attempt", () => {
    const adv = makeAdventurer({
        monsterParts: [
            { name: "Goblin Claw", rarity: "normal",  value: 10 },
            { name: "Rat Tail",    rarity: "uncommon", value: 20 },
            { name: "Spider Fang", rarity: "scarce",   value: 30 },
        ],
        witcheryFormulas: {
            "Goblin Claw|Rat Tail|Spider Fang": {
                parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
                bonus: 30,
                effect: "Potion of Strength: +5 STR",
                mishap:  "You grow a goblin ear.",
            },
        },
    });
    const { adventurer, result } = svc.attempt(adv, {
        parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
        roll: 10,
        tableRoll: 1,
    });
    assertEquals(result.success, true);
    // Formula already known — bonus comes from the formula entry
    const keys = Object.keys(adventurer.witcheryFormulas!);
    assertEquals(keys.length, 1); // still just one formula
});

Deno.test("WitcheryService - known formula adds its bonus to threshold", () => {
    // With formula bonus=30, threshold = int(50) + 30 = 80
    const adv = makeAdventurer({
        monsterParts: [
            { name: "Goblin Claw", rarity: "normal",  value: 10 },
            { name: "Rat Tail",    rarity: "uncommon", value: 20 },
            { name: "Spider Fang", rarity: "scarce",   value: 30 },
        ],
        witcheryFormulas: {
            "Goblin Claw|Rat Tail|Spider Fang": {
                parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
                bonus: 30,
                effect: "Potion of Strength: +5 STR",
                mishap: "You grow a goblin ear.",
            },
        },
    });
    // roll=75 should succeed (75 ≤ 80)
    const { result } = svc.attempt(adv, {
        parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
        roll: 75, tableRoll: 1,
    });
    assertEquals(result.success, true);
});

// ── Failure path ──────────────────────────────────────────────────────────────

Deno.test("WitcheryService - failure: adds mishap to witcheryMishaps", () => {
    const adv = makeAdventurer();
    const { adventurer, result } = svc.attempt(adv, {
        parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
        roll: 80,
        tableRoll: 1,
    });
    assertEquals(result.success, false);
    assertExists(result.mishap);
    assertEquals(adventurer.witcheryMishaps!.length, 1);
});

Deno.test("WitcheryService - failure: no formula learned", () => {
    const adv = makeAdventurer();
    const { adventurer } = svc.attempt(adv, {
        parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
        roll: 80,
        tableRoll: 1,
    });
    assertEquals(Object.keys(adventurer.witcheryFormulas!).length, 0);
});

// ── clearQuestEffects ─────────────────────────────────────────────────────────

Deno.test("WitcheryService - clearQuestEffects empties effects and mishaps", () => {
    const adv = makeAdventurer({
        witcheryEffects:  ["Potion of Strength: +5 STR"],
        witcheryMishaps:  ["You grow a goblin ear."],
    });
    const cleared = svc.clearQuestEffects(adv);
    assertEquals(cleared.witcheryEffects, []);
    assertEquals(cleared.witcheryMishaps, []);
});

Deno.test("WitcheryService - clearQuestEffects preserves formulas", () => {
    const formula = {
        parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
        bonus: 30, effect: "...", mishap: "...",
    };
    const adv = makeAdventurer({
        witcheryFormulas: { "key": formula },
        witcheryEffects:  ["effect"],
        witcheryMishaps:  ["mishap"],
    });
    const cleared = svc.clearQuestEffects(adv);
    assertExists(cleared.witcheryFormulas!["key"]);
});

// ── sellValue ─────────────────────────────────────────────────────────────────

Deno.test("WitcheryService - sellValue returns 0 for unknown formula", () => {
    const adv = makeAdventurer();
    const val = svc.sellValue(adv, ["Goblin Claw", "Rat Tail", "Spider Fang"]);
    assertEquals(val, 0);
});

Deno.test("WitcheryService - sellValue calculates (partSum + formulaBonus) * 2", () => {
    // parts in backpack: Goblin Claw value=10, Rat Tail value=20, Spider Fang value=30
    // formulaBonus=30 → sellValue = (10+20+30+30) * 2 = 180
    const adv = makeAdventurer({
        witcheryFormulas: {
            "Goblin Claw|Rat Tail|Spider Fang": {
                parts: ["Goblin Claw", "Rat Tail", "Spider Fang"],
                bonus: 30, effect: "...", mishap: "...",
            },
        },
    });
    const val = svc.sellValue(adv, ["Goblin Claw", "Rat Tail", "Spider Fang"]);
    assertEquals(val, (10 + 20 + 30 + 30) * 2);
});
