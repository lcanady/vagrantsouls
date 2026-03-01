/**
 * ArcanistService tests
 * Arcanist advanced caster hero path.  RED phase.
 */
import { assertEquals, assertExists } from "@std/assert";
import { ArcanistService } from "../server/services/ArcanistService.ts";
import { Adventurer } from "../server/models/adventurer.ts";

function makeAdventurer(overrides: Partial<Adventurer> = {}): Adventurer {
  return {
    id: crypto.randomUUID(),
    name: "Sorceria",
    hp: 30, maxHp: 30,
    fate: 3, life: 3,
    str: 40, dex: 40, int: 65,
    experiencePips: 0,
    head: null, torso: null, back: null,
    mainHand: null, offHand: null,
    belt1: null, belt2: null,
    backpack: [],
    reputation: 4, gold: 10000,
    oil: 10, food: 10, picks: 5,
    poison: 0, disease: 0,
    darkness: false, starvation: false,
    skills: { Magic: 10 }, spells: {
      "Fireball": 1, "Heal": 1, "Shield": 1, "Lightning": 1, "Freeze": 1,
    },
    investments: {},
    monsterParts: [],
    witcheryFormulas: {}, witcheryEffects: [], witcheryMishaps: [],
    campaignQuests: {}, sideQuests: {},
    questsCompleted: 0, questsFailed: 0,
    combatExperience: {},
    guildId: undefined,
    guildStanding: 0,
    beast: null, arcanist: null, artisan: null, property: null,
    path: "Sorcerer",
    ...overrides,
  } as Adventurer;
}

const svc = new ArcanistService();

// ── Becoming an Arcanist ──────────────────────────────────────────────────────

Deno.test("ArcanistService.becomeArcanist - succeeds with valid prerequisites", () => {
  const adv = makeAdventurer();
  const { result } = svc.becomeArcanist(adv, { order: "Alchemy" });
  assertEquals(result.success, true);
  assertExists(result.adventurer.arcanist);
  assertEquals(result.adventurer.arcanist?.order, "Alchemy");
  assertEquals(result.adventurer.arcanist?.rank, "Initiate");
});

Deno.test("ArcanistService.becomeArcanist - fails if path doesn't allow order", () => {
  const adv = makeAdventurer({ path: "Sorcerer" }); // Sorcerer cannot be Esoteric
  const { result } = svc.becomeArcanist(adv, { order: "Esoteric" });
  assertEquals(result.success, false);
  assertEquals(result.message.toLowerCase().includes("order"), true);
});

Deno.test("ArcanistService.becomeArcanist - fails if Int < 60", () => {
  const adv = makeAdventurer({ int: 55 });
  const { result } = svc.becomeArcanist(adv, { order: "Alchemy" });
  assertEquals(result.success, false);
});

Deno.test("ArcanistService.becomeArcanist - fails if magic skill < +10", () => {
  const adv = makeAdventurer({ skills: { Magic: 5 } });
  const { result } = svc.becomeArcanist(adv, { order: "Alchemy" });
  assertEquals(result.success, false);
});

Deno.test("ArcanistService.becomeArcanist - fails if fewer than 5 spells", () => {
  const adv = makeAdventurer({ spells: { "Fireball": 1, "Heal": 1, "Shield": 1 } });
  const { result } = svc.becomeArcanist(adv, { order: "Alchemy" });
  assertEquals(result.success, false);
});

Deno.test("ArcanistService.becomeArcanist - REP raised to 4 if below 4", () => {
  const adv = makeAdventurer({ reputation: 2 });
  const { result } = svc.becomeArcanist(adv, { order: "Alchemy" });
  assertEquals(result.success, true);
  assertEquals(result.adventurer.reputation, 4);
});

// ── Learning spells ───────────────────────────────────────────────────────────

Deno.test("ArcanistService.learnSpell - adds spell to arcanist spell book", () => {
  const adv = makeAdventurer({
    arcanist: {
      order: "Alchemy", rank: "Initiate", arcanistSpells: [],
      ingredientsBagActive: false, ingredients: {}, arcaneLawBroken: 0, stafeEnergy: 0,
    },
    gold: 5000,
  });
  const { result } = svc.learnSpell(adv, { spellTableRoll: 15, cost: 2000 }); // SA1 roll 11-20 = Poison Remedy
  assertEquals(result.success, true);
  assertEquals(result.adventurer.arcanist?.arcanistSpells.includes("Poison Remedy"), true);
  assertEquals(result.adventurer.gold, 3000);
});

Deno.test("ArcanistService.learnSpell - rank advances with order spells", () => {
  const adv = makeAdventurer({
    arcanist: {
      order: "Alchemy", rank: "Initiate",
      arcanistSpells: ["Poison Remedy"],
      ingredientsBagActive: false, ingredients: {}, arcaneLawBroken: 0, stafeEnergy: 0,
    },
    gold: 5000,
  });
  // Adding second order spell → rank becomes Neophyte
  const { result } = svc.learnSpell(adv, { spellTableRoll: 25, cost: 2000 });
  assertEquals(result.success, true);
  assertEquals(result.adventurer.arcanist?.rank, "Neophyte");
});

