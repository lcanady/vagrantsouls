import { assertEquals, assert, assertStringIncludes } from '@std/assert';
import {
  buildCombatEmbed,
  buildCombatResultEmbed,
  buildHpBar,
} from '../../embeds/combat.ts';
import { COLORS, EMOJI } from '../../constants.ts';
import { makeAdventurer, makeMonster } from '../helpers/fixtures.ts';

const adv = makeAdventurer({ name: 'Thorn', hp: 10, maxHp: 20, str: 6, dex: 5, int: 4 });
const monster = makeMonster({ name: 'Goblin', av: 3, def: 2, hpValues: [8] });

// ── buildHpBar ────────────────────────────────────────────────────────────────

Deno.test('buildHpBar — full HP shows all filled blocks', () => {
  const bar = buildHpBar(10, 10);
  assertEquals(bar, '█'.repeat(10));
});

Deno.test('buildHpBar — zero HP shows all empty blocks', () => {
  const bar = buildHpBar(0, 10);
  assertEquals(bar, '░'.repeat(10));
});

Deno.test('buildHpBar — half HP shows 5 filled + 5 empty', () => {
  const bar = buildHpBar(5, 10);
  assertEquals(bar, '█'.repeat(5) + '░'.repeat(5));
});

Deno.test('buildHpBar — max=0 guard prevents division by zero', () => {
  // Should not throw, returns all filled (treats max as 1)
  const bar = buildHpBar(0, 0);
  assertEquals(bar.length, 10);
});

// ── buildCombatEmbed ──────────────────────────────────────────────────────────

Deno.test('buildCombatEmbed — sets COMBAT color', () => {
  const data = buildCombatEmbed(adv, monster).toJSON();
  assertEquals(data.color, COLORS.COMBAT);
});

Deno.test('buildCombatEmbed — title is "Combat" when no round given', () => {
  const data = buildCombatEmbed(adv, monster).toJSON();
  assertStringIncludes(data.title ?? '', 'Combat');
  assert(!data.title?.includes('Round'), 'Should not include Round when no round given');
});

Deno.test('buildCombatEmbed — title shows round number when provided', () => {
  const data = buildCombatEmbed(adv, monster, 3).toJSON();
  assertStringIncludes(data.title ?? '', 'Round 3');
});

Deno.test('buildCombatEmbed — first field contains adventurer name', () => {
  const data = buildCombatEmbed(adv, monster).toJSON();
  const advField = data.fields?.[0];
  assert(advField, 'Should have first field');
  assertStringIncludes(advField.name, adv.name);
});

Deno.test('buildCombatEmbed — second field contains monster name', () => {
  const data = buildCombatEmbed(adv, monster).toJSON();
  const monField = data.fields?.[1];
  assert(monField, 'Should have second field');
  assertStringIncludes(monField.name, monster.name);
});

Deno.test('buildCombatEmbed — monster tags include Undead marker', () => {
  const undeadMonster = makeMonster({ isUndead: true });
  const data = buildCombatEmbed(adv, undeadMonster).toJSON();
  const monField = data.fields?.[1];
  assertStringIncludes(monField?.value ?? '', 'Undead');
});

Deno.test('buildCombatEmbed — monster tags include Daemonic marker', () => {
  const daemonicMonster = makeMonster({ isDaemonic: true });
  const data = buildCombatEmbed(adv, daemonicMonster).toJSON();
  const monField = data.fields?.[1];
  assertStringIncludes(monField?.value ?? '', 'Daemonic');
});

// ── buildCombatResultEmbed ────────────────────────────────────────────────────

Deno.test('buildCombatResultEmbed — Victory title when party wins', () => {
  const data = buildCombatResultEmbed([], 'Goblin', 0, true, 'party').toJSON();
  assertStringIncludes(data.title ?? '', 'Victory');
  assertEquals(data.color, COLORS.ROOM_GREEN);
});

Deno.test('buildCombatResultEmbed — Defeat title when monster wins', () => {
  const data = buildCombatResultEmbed([], 'Goblin', 0, true, 'monster').toJSON();
  assertStringIncludes(data.title ?? '', 'Defeat');
  assertEquals(data.color, COLORS.DEATH);
});

Deno.test('buildCombatResultEmbed — Round Resolved title when combat ongoing', () => {
  const data = buildCombatResultEmbed(['Goblin attacks!'], 'Goblin', 5, false).toJSON();
  assertStringIncludes(data.title ?? '', 'Round Resolved');
  assertEquals(data.color, COLORS.COMBAT);
});

Deno.test('buildCombatResultEmbed — logs appear in description', () => {
  const logs = ['You strike for 4 damage!', 'Goblin retaliates.'];
  const data = buildCombatResultEmbed(logs, 'Goblin', 3, false).toJSON();
  assertStringIncludes(data.description ?? '', logs[0]);
  assertStringIncludes(data.description ?? '', logs[1]);
});
