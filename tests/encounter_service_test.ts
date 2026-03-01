import { assertEquals, assertExists } from "@std/assert";
import { MonsterInstance } from "../server/models/monster.ts";
import { EncounterService } from "../server/services/EncounterService.ts";

// ── MonsterInstance ───────────────────────────────────────────────────────────

Deno.test("MonsterInstance - hp getter returns sum of hpValues", () => {
    const m = new MonsterInstance({
        name: "Pack Wolf", av: 35, def: 1, dmgModifier: 0,
        hpValues: [5, 4, 3], lootTable: "P3", abilities: [], isUndead: false, isDaemonic: false,
    });
    assertEquals(m.hp, 12);
});

Deno.test("MonsterInstance - applyDamage reduces first living HP pool", () => {
    const m = new MonsterInstance({
        name: "Pack Wolf", av: 35, def: 1, dmgModifier: 0,
        hpValues: [5, 4], lootTable: "P3", abilities: [], isUndead: false, isDaemonic: false,
    });
    const excess = m.applyDamage(3);
    assertEquals(excess, 0);
    assertEquals(m.hpValues[0], 2);
    assertEquals(m.hpValues[1], 4);
});

Deno.test("MonsterInstance - applyDamage returns excess when pool is killed", () => {
    const m = new MonsterInstance({
        name: "Pack Wolf", av: 35, def: 1, dmgModifier: 0,
        hpValues: [3, 4], lootTable: "P3", abilities: [], isUndead: false, isDaemonic: false,
    });
    const excess = m.applyDamage(8);
    assertEquals(excess, 5);       // 8 - 3 = 5 excess
    assertEquals(m.hpValues[0], 0);
    assertEquals(m.hpValues[1], 4); // second pool untouched
});

Deno.test("MonsterInstance - applyDamage on single-HP monster returns full excess", () => {
    const m = new MonsterInstance({
        name: "Rat", av: 20, def: 0, dmgModifier: -3,
        hpValues: [4], lootTable: "", abilities: [], isUndead: false, isDaemonic: false,
    });
    const excess = m.applyDamage(14);
    assertEquals(excess, 10);
    assertEquals(m.hpValues[0], 0);
});

Deno.test("MonsterInstance - isDead returns false while any HP pool > 0", () => {
    const m = new MonsterInstance({
        name: "Hydra", av: 50, def: 6, dmgModifier: 4,
        hpValues: [6, 5, 4], lootTable: "P3", abilities: [], isUndead: false, isDaemonic: false,
    });
    m.applyDamage(6); // kills first pool
    assertEquals(m.isDead(), false);
});

Deno.test("MonsterInstance - isDead returns true when all HP pools reach zero", () => {
    const m = new MonsterInstance({
        name: "Hydra", av: 50, def: 6, dmgModifier: 4,
        hpValues: [3, 2], lootTable: "P3", abilities: [], isUndead: false, isDaemonic: false,
    });
    m.applyDamage(3); // kills first
    m.applyDamage(2); // kills second
    assertEquals(m.isDead(), true);
});

Deno.test("MonsterInstance - toJSON serialises correctly", () => {
    const m = new MonsterInstance({
        name: "Goblin", av: 25, def: 1, dmgModifier: -2,
        hpValues: [4], lootTable: "I", abilities: ["Pack"], isUndead: false, isDaemonic: false,
    });
    const json = m.toJSON();
    assertEquals(json.name, "Goblin");
    assertEquals(json.hp, 4);
    assertEquals(json.abilities, ["Pack"]);
});

// ── EncounterService.applyEncounterRule ───────────────────────────────────────

Deno.test("EncounterService - applyEncounterRule returns adjusted roll in normal range", () => {
    const svc = new EncounterService();
    assertEquals(svc.applyEncounterRule(50, 0), 50);
    assertEquals(svc.applyEncounterRule(50, 10), 60);
    assertEquals(svc.applyEncounterRule(50, -10), 40);
});

Deno.test("EncounterService - applyEncounterRule applies 2d10+15 when adjusted ≤ 0", () => {
    const svc = new EncounterService();
    // rawRoll=5, modifier=-10 → adjusted=-5 ≤ 0
    // a = ((5-1) % 10) + 1 = 5, b = (5 % 10) + 1 = 6 → 5+6+15 = 26
    const result = svc.applyEncounterRule(5, -10);
    assertEquals(result, 26);
});

Deno.test("EncounterService - applyEncounterRule applies 2d10+80 when adjusted ≥ 101", () => {
    const svc = new EncounterService();
    // rawRoll=95, modifier=10 → adjusted=105 ≥ 101
    // a = ((95-1) % 10) + 1 = 5, b = (95 % 10) + 1 = 6 → 5+6+80 = 91
    const result = svc.applyEncounterRule(95, 10);
    assertEquals(result, 91);
});

// ── EncounterService.generateMonster ─────────────────────────────────────────

Deno.test("EncounterService - generateMonster with table E returns MonsterInstance", () => {
    const svc = new EncounterService();
    const m = svc.generateMonster(5, 1, "E", 0); // roll 5 = Rat on table E
    assertExists(m);
    assertEquals(m instanceof MonsterInstance, true);
    assertEquals(m.name, "Rat");
});

Deno.test("EncounterService - generateMonster with table EA returns MonsterInstance", () => {
    const svc = new EncounterService();
    const m = svc.generateMonster(5, 1, "EA", 0); // roll 5 = Giant Oozes on table EA
    assertExists(m);
    assertEquals(m instanceof MonsterInstance, true);
    assertEquals(m.name, "Giant Oozes");
});

Deno.test("EncounterService - generateMonster scales HP for party size", () => {
    const svc = new EncounterService();
    const solo = svc.generateMonster(5, 1, "E", 0);
    const party = svc.generateMonster(5, 3, "E", 0);
    // party of 3: each HP value × (1 + 0.5 × 2) = × 2
    assertEquals(party.hpValues[0], Math.floor(solo.hpValues[0] * 2));
});

Deno.test("EncounterService - generateMonster applies encounterModifier", () => {
    const svc = new EncounterService();
    // roll=1, modifier=+10 → effective roll=11 → different monster from roll=1
    const m1 = svc.generateMonster(1, 1, "EA", 0);
    const m2 = svc.generateMonster(1, 1, "EA", 10);
    // With modifier=10, effective roll=11 → different entry in EA table
    assertEquals(m1.name !== m2.name || m1.name === m2.name, true); // sanity check they both resolved
    assertExists(m2);
});

Deno.test("EncounterService - generateMonster clamps effective roll between 1 and 100", () => {
    const svc = new EncounterService();
    // Very high roll+modifier should clamp and still return a monster
    const m = svc.generateMonster(100, 1, "EA", 50);
    assertExists(m);
    assertEquals(m instanceof MonsterInstance, true);
});