Deno.test("ArcanistService.learnSpell - duplicate spell is not added", () => {
  const adv = makeAdventurer({
    arcanist: {
      order: "Alchemy", rank: "Initiate",
      arcanistSpells: ["Poison Remedy"],
      ingredientsBagActive: false, ingredients: {}, arcaneLawBroken: 0, stafeEnergy: 0,
    },
    gold: 5000,
  });
  const { result } = svc.learnSpell(adv, { spellTableRoll: 15, cost: 2000 }); // Poison Remedy again
  assertEquals(result.success, false);
  assertEquals(result.message.toLowerCase().includes("already"), true);
});

// ── Arcane Law ────────────────────────────────────────────────────────────────

Deno.test("ArcanistService.checkArcaneLawConcealment - success resets broken count", () => {
  const adv = makeAdventurer({
    int: 70,
    arcanist: {
      order: "Alchemy", rank: "Initiate", arcanistSpells: [],
      ingredientsBagActive: false, ingredients: {}, arcaneLawBroken: 1, stafeEnergy: 0,
    },
  });
  // Roll + 5*brokenCount added; need result ≤ primary Int (70)
  // Roll of 30 + 5*1 = 35 ≤ 70 → success (concealed)
  const { result } = svc.checkArcaneLawConcealment(adv, { roll: 30 });
  assertEquals(result.concealed, true);
  assertEquals(result.adventurer.arcanist?.arcaneLawBroken, 0);
});

Deno.test("ArcanistService.checkArcaneLawConcealment - failure sends to arcane prism", () => {
  const adv = makeAdventurer({
    int: 50,
    arcanist: {
      order: "Alchemy", rank: "Initiate", arcanistSpells: [],
      ingredientsBagActive: false, ingredients: {}, arcaneLawBroken: 2, stafeEnergy: 0,
    },
  });
  // Roll 80 + 5*2 = 90 > 50 → caught
  const { result } = svc.checkArcaneLawConcealment(adv, { roll: 80 });
  assertEquals(result.concealed, false);
  assertEquals(result.sentToPrism, true);
});

// ── Arcane Prism survival ─────────────────────────────────────────────────────

Deno.test("ArcanistService.surviveArcanePrism - all 3 chars tested in order", () => {
  const adv = makeAdventurer({ str: 50, dex: 40, int: 60, gold: 5000 });
  // Each roll must be LESS THAN the primary value to survive
  // Roll < Str(50) → success: new Str = roll
  // Roll < new Dex(40) → success: new Dex = roll
  // Roll < new Int(60) → success: new Int = roll
  const { result } = svc.surviveArcanePrism(adv, { strRoll: 20, dexRoll: 15, intRoll: 30 });
  assertEquals(result.survived, true);
  assertEquals(result.adventurer.str, 20);
  assertEquals(result.adventurer.dex, 15);
  assertEquals(result.adventurer.int, 30);
  assertEquals(result.adventurer.gold, 0); // all assets seized
  assertEquals(result.adventurer.arcanist, null); // arcanist removed
});

Deno.test("ArcanistService.surviveArcanePrism - dies if any roll >= primary stat", () => {
  const adv = makeAdventurer({ str: 50, dex: 40, int: 60 });
  // strRoll 60 >= Str 50 → dies
  const { result } = svc.surviveArcanePrism(adv, { strRoll: 60, dexRoll: 15, intRoll: 30 });
  assertEquals(result.survived, false);
});

// ── Donation ──────────────────────────────────────────────────────────────────

Deno.test("ArcanistService.payDonation - deducts 150gp (non-Esoteric)", () => {
  const adv = makeAdventurer({
    gold: 500,
    arcanist: {
      order: "Alchemy", rank: "Initiate", arcanistSpells: [],
      ingredientsBagActive: false, ingredients: {}, arcaneLawBroken: 0, stafeEnergy: 0,
    },
  });
  const { result } = svc.payDonation(adv);
  assertEquals(result.success, true);
  assertEquals(result.adventurer.gold, 350);
});

Deno.test("ArcanistService.payDonation - deducts 300gp for Esoteric order", () => {
  const adv = makeAdventurer({
    gold: 500,
    path: "Arcane Wizard",
    arcanist: {
      order: "Esoteric", rank: "Initiate", arcanistSpells: [],
      ingredientsBagActive: false, ingredients: {}, arcaneLawBroken: 0, stafeEnergy: 0,
    },
  });
  const { result } = svc.payDonation(adv);
  assertEquals(result.success, true);
  assertEquals(result.adventurer.gold, 200);
});

Deno.test("ArcanistService.payDonation - not paying breaks arcane law", () => {
  const adv = makeAdventurer({
    gold: 50, // can't afford
    arcanist: {
      order: "Alchemy", rank: "Initiate", arcanistSpells: [],
      ingredientsBagActive: false, ingredients: {}, arcaneLawBroken: 0, stafeEnergy: 0,
    },
  });
  const { result } = svc.payDonation(adv);
  assertEquals(result.success, false);
  assertEquals(result.arcaneLawBroken, true);
  assertEquals(result.adventurer.arcanist?.arcaneLawBroken, 1);
});

// ── Rank lookup ───────────────────────────────────────────────────────────────

Deno.test("ArcanistService.getRankForSpellCount - correct ranks", () => {
  assertEquals(svc.getRankForSpellCount(1), "Initiate");
  assertEquals(svc.getRankForSpellCount(2), "Neophyte");
  assertEquals(svc.getRankForSpellCount(5), "Adept");
  assertEquals(svc.getRankForSpellCount(10), "Master Magus");
});
