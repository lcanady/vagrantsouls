import { assertEquals, assert, assertStringIncludes } from '@std/assert';
import { buildStatusEmbed } from '../../embeds/status.ts';
import { COLORS, EMOJI } from '../../constants.ts';
import { makeAdventurer } from '../helpers/fixtures.ts';

Deno.test('buildStatusEmbed — sets DEFAULT color', () => {
  const data = buildStatusEmbed(makeAdventurer()).toJSON();
  assertEquals(data.color, COLORS.DEFAULT);
});

Deno.test('buildStatusEmbed — title is adventurer name', () => {
  const adv = makeAdventurer({ name: 'Shadowblade' });
  const data = buildStatusEmbed(adv).toJSON();
  assertStringIncludes(data.title ?? '', 'Shadowblade');
});

Deno.test('buildStatusEmbed — description shows race, path, and level', () => {
  const adv = makeAdventurer({ race: 'Elf', path: 'Sorcerer', level: 3 });
  const data = buildStatusEmbed(adv).toJSON();
  assertStringIncludes(data.description ?? '', 'Elf');
  assertStringIncludes(data.description ?? '', 'Sorcerer');
  assertStringIncludes(data.description ?? '', '3');
});

Deno.test('buildStatusEmbed — Vitals field shows hp, fate, life', () => {
  const adv = makeAdventurer({ hp: 12, maxHp: 20, fate: 2, life: 1 });
  const data = buildStatusEmbed(adv).toJSON();
  const vitalsField = data.fields?.find((f) => f.name.includes('Vitals'));
  assert(vitalsField, 'Should have Vitals field');
  assertStringIncludes(vitalsField.value, '12/20');
  assertStringIncludes(vitalsField.value, 'Fate');
  assertStringIncludes(vitalsField.value, 'Life');
});

Deno.test('buildStatusEmbed — Skills field absent when skills array is empty', () => {
  const data = buildStatusEmbed(makeAdventurer({ skills: [] })).toJSON();
  const skillsField = data.fields?.find((f) => f.name.includes('Skills'));
  assertEquals(skillsField, undefined);
});

Deno.test('buildStatusEmbed — Skills field present and lists skills', () => {
  const adv = makeAdventurer({ skills: ['Tough', 'Tracker'] });
  const data = buildStatusEmbed(adv).toJSON();
  const skillsField = data.fields?.find((f) => f.name.includes('Skills'));
  assert(skillsField, 'Should have Skills field');
  assertStringIncludes(skillsField.value, 'Tough');
  assertStringIncludes(skillsField.value, 'Tracker');
});

Deno.test('buildStatusEmbed — Beast Companion field present when beast is set', () => {
  const adv = makeAdventurer({
    beast: { name: 'Cave Wolf', level: 2, hp: 8, currentHp: 8 },
  });
  const data = buildStatusEmbed(adv).toJSON();
  const beastField = data.fields?.find((f) => f.name.includes('Beast'));
  assert(beastField, 'Should have Beast Companion field');
  assertStringIncludes(beastField.value, 'Cave Wolf');
});

Deno.test('buildStatusEmbed — Arcanist field present when arcanist is set', () => {
  const adv = makeAdventurer({
    arcanist: { order: 'fire', rank: 'Initiate', spells: [] },
  });
  const data = buildStatusEmbed(adv).toJSON();
  const arcField = data.fields?.find((f) => f.name.includes('Arcanist'));
  assert(arcField, 'Should have Arcanist field');
  assertStringIncludes(arcField.value, 'fire');
});
