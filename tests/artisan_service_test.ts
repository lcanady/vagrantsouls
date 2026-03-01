/**
 * ArtisanService tests
 * Artisan salvage/crafting system.  RED phase.
 */
import { assertEquals, assertExists } from "@std/assert";
import { ArtisanService } from "../server/services/ArtisanService.ts";
import { Adventurer, Artisan } from "../server/models/adventurer.ts";

function makeAdventurer(overrides: Partial<Adventurer> = {}): Adventurer {
  return {
    id: crypto.randomUUID(),
    name: "Brunel",
    hp: 30, maxHp: 30,
    fate: 3, life: 3,
    str: 50, dex: 40, int: 40,
    experiencePips: 0,
    head: null, torso: null, back: null,
    mainHand: null, offHand: null,
    belt1: null, belt2: null,
    backpack: [],
    reputation: 6, gold: 10000,
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

function makeArtisan(overrides: Partial<Artisan> = {}): Artisan {
  return {
    art: 40,
    salvageSkill: 0,
    craftingSkill: 0,
    artExperiencePips: 0,
    salvageExperiencePips: 0,
    craftingExperiencePips: 0,
    materials: {},
    schematics: [],
    scrapsPips: 0,
    guildStoragePaid: false,
    ...overrides,
  };
}

const svc = new ArtisanService();

// ── unlock ────────────────────────────────────────────────────────────────────

Deno.test("ArtisanService.unlock - costs 2000gp training + 200gp equipment", () => {
  const adv = makeAdventurer({ gold: 5000 });
  const { adventurer, result } = svc.unlock(adv);
  assertEquals(result.success, true);
  assertExists(adventurer.artisan);
  assertEquals(adventurer.artisan.art, 40);
  assertEquals(adventurer.artisan.salvageSkill, 0);
  assertEquals(adventurer.artisan.craftingSkill, 0);
  assertEquals(adventurer.gold, 5000 - 2200); // 2000 + 200
});

Deno.test("ArtisanService.unlock - fails if not enough gold", () => {
  const adv = makeAdventurer({ gold: 1000 });
  const { result } = svc.unlock(adv);
  assertEquals(result.success, false);
});

Deno.test("ArtisanService.unlock - no-ops if already an artisan", () => {
  const adv = makeAdventurer({ artisan: makeArtisan() });
  const { result } = svc.unlock(adv);
  assertEquals(result.success, false);
  assertEquals(result.message.toLowerCase().includes("already"), true);
});

// ── salvage ───────────────────────────────────────────────────────────────────

Deno.test("ArtisanService.salvage - success adds materials from salvage table", () => {
  const adv = makeAdventurer({
    artisan: makeArtisan({ art: 40, salvageSkill: 5 }),
  });
  // Roll 30 ≤ 40+5=45 → success; "Mighty Claymore" → X2 Weapons table
  const { adventurer, result } = svc.salvage(adv, {
    itemName: "Claymore",
    roll: 30,
  });
  assertEquals(result.success, true);
  // Check that some materials were added
  const matTotal = Object.values(adventurer.artisan?.materials ?? {}).reduce((a, b) => a + b, 0);
  assertEquals(matTotal > 0, true);
});

Deno.test("ArtisanService.salvage - failure destroys item with no material gained", () => {
  const adv = makeAdventurer({ artisan: makeArtisan({ art: 40 }) });
  const { adventurer, result } = svc.salvage(adv, { itemName: "Claymore", roll: 90 });
  assertEquals(result.success, false);
  const matTotal = Object.values(adventurer.artisan?.materials ?? {}).reduce((a, b) => a + b, 0);
  assertEquals(matTotal, 0);
});

Deno.test("ArtisanService.salvage - natural 05 or less doubles materials", () => {
  const adv = makeAdventurer({ artisan: makeArtisan({ art: 40 }) });
  const { result } = svc.salvage(adv, { itemName: "Claymore", roll: 5 });
  assertEquals(result.success, true);
  assertEquals(result.doubled, true);
});

Deno.test("ArtisanService.salvage - roll 10 or less grants experience", () => {
  const adv = makeAdventurer({ artisan: makeArtisan({ art: 40, artExperiencePips: 0 }) });
  const { adventurer, result } = svc.salvage(adv, { itemName: "Claymore", roll: 10 });
  assertEquals(result.success, true);
  assertEquals(result.experienceGained, true);
  // Either artExperiencePips or salvageExperiencePips should increase
  const gainedExp = (adventurer.artisan?.artExperiencePips ?? 0) + (adventurer.artisan?.salvageExperiencePips ?? 0);
  assertEquals(gainedExp >= 1, true);
});

Deno.test("ArtisanService.salvage - fails for item not on salvage tables", () => {
  const adv = makeAdventurer({ artisan: makeArtisan() });
  const { result } = svc.salvage(adv, { itemName: "Legendary Dragon Sword", roll: 5 });
  assertEquals(result.success, false);
  assertEquals(result.message.toLowerCase().includes("salvage"), true);
});

Deno.test("ArtisanService.salvage - requires artisan sheet unlocked", () => {
  const adv = makeAdventurer(); // no artisan
  const { result } = svc.salvage(adv, { itemName: "Claymore", roll: 10 });
  assertEquals(result.success, false);
});

// ── craft ─────────────────────────────────────────────────────────────────────

Deno.test("ArtisanService.craft - success creates standard item from materials", () => {
  // Claymore needs Wood/Bone: 4, Iron: 13
  const adv = makeAdventurer({
    artisan: makeArtisan({
      art: 60,
      materials: { "Iron": 15, "Leather/Hide": 5, "Wood/Bone": 5 },
    }),
  });
  // Standard item, no schematic needed
  const { adventurer, result } = svc.craft(adv, {
    itemName: "Claymore",
    roll: 30,
  });
  assertEquals(result.success, true);
  assertExists(result.craftedItem);
  // Materials should be consumed (started with 25, Claymore costs 17)
  const matTotal = Object.values(adventurer.artisan?.materials ?? {}).reduce((a, b) => a + b, 0);
  assertEquals(matTotal < 25, true);
});

Deno.test("ArtisanService.craft - failure consumes materials with no item created", () => {
  // Claymore needs Wood/Bone: 4, Iron: 13
  const adv = makeAdventurer({
    artisan: makeArtisan({
      art: 40,
      materials: { "Iron": 15, "Leather/Hide": 5, "Wood/Bone": 5 },
    }),
  });
  const { adventurer, result } = svc.craft(adv, { itemName: "Claymore", roll: 90 });
  assertEquals(result.success, false);
  assertEquals(result.craftedItem, undefined);
  // Materials still consumed on failure
  const matTotal = Object.values(adventurer.artisan?.materials ?? {}).reduce((a, b) => a + b, 0);
  assertEquals(matTotal < 25, true);
});

Deno.test("ArtisanService.craft - natural 05 or less grants schematic", () => {
  // Claymore needs Wood/Bone: 4, Iron: 13
  const adv = makeAdventurer({
    artisan: makeArtisan({
      art: 60,
      materials: { "Iron": 15, "Leather/Hide": 5, "Wood/Bone": 5 },
    }),
  });
  const { adventurer, result } = svc.craft(adv, { itemName: "Claymore", roll: 5 });
  assertEquals(result.success, true);
  assertEquals(result.schematicLearned, true);
  assertEquals((adventurer.artisan?.schematics.length ?? 0) >= 1, true);
});

Deno.test("ArtisanService.craft - requires artisan sheet", () => {
  const adv = makeAdventurer();
  const { result } = svc.craft(adv, { itemName: "Claymore", roll: 10 });
  assertEquals(result.success, false);
});

// ── convertMaterials ──────────────────────────────────────────────────────────

Deno.test("ArtisanService.convertMaterials - upgrades 10 lesser to 1 full", () => {
  const adv = makeAdventurer({
    artisan: makeArtisan({ materials: { "Iron Ingots": 10 } }),
  });
  const { adventurer, result } = svc.convertMaterials(adv, {
    from: "Iron Ingots", to: "Iron", quantity: 1,
  });
  assertEquals(result.success, true);
  assertEquals(adventurer.artisan?.materials["Iron Ingots"] ?? 0, 0);
  assertEquals(adventurer.artisan?.materials["Iron"] ?? 0, 1);
});

Deno.test("ArtisanService.convertMaterials - downgrades 1 full to 10 lesser", () => {
  const adv = makeAdventurer({
    artisan: makeArtisan({ materials: { "Iron": 1 } }),
  });
  const { adventurer, result } = svc.convertMaterials(adv, {
    from: "Iron", to: "Iron Ingots", quantity: 1,
  });
  assertEquals(result.success, true);
  assertEquals(adventurer.artisan?.materials["Iron"] ?? 0, 0);
  assertEquals(adventurer.artisan?.materials["Iron Ingots"] ?? 0, 10);
});

// ── payGuildStorage ───────────────────────────────────────────────────────────

Deno.test("ArtisanService.payGuildStorage - deducts 50gp", () => {
  const adv = makeAdventurer({
    gold: 200,
    artisan: makeArtisan(),
  });
  const { adventurer, result } = svc.payGuildStorage(adv);
  assertEquals(result.success, true);
  assertEquals(adventurer.gold, 150);
  assertEquals(adventurer.artisan?.guildStoragePaid, true);
});

Deno.test("ArtisanService.payGuildStorage - failure clears all materials and schematics", () => {
  const adv = makeAdventurer({
    gold: 30,
    artisan: makeArtisan({
      materials: { "Iron": 5 },
      schematics: [{ name: "Claymore", modifier: -10, standardMaterials: {}, upgradedMaterials: {}, gpValue: 500 }],
    }),
  });
  const { adventurer, result } = svc.payGuildStorage(adv);
  assertEquals(result.success, false);
  assertEquals(Object.keys(adventurer.artisan?.materials ?? {}).length, 0);
  assertEquals(adventurer.artisan?.schematics.length, 0);
});

// ── trainAtGuild ──────────────────────────────────────────────────────────────

Deno.test("ArtisanService.trainAtGuild - 200gp shades crafting/salvage pip", () => {
  const adv = makeAdventurer({
    gold: 500,
    reputation: 6,
    artisan: makeArtisan({ salvageExperiencePips: 0 }),
  });
  const { adventurer, result } = svc.trainAtGuild(adv, {
    type: "Salvage",
    contactsUsed: 0,
  });
  assertEquals(result.success, true);
  assertEquals(adventurer.gold, 300);
  assertEquals(adventurer.artisan?.salvageExperiencePips, 1);
});

Deno.test("ArtisanService.trainAtGuild - 2000gp shades Art characteristic pip", () => {
  const adv = makeAdventurer({
    gold: 5000,
    reputation: 6,
    artisan: makeArtisan({ artExperiencePips: 0 }),
  });
  const { adventurer, result } = svc.trainAtGuild(adv, {
    type: "Art",
    contactsUsed: 0,
  });
  assertEquals(result.success, true);
  assertEquals(adventurer.gold, 3000);
  assertEquals(adventurer.artisan?.artExperiencePips, 1);
});

Deno.test("ArtisanService.trainAtGuild - fails if contacts exhausted (used >= REP)", () => {
  const adv = makeAdventurer({
    gold: 5000,
    reputation: 3,
    artisan: makeArtisan(),
  });
  const { result } = svc.trainAtGuild(adv, { type: "Salvage", contactsUsed: 3 });
  assertEquals(result.success, false);
  assertEquals(result.message.toLowerCase().includes("contact"), true);
});
