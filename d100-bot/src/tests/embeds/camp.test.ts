import { assertEquals, assert, assertStringIncludes } from '@std/assert';
import { buildCampEmbed } from '../../embeds/camp.ts';
import { COLORS } from '../../constants.ts';
import { makeAdventurer } from '../helpers/fixtures.ts';

Deno.test('buildCampEmbed — sets DOWNTIME color', () => {
  const data = buildCampEmbed(makeAdventurer()).toJSON();
  assertEquals(data.color, COLORS.DOWNTIME);
});

Deno.test('buildCampEmbed — title is MAKE CAMP', () => {
  const data = buildCampEmbed(makeAdventurer()).toJSON();
  assertEquals(data.title, 'MAKE CAMP');
});

Deno.test('buildCampEmbed — HP field shows hp/maxHp', () => {
  const adv = makeAdventurer({ hp: 12, maxHp: 20 });
  const data = buildCampEmbed(adv).toJSON();
  const hpField = data.fields?.find((f) => f.name.includes('HP'));
  assert(hpField, 'Should have HP field');
  assertStringIncludes(hpField.value, '12');
  assertStringIncludes(hpField.value, '20');
});

Deno.test('buildCampEmbed — Gold field shows gold value', () => {
  const adv = makeAdventurer({ gold: 150 });
  const data = buildCampEmbed(adv).toJSON();
  const goldField = data.fields?.find((f) => f.name.includes('Gold'));
  assert(goldField, 'Should have Gold field');
  assertStringIncludes(goldField.value, '150');
});

Deno.test('buildCampEmbed — Time field shows day and phase when timeTrack provided', () => {
  const data = buildCampEmbed(
    makeAdventurer(),
    { day: 3, phase: 'Evening' },
  ).toJSON();
  const timeField = data.fields?.find((f) => f.name.includes('Time'));
  assert(timeField, 'Should have Time field');
  assertStringIncludes(timeField.value, '3');
  assertStringIncludes(timeField.value, 'Evening');
});

Deno.test('buildCampEmbed — Time field shows dash when timeTrack absent', () => {
  const data = buildCampEmbed(makeAdventurer()).toJSON();
  const timeField = data.fields?.find((f) => f.name.includes('Time'));
  assert(timeField, 'Should have Time field');
  assertEquals(timeField.value, '—');
});

Deno.test('buildCampEmbed — Oil field shows 0 when oil is undefined', () => {
  const data = buildCampEmbed(makeAdventurer()).toJSON();
  const oilField = data.fields?.find((f) => f.name.includes('Oil'));
  assert(oilField, 'Should have Oil field');
  assertStringIncludes(oilField.value, '0');
});

Deno.test('buildCampEmbed — Oil field shows actual value when set', () => {
  const adv = makeAdventurer({ oil: 4 });
  const data = buildCampEmbed(adv).toJSON();
  const oilField = data.fields?.find((f) => f.name.includes('Oil'));
  assert(oilField, 'Should have Oil field');
  assertStringIncludes(oilField.value, '4');
});

Deno.test('buildCampEmbed — Food field shows 0 when food is undefined', () => {
  const data = buildCampEmbed(makeAdventurer()).toJSON();
  const foodField = data.fields?.find((f) => f.name.includes('Food'));
  assert(foodField, 'Should have Food field');
  assertStringIncludes(foodField.value, '0');
});

Deno.test('buildCampEmbed — Items field shows inventory count', () => {
  const adv = makeAdventurer({
    inventory: [
      { id: 'i1', name: 'Sword', type: 'weapon', slot: 'rHand' },
      { id: 'i2', name: 'Shield', type: 'shield', slot: 'lHand' },
    ],
  });
  const data = buildCampEmbed(adv).toJSON();
  const itemsField = data.fields?.find((f) => f.name.includes('Items'));
  assert(itemsField, 'Should have Items field');
  assertStringIncludes(itemsField.value, '2');
});

Deno.test('buildCampEmbed — Items field shows 0 for empty inventory', () => {
  const data = buildCampEmbed(makeAdventurer({ inventory: [] })).toJSON();
  const itemsField = data.fields?.find((f) => f.name.includes('Items'));
  assert(itemsField, 'Should have Items field');
  assertStringIncludes(itemsField.value, '0');
});

Deno.test('buildCampEmbed — beast field absent when beast is null', () => {
  const data = buildCampEmbed(makeAdventurer({ beast: null })).toJSON();
  const beastField = data.fields?.find((f) => f.name.includes('Cave Wolf'));
  assertEquals(beastField, undefined);
});

Deno.test('buildCampEmbed — beast field present with name and HP when beast is set', () => {
  const adv = makeAdventurer({
    beast: {
      name: 'Cave Wolf',
      level: 2,
      hp: 10,
      currentHp: 7,
      bonus: 3,
      gpValue: 100,
      abilities: [],
      trainingPips: 0,
      isCooperative: true,
      isDragonHatchling: false,
      dragonHearts: 0,
    },
  });
  const data = buildCampEmbed(adv).toJSON();
  const beastField = data.fields?.find((f) => f.name.includes('Cave Wolf'));
  assert(beastField, 'Should have beast field with name');
  assertStringIncludes(beastField.value, '7');
  assertStringIncludes(beastField.value, '10');
  assertStringIncludes(beastField.value, '2');
});
