import { assertEquals, assert } from '@std/assert';
import { buildCombatButtons } from '../../../interactions/combat/attack.ts';

// buildCombatButtons is a pure function — no mocking required.

Deno.test('buildCombatButtons — returns array with exactly one row', () => {
  const rows = buildCombatButtons();
  assertEquals(rows.length, 1);
});

Deno.test('buildCombatButtons — row contains 4 buttons', () => {
  const rows = buildCombatButtons();
  const row = rows[0].toJSON();
  assertEquals(row.components.length, 4);
});

Deno.test('buildCombatButtons — first button customId is combat:attack:rHand', () => {
  const rows = buildCombatButtons();
  const components = rows[0].toJSON().components;
  // deno-lint-ignore no-explicit-any
  assertEquals((components[0] as any).custom_id, 'combat:attack:rHand');
});

Deno.test('buildCombatButtons — fourth button customId is combat:flee', () => {
  const rows = buildCombatButtons();
  const components = rows[0].toJSON().components;
  // deno-lint-ignore no-explicit-any
  assertEquals((components[3] as any).custom_id, 'combat:flee');
});
