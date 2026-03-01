/**
 * BeastService tests
 * Beast Mastery system.  RED phase: these tests define expected behavior.
 */
import { assertEquals, assertExists } from "@std/assert";
import { BeastService } from "../server/services/BeastService.ts";
import { Adventurer } from "../server/models/adventurer.ts";
import { Beast } from "../server/models/adventurer.ts";

function makeAdventurer(overrides: Partial<Adventurer> = {}): Adventurer {
  return {
    id: crypto.randomUUID(),
    name: "Brunel",
    hp: 30, maxHp: 30,
    fate: 3, life: 3,
    str: 50, dex: 40, int: 50,
    experiencePips: 0,
    head: null, torso: null, back: null,
    mainHand: null, offHand: null,
    belt1: null, belt2: null,
    backpack: [],
    reputation: 5, gold: 1000,
    oil: 10, food: 10, picks: 5,
    poison: 0, disease: 0,
    darkness: false, starvation: false,
    skills: {}, spells: {}, investments: {},
    monsterParts: [],
    witcheryFormulas: {},
    witcheryEffects: [],
    witcheryMishaps: [],
    campaignQuests: {},
    sideQuests: {},
    questsCompleted: 0,
    questsFailed: 0,
    combatExperience: {},
    guildId: undefined,
    guildStanding: 0,
    beast: null,
    arcanist: null,
    artisan: null,
    property: null,
    ...overrides,
  } as Adventurer;
}

function makeBeast(overrides: Partial<Beast> = {}): Beast {
  return {
    name: "Hunting Dog",
    level: 1,
    bonus: 0,
    gpValue: 300,
    abilities: ["Guard", "Guide"],
    hp: 8,
    currentHp: 8,
    trainingPips: 0,
    isCooperative: true,
    isDragonHatchling: false,
    dragonHearts: 0,
    ...overrides,
  };
}

const svc = new BeastService();

// ── buyBeast ──────────────────────────────────────────────────────────────────

Deno.test("BeastService.buyBeast - creates beast from table Y roll and deducts gold", () => {
  const adv = makeAdventurer({ gold: 2000 });
  const { adventurer, beast, result } = svc.buyBeast(adv, { roll: 15 }); // 11-20 = Hunting Dog
  assertEquals(result.success, true);
  assertExists(beast);
  assertEquals(beast.name, "Hunting Dog");
  assertEquals(beast.level, 1);
  assertEquals(beast.hp, 8);
  assertEquals(beast.currentHp, 8);
  assertEquals(beast.abilities.includes("Guard"), true);
  assertEquals(beast.abilities.includes("Guide"), true);
  assertEquals(adventurer.gold, 2000 - 300); // 300gp base cost
});

Deno.test("BeastService.buyBeast - replaces existing beast", () => {
  const adv = makeAdventurer({ gold: 5000, beast: makeBeast({ name: "Wolf" }) });
  const { adventurer, result } = svc.buyBeast(adv, { roll: 15 }); // Hunting Dog
  assertEquals(result.success, true);
  assertEquals(adventurer.beast?.name, "Hunting Dog");
});

Deno.test("BeastService.buyBeast - fails if not enough gold", () => {
  const adv = makeAdventurer({ gold: 100 });
  const { result } = svc.buyBeast(adv, { roll: 15 });
  assertEquals(result.success, false);
});

Deno.test("BeastService.buyBeast - Dragon Hatchling costs 5000gp", () => {
  const adv = makeAdventurer({ gold: 5000 });
  const { adventurer, beast } = svc.buyBeast(adv, { roll: 100 });
  assertExists(beast);
  assertEquals(beast.name, "Dragon Hatchling");
  assertEquals(adventurer.gold, 0);
  assertEquals(beast.isDragonHatchling, true);
});

// ── tameBeast ─────────────────────────────────────────────────────────────────

Deno.test("BeastService.tameBeast - success adds beast at level 1", () => {
  const adv = makeAdventurer();
  const monsterName = "Giant Rat"; // found on table E/Y
  const { adventurer, result } = svc.tameBeast(adv, {
    monsterName,
    roll: 30, // roll ≤ int + bonus = 50 + 0 = 50 → success
  });
  assertEquals(result.success, true);
  assertExists(adventurer.beast);
  assertEquals(adventurer.beast.name, "Giant Rat");
  assertEquals(adventurer.beast.level, 1);
});

