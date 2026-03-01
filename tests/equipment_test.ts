import { assertEquals, assertThrows } from "@std/assert";
import { EquipmentManager } from "../server/logic/equipment.ts";
import { Adventurer } from "../server/models/adventurer.ts";
import { Item } from "../server/models/item.ts";

const mockAdventurer: Adventurer = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Test Hero",
  hp: 20,
  maxHp: 30,
  fate: 5,
  life: 3,
  str: 50,
  dex: 40,
  int: 30,
  experiencePips: 0,
  backpack: [],
  gold: 0,
  oil: 0,
  food: 0,
  picks: 0,
  skills: {},
  spells: {},
  investments: {},
  poison: 0,
  disease: 0,
  darkness: false,
  starvation: false,
  reputation: 0,
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
};

const potion: Item = {
  id: "potion-id",
  name: "Health Potion",
  usable: true,
  bonus: 0,
  twoHanded: false,
  effect: "HEAL:10",
  slot: "Belt",
  value: 12,
  fix: 2,
  damagePips: 0
};

const sword: Item = {
  id: "sword-id",
  name: "Cruel Sword",
  slot: "MainHand",
  usable: false,
  bonus: 0,
  twoHanded: false,
  modifiers: { str: 5 },
  damage: "1d8",
  value: 100,
  fix: 10,
  damagePips: 0
};

const shield: Item = {
    id: "shield-id",
    name: "Iron Shield",
    slot: "OffHand",
    usable: false,
    bonus: 0,
    twoHanded: false,
    modifiers: { dex: -2 },
  value: 80,
  fix: 8,
  damagePips: 0
};

const greatsword: Item = {
    id: "gs-id",
    name: "Greatsword",
    slot: "MainHand",
    usable: false,
    bonus: 0,
    twoHanded: true,
    damage: "2d6",
  value: 200,
  fix: 20,
  damagePips: 0
};

Deno.test("EquipmentManager: calculateStats should include modifiers", () => {
  const adv = { ...mockAdventurer, mainHand: sword };
  const stats = EquipmentManager.calculateStats(adv);
  assertEquals(stats.str, 55);
});

Deno.test("EquipmentManager: canEquip two-handed constraint", () => {
    const advWithShield = { ...mockAdventurer, offHand: shield };
    assertEquals(EquipmentManager.canEquip(advWithShield, greatsword, "MainHand"), false);
    
    const advWithGS = { ...mockAdventurer, mainHand: greatsword };
    assertEquals(EquipmentManager.canEquip(advWithGS, shield, "OffHand"), false);
});

Deno.test("EquipmentManager: auto-assign to belt slots", () => {
    let adv = { ...mockAdventurer };
    adv = EquipmentManager.equip(adv, potion, "Belt");
    assertEquals(adv.belt1?.id, potion.id);
    
    const potion2 = { ...potion, id: "potion-2" };
    adv = EquipmentManager.equip(adv, potion2, "Belt");
    assertEquals(adv.belt2?.id, potion2.id);
    
    const potion3 = { ...potion, id: "potion-3" };
    assertThrows(() => EquipmentManager.equip(adv, potion3, "Belt"));
});

Deno.test("EquipmentManager: unequip moves item to backpack", () => {
    const adv = { ...mockAdventurer, mainHand: sword };
    const updated = EquipmentManager.unequip(adv, "MainHand");
    assertEquals(updated.mainHand, null);
    assertEquals(updated.backpack.length, 1);
    assertEquals(updated.backpack[0].id, sword.id);
});

Deno.test("EquipmentManager: useItem should apply effects", () => {
    const { adventurer: updated, log } = EquipmentManager.useItem(mockAdventurer, potion);
    assertEquals(updated.hp, 30);
    assertEquals(log.includes("Restored 10 HP"), true);
});
