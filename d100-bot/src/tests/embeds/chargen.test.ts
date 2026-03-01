import { assertEquals, assert, assertStringIncludes } from '@std/assert';
import {
  buildChargenStep1Embed,
  buildChargenStep2Embed,
  buildChargenStep3Embed,
  buildChargenStep4Embed,
  buildChargenStep5Embed,
} from '../../embeds/chargen.ts';
import { COLORS, PATH_EMOJI, RACE_EMOJI } from '../../constants.ts';
import { makeAdventurer } from '../helpers/fixtures.ts';

const adv = makeAdventurer({
  name: 'Thorn',
  path: 'Warrior',
  race: 'Dwarf',
  str: 6,
  dex: 5,
  int: 4,
  hp: 20,
  maxHp: 20,
  fate: 3,
  life: 3,
  skills: ['Tough', 'Berserk'],
});

// ── Step 1 ────────────────────────────────────────────────────────────────────

Deno.test('chargen step 1 — sets DEFAULT color', () => {
  const data = buildChargenStep1Embed().toJSON();
  assertEquals(data.color, COLORS.DEFAULT);
});

Deno.test('chargen step 1 — title contains "Step 1"', () => {
  const data = buildChargenStep1Embed().toJSON();
  assertStringIncludes(data.title ?? '', 'Step 1');
});

Deno.test('chargen step 1 — description mentions 15 points', () => {
  const data = buildChargenStep1Embed().toJSON();
  assertStringIncludes(data.description ?? '', '15');
});

// ── Step 2 ────────────────────────────────────────────────────────────────────

Deno.test('chargen step 2 — contains adventurer name in description', () => {
  const data = buildChargenStep2Embed(adv).toJSON();
  assertStringIncludes(data.description ?? '', adv.name);
});

Deno.test('chargen step 2 — shows STR/DEX/INT values', () => {
  const data = buildChargenStep2Embed(adv).toJSON();
  assertStringIncludes(data.description ?? '', String(adv.str));
  assertStringIncludes(data.description ?? '', String(adv.dex));
  assertStringIncludes(data.description ?? '', String(adv.int));
});

// ── Step 3 ────────────────────────────────────────────────────────────────────

Deno.test('chargen step 3 — title contains "Step 3"', () => {
  const data = buildChargenStep3Embed(adv).toJSON();
  assertStringIncludes(data.title ?? '', 'Step 3');
});

Deno.test('chargen step 3 — shows path icon from PATH_EMOJI', () => {
  const data = buildChargenStep3Embed(adv).toJSON();
  const icon = PATH_EMOJI[adv.path];
  assert(icon, 'PATH_EMOJI entry for Warrior should exist');
  assertStringIncludes(data.description ?? '', adv.path);
});

// ── Step 4 ────────────────────────────────────────────────────────────────────

Deno.test('chargen step 4 — title contains "Step 4"', () => {
  const data = buildChargenStep4Embed(adv).toJSON();
  assertStringIncludes(data.title ?? '', 'Step 4');
});

Deno.test('chargen step 4 — shows race icon from RACE_EMOJI', () => {
  const data = buildChargenStep4Embed(adv).toJSON();
  const icon = RACE_EMOJI[adv.race];
  assert(icon, 'RACE_EMOJI entry for Dwarf should exist');
  assertStringIncludes(data.description ?? '', adv.race);
});

// ── Step 5 ────────────────────────────────────────────────────────────────────

Deno.test('chargen step 5 — has field for adventurer name', () => {
  const data = buildChargenStep5Embed(adv).toJSON();
  const nameField = data.fields?.find((f) => f.name === 'Name');
  assert(nameField, 'Should have a Name field');
  assertEquals(nameField.value, adv.name);
});

Deno.test('chargen step 5 — skills field shows skill names', () => {
  const data = buildChargenStep5Embed(adv).toJSON();
  const skillsField = data.fields?.find((f) => f.name?.includes('Skills'));
  assert(skillsField, 'Should have a Skills field');
  assertStringIncludes(skillsField.value, 'Tough');
  assertStringIncludes(skillsField.value, 'Berserk');
});

Deno.test('chargen step 5 — skills field shows None when empty', () => {
  const advNoSkills = makeAdventurer({ skills: [] });
  const data = buildChargenStep5Embed(advNoSkills).toJSON();
  const skillsField = data.fields?.find((f) => f.name?.includes('Skills'));
  assert(skillsField, 'Should have a Skills field');
  assertStringIncludes(skillsField.value, 'None');
});

Deno.test('chargen step 5 — has a footer', () => {
  const data = buildChargenStep5Embed(adv).toJSON();
  assert(data.footer?.text, 'Should have footer text');
});