Deno.test("BeastService.tameBeast - failure means monster attacks with +1 damage die", () => {
  const adv = makeAdventurer({ int: 20 });
  const { result } = svc.tameBeast(adv, {
    monsterName: "Giant Rat",
    roll: 90, // roll > 20 + 0 = fail
  });
  assertEquals(result.success, false);
  assertEquals(result.extraDamageDice, 1);
});

Deno.test("BeastService.tameBeast - cannot tame if adventurer already has a beast", () => {
  const adv = makeAdventurer({ beast: makeBeast() });
  const { result } = svc.tameBeast(adv, { monsterName: "Giant Rat", roll: 10 });
  // Per rules: old beast wanders off when new one is acquired
  // So taming replaces existing — this is valid
  assertEquals(result.success, true);
});

Deno.test("BeastService.tameBeast - fails for monster not on table Y", () => {
  const adv = makeAdventurer();
  const { result } = svc.tameBeast(adv, { monsterName: "Unknown Blob", roll: 5 });
  assertEquals(result.success, false);
  assertEquals(result.message.toLowerCase().includes("cannot"), true);
});

// ── trainBeast ────────────────────────────────────────────────────────────────

Deno.test("BeastService.trainBeast - success shades one pip on training track", () => {
  const adv = makeAdventurer({ beast: makeBeast({ trainingPips: 3 }) });
  const { adventurer, result } = svc.trainBeast(adv, { roll: 30 }); // ≤ 50 + 0
  assertEquals(result.success, true);
  assertEquals(adventurer.beast?.trainingPips, 4);
  assertEquals(adventurer.beast?.isCooperative, true);
});

Deno.test("BeastService.trainBeast - failure makes beast uncooperative next quest", () => {
  const adv = makeAdventurer({ beast: makeBeast(), int: 20 });
  const { adventurer, result } = svc.trainBeast(adv, { roll: 80 }); // > 20
  assertEquals(result.success, false);
  assertEquals(adventurer.beast?.isCooperative, false);
});

Deno.test("BeastService.trainBeast - 10 pips causes level up", () => {
  const adv = makeAdventurer({ beast: makeBeast({ trainingPips: 9 }) });
  const { adventurer, result } = svc.trainBeast(adv, { roll: 10 });
  assertEquals(result.success, true);
  assertEquals(result.leveledUp, true);
  assertEquals(adventurer.beast?.level, 2);
  assertEquals(adventurer.beast?.trainingPips, 0);
  assertEquals(adventurer.beast?.hp, 9); // +1 HP per level
  assertEquals(adventurer.beast?.bonus, 1); // +1 Beast Bonus per level
});

Deno.test("BeastService.trainBeast - no beast returns error", () => {
  const adv = makeAdventurer();
  const { result } = svc.trainBeast(adv, { roll: 10 });
  assertEquals(result.success, false);
});

// ── sellBeast ─────────────────────────────────────────────────────────────────

Deno.test("BeastService.sellBeast - returns gold = gpValue * level", () => {
  const adv = makeAdventurer({ gold: 0, beast: makeBeast({ gpValue: 300, level: 3 }) });
  const { adventurer, result } = svc.sellBeast(adv);
  assertEquals(result.success, true);
  assertEquals(result.goldGained, 900);
  assertEquals(adventurer.gold, 900);
  assertEquals(adventurer.beast, null);
});

Deno.test("BeastService.sellBeast - no beast returns error", () => {
  const adv = makeAdventurer();
  const { result } = svc.sellBeast(adv);
  assertEquals(result.success, false);
});

// ── useBeastAbility ───────────────────────────────────────────────────────────

Deno.test("BeastService.useBeastAbility - reduces remaining uses", () => {
  const beast = makeBeast({ level: 2, abilities: ["Guard", "Guide"] });
  const adv = makeAdventurer({ beast });
  // Level 2 beast has 2 uses per quest; starts at 0 used
  const { adventurer, result } = svc.useBeastAbility(adv, { ability: "Guard", usesThisQuest: 0 });
  assertEquals(result.success, true);
  assertEquals(result.effect, "The adventurer gains +10 to their Dodge skill for their next test.");
});

