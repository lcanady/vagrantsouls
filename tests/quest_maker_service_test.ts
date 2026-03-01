import { assertEquals, assertExists } from "@std/assert";
import { QuestMakerService } from "../server/services/QuestMakerService.ts";

const svc = new QuestMakerService();

// ── Objective lookup ──────────────────────────────────────────────────────────

Deno.test("QuestMakerService - generates quest with a single objective", () => {
    const quest = svc.generate({
        objectiveRolls: [1],
        modifierRoll: 51,  // modifier=0, qr=2
        rewardRoll: 1,
    });
    assertEquals(quest.objectives.length, 1);
    assertExists(quest.objectives[0].description);
    assertExists(quest.objectives[0].qr);
});

Deno.test("QuestMakerService - generates quest with multiple objectives", () => {
    const quest = svc.generate({
        objectiveRolls: [1, 20, 83],
        modifierRoll: 51,
        rewardRoll: 1,
    });
    assertEquals(quest.objectives.length, 3);
});

Deno.test("QuestMakerService - objective roll 1-2 maps to 'Loot 3 Items'", () => {
    const q1 = svc.generate({ objectiveRolls: [1], modifierRoll: 51, rewardRoll: 1 });
    const q2 = svc.generate({ objectiveRolls: [2], modifierRoll: 51, rewardRoll: 1 });
    assertEquals(q1.objectives[0].description, "Loot 3 Items.");
    assertEquals(q2.objectives[0].description, "Loot 3 Items.");
});

Deno.test("QuestMakerService - objective roll 100 maps to highest BOSS objective", () => {
    const quest = svc.generate({ objectiveRolls: [100], modifierRoll: 51, rewardRoll: 1 });
    assertEquals(quest.objectives[0].description.includes("BOSS"), true);
    assertEquals(quest.objectives[0].qr, 3);
});

// ── Encounter modifier ────────────────────────────────────────────────────────

Deno.test("QuestMakerService - modifier roll 1-10 gives modifier=-40", () => {
    const quest = svc.generate({ objectiveRolls: [1], modifierRoll: 5, rewardRoll: 1 });
    assertEquals(quest.encounterModifier, -40);
    assertEquals(quest.encounterRange, "1-60");
});

Deno.test("QuestMakerService - modifier roll 91-100 gives modifier=+20", () => {
    const quest = svc.generate({ objectiveRolls: [1], modifierRoll: 95, rewardRoll: 1 });
    assertEquals(quest.encounterModifier, 20);
    assertEquals(quest.encounterRange, "21-100");
});

// ── QR total ──────────────────────────────────────────────────────────────────

Deno.test("QuestMakerService - qrTotal is sum of objective QRs plus modifier QR", () => {
    // Objective roll 1 → qr=1; modifier roll 51 → qr=2; total=3
    const quest = svc.generate({ objectiveRolls: [1], modifierRoll: 51, rewardRoll: 1 });
    assertEquals(quest.qrTotal, 3);
});

Deno.test("QuestMakerService - qrTotal accumulates across multiple objectives", () => {
    // Roll 100 → qr=3; roll 95 → qr=1; modifier 51 → qr=2; total=6
    const quest = svc.generate({ objectiveRolls: [100, 95], modifierRoll: 51, rewardRoll: 1 });
    assertEquals(quest.qrTotal, quest.objectives.reduce((s, o) => s + o.qr, 0) + 2);
});

// ── Reward tables ─────────────────────────────────────────────────────────────

Deno.test("QuestMakerService - QR ≤ 2 uses QR2 reward table (small gold)", () => {
    // Objective roll 1 → qr=1; modifier roll 1-10 → qr=1; total=2
    const quest = svc.generate({ objectiveRolls: [1], modifierRoll: 1, rewardRoll: 1 });
    assertEquals(quest.qrTotal <= 2, true);
    assertEquals(quest.reward.success.includes("gp"), true);
    assertEquals(quest.reward.failure, "-½gp");
});

Deno.test("QuestMakerService - QR=3 uses QR3 reward table (medium gold)", () => {
    // Roll 1 → qr=1; modifier 51 → qr=2; total=3
    const quest = svc.generate({ objectiveRolls: [1], modifierRoll: 51, rewardRoll: 5 });
    assertEquals(quest.qrTotal, 3);
    assertEquals(quest.reward.success, "+950gp");
    assertEquals(quest.reward.failure, "-5 Skill");
});

Deno.test("QuestMakerService - QR=4 uses QR4 reward table (gold + optional Rep)", () => {
    // Two objectives qr=1 each; modifier 51 → qr=2; total=4
    const quest = svc.generate({ objectiveRolls: [1, 1], modifierRoll: 51, rewardRoll: 1 });
    assertEquals(quest.qrTotal, 4);
    assertExists(quest.reward.success);
    assertExists(quest.reward.failure);
});

Deno.test("QuestMakerService - QR ≥ 5 uses QR5+ reward table (large rewards)", () => {
    // Three objectives with qr=3 each = 9; modifier 91-100 → qr=3; total=12
    const quest = svc.generate({ objectiveRolls: [100, 100, 100], modifierRoll: 95, rewardRoll: 10 });
    assertEquals(quest.qrTotal >= 5, true);
    assertEquals(quest.reward.success, "+5000gp, +1 Rep");
});

// ── Reward roll edge cases ────────────────────────────────────────────────────

Deno.test("QuestMakerService - rewardRoll 1 picks first entry in reward table", () => {
    const quest = svc.generate({ objectiveRolls: [1], modifierRoll: 51, rewardRoll: 1 });
    assertEquals(quest.qrTotal, 3);
    assertEquals(quest.reward.success, "+600gp");
});

Deno.test("QuestMakerService - rewardRoll 10 picks last entry in reward table", () => {
    const quest = svc.generate({ objectiveRolls: [1], modifierRoll: 51, rewardRoll: 10 });
    assertEquals(quest.qrTotal, 3);
    assertEquals(quest.reward.success, "+1800gp");
});

// ── Returned shape ────────────────────────────────────────────────────────────

Deno.test("QuestMakerService - returned quest has all required fields", () => {
    const quest = svc.generate({ objectiveRolls: [50], modifierRoll: 50, rewardRoll: 5 });
    assertExists(quest.objectives);
    assertExists(quest.encounterModifier);
    assertExists(quest.encounterRange);
    assertExists(quest.qrTotal);
    assertExists(quest.reward.success);
    assertExists(quest.reward.failure);
});
