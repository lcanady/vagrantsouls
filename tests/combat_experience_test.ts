/**
 * CombatExperienceService tests
 * Tracks kills per monster type and unlocks special abilities.  RED phase.
 */
import { assertEquals, assertExists } from "@std/assert";
import { CombatExperienceService } from "../server/services/CombatExperienceService.ts";
import { Adventurer } from "../server/models/adventurer.ts";

function makeAdventurer(overrides: Partial<Adventurer> = {}): Adventurer {
  return {
    id: crypto.randomUUID(),
    name: "Warrior",
    hp: 30, maxHp: 30,
    fate: 3, life: 3,
    str: 50, dex: 40, int: 30,
    experiencePips: 0,
    head: null, torso: null, back: null,
    mainHand: null, offHand: null,
    belt1: null, belt2: null,
    backpack: [],
    reputation: 3, gold: 500,
    oil: 10, food: 10, picks: 5,
    poison: 0, disease: 0,
    darkness: false, starvation: false,
    skills: {}, spells: {}, investments: {},
    monsterParts: [],
    witcheryFormulas: {}, witcheryEffects: [], witcheryMishaps: [],
    campaignQuests: {}, sideQuests: {},
    questsCompleted: 0, questsFailed: 0,
    combatExperience: {},
    guildId: undefined,
    guildStanding: 0,
    beast: null, arcanist: null, artisan: null, property: null,
    ...overrides,
  } as Adventurer;
}

const svc = new CombatExperienceService();

// ── recordKill ────────────────────────────────────────────────────────────────

Deno.test("CombatExperienceService.recordKill - shades 1 pip for monster", () => {
  const adv = makeAdventurer();
  const { adventurer } = svc.recordKill(adv, { monsterName: "Goblin" });
  assertEquals(adventurer.combatExperience["Goblin"], 1);
});

Deno.test("CombatExperienceService.recordKill - accumulates kills", () => {
  const adv = makeAdventurer({ combatExperience: { "Goblin": 5 } });
  const { adventurer } = svc.recordKill(adv, { monsterName: "Goblin" });
  assertEquals(adventurer.combatExperience["Goblin"], 6);
});

Deno.test("CombatExperienceService.recordKill - caps at 20 pips", () => {
  const adv = makeAdventurer({ combatExperience: { "Goblin": 20 } });
  const { adventurer } = svc.recordKill(adv, { monsterName: "Goblin" });
  assertEquals(adventurer.combatExperience["Goblin"], 20);
});

Deno.test("CombatExperienceService.recordKill - pack monster needs full pack defeated", () => {
  const adv = makeAdventurer();
  // Indicates the whole pack was defeated (packDefeated = true)
  const { adventurer } = svc.recordKill(adv, { monsterName: "Goblin Pack", packDefeated: true });
  assertEquals(adventurer.combatExperience["Goblin Pack"], 1);
});

Deno.test("CombatExperienceService.recordKill - individual pack member does not award pip", () => {
  const adv = makeAdventurer();
  const { adventurer } = svc.recordKill(adv, { monsterName: "Goblin Pack", packDefeated: false });
  assertEquals(adventurer.combatExperience["Goblin Pack"] ?? 0, 0);
});

// ── getUnlockedAbilities ──────────────────────────────────────────────────────

Deno.test("CombatExperienceService.getUnlockedAbilities - returns empty array below 10 pips", () => {
  const abilities = svc.getUnlockedAbilities("Goblin", 9);
  assertEquals(abilities.length, 0);
});

Deno.test("CombatExperienceService.getUnlockedAbilities - returns level10 ability at 10 pips", () => {
  const abilities = svc.getUnlockedAbilities("Goblin", 10);
  // At least one ability should be returned
  assertEquals(abilities.length >= 1, true);
  assertExists(abilities[0].name);
  assertExists(abilities[0].description);
  assertEquals(abilities[0].tier, 10);
});

Deno.test("CombatExperienceService.getUnlockedAbilities - returns both abilities at 20 pips", () => {
  const abilities = svc.getUnlockedAbilities("Goblin", 20);
  assertEquals(abilities.length, 2);
  assertEquals(abilities[0].tier, 10);
  assertEquals(abilities[1].tier, 20);
});

// ── getCombatStatus ───────────────────────────────────────────────────────────

Deno.test("CombatExperienceService.getCombatStatus - returns pips and unlocked abilities", () => {
  const adv = makeAdventurer({ combatExperience: { "Goblin": 15 } });
  const status = svc.getCombatStatus(adv, "Goblin");
  assertEquals(status.pips, 15);
  assertEquals(status.unlockedAbilities.length >= 1, true);
});

Deno.test("CombatExperienceService.getCombatStatus - zero pips for unknown monster", () => {
  const adv = makeAdventurer();
  const status = svc.getCombatStatus(adv, "Dragon");
  assertEquals(status.pips, 0);
  assertEquals(status.unlockedAbilities.length, 0);
});