Deno.test("BeastService.useBeastAbility - fails if uses exhausted", () => {
  const beast = makeBeast({ level: 1, abilities: ["Guard"] });
  const adv = makeAdventurer({ beast });
  // Level 1 = 1 use; already used 1
  const { result } = svc.useBeastAbility(adv, { ability: "Guard", usesThisQuest: 1 });
  assertEquals(result.success, false);
});

Deno.test("BeastService.useBeastAbility - fails if beast is uncooperative", () => {
  const beast = makeBeast({ level: 2, abilities: ["Guard"], isCooperative: false });
  const adv = makeAdventurer({ beast });
  const { result } = svc.useBeastAbility(adv, { ability: "Guard", usesThisQuest: 0 });
  assertEquals(result.success, false);
  assertEquals(result.message.toLowerCase().includes("cooperative"), true);
});

Deno.test("BeastService.useBeastAbility - fails for ability not in beast's list", () => {
  const beast = makeBeast({ level: 2, abilities: ["Guard"] });
  const adv = makeAdventurer({ beast });
  const { result } = svc.useBeastAbility(adv, { ability: "Attack", usesThisQuest: 0 });
  assertEquals(result.success, false);
});

// ── deflectDamage ─────────────────────────────────────────────────────────────

Deno.test("BeastService.deflectDamage - deflects up to beast level HP to beast", () => {
  const beast = makeBeast({ level: 3, currentHp: 8 });
  const adv = makeAdventurer({ beast, hp: 20 });
  const { adventurer, beastDamage, adventurerDamage } = svc.deflectDamage(adv, { incomingDamage: 5 });
  // Up to 3 (level) deflected to beast
  assertEquals(beastDamage, 3);
  assertEquals(adventurerDamage, 2);
  assertEquals(adventurer.beast?.currentHp, 5); // 8 - 3
  assertEquals(adventurer.hp, 18); // 20 - 2
});

Deno.test("BeastService.deflectDamage - no deflection when beast is uncooperative", () => {
  const beast = makeBeast({ level: 3, currentHp: 8, isCooperative: false });
  const adv = makeAdventurer({ beast, hp: 20 });
  const { beastDamage, adventurerDamage } = svc.deflectDamage(adv, { incomingDamage: 5 });
  assertEquals(beastDamage, 0);
  assertEquals(adventurerDamage, 5);
});

Deno.test("BeastService.deflectDamage - beast dies when currentHp reaches 0", () => {
  const beast = makeBeast({ level: 3, currentHp: 2 });
  const adv = makeAdventurer({ beast });
  const { adventurer } = svc.deflectDamage(adv, { incomingDamage: 5 });
  // Beast takes min(3, 5) = 3 but only has 2 HP → dies
  assertEquals(adventurer.beast?.currentHp, 0);
});

// ── Dragon Hatchling resurrection ─────────────────────────────────────────────

Deno.test("BeastService.dragonResurrect - uses a dragon heart to revive adventurer", () => {
  const beast = makeBeast({ isDragonHatchling: true, dragonHearts: 2, level: 3, abilities: ["Lure", "Guard", "Trick"] });
  const adv = makeAdventurer({ beast, hp: 0, life: 1 });
  const { adventurer, result } = svc.dragonResurrect(adv);
  assertEquals(result.success, true);
  assertEquals(adventurer.beast?.dragonHearts, 1);
  assertEquals(adventurer.hp > 0, true); // revived
});

Deno.test("BeastService.dragonResurrect - dragon dies after last heart used", () => {
  const beast = makeBeast({ isDragonHatchling: true, dragonHearts: 1, level: 3, abilities: ["Lure", "Guard", "Trick"] });
  const adv = makeAdventurer({ beast, hp: 0 });
  const { adventurer } = svc.dragonResurrect(adv);
  assertEquals(adventurer.beast, null); // dragon died
});

Deno.test("BeastService.dragonResurrect - fails if beast is not a dragon", () => {
  const beast = makeBeast({ isDragonHatchling: false });
  const adv = makeAdventurer({ beast });
  const { result } = svc.dragonResurrect(adv);
  assertEquals(result.success, false);
});
