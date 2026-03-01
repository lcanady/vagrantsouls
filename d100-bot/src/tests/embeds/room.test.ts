import { assertEquals, assert, assertStringIncludes } from '@std/assert';
import { buildRoomEmbed, buildSearchEmbed } from '../../embeds/room.ts';
import { COLORS, ROOM_COLOR_MAP } from '../../constants.ts';
import type { RoomData, TimeTrack } from '../../api/dungeon.ts';

function makeRoom(overrides: Partial<RoomData> = {}): RoomData {
  return {
    roll: 42,
    color: 'Green',
    exits: 2,
    searched: false,
    ...overrides,
  };
}

// ── buildRoomEmbed ────────────────────────────────────────────────────────────

Deno.test('buildRoomEmbed — uses ROOM_COLOR_MAP for Green room', () => {
  const data = buildRoomEmbed(makeRoom({ color: 'Green' }), 'A mossy corridor.').toJSON();
  assertEquals(data.color, ROOM_COLOR_MAP['Green']);
});

Deno.test('buildRoomEmbed — uses ROOM_COLOR_MAP for Red room', () => {
  const data = buildRoomEmbed(makeRoom({ color: 'Red' }), 'Bloodstained walls.').toJSON();
  assertEquals(data.color, ROOM_COLOR_MAP['Red']);
});

Deno.test('buildRoomEmbed — falls back to DEFAULT for unknown color', () => {
  const data = buildRoomEmbed(makeRoom({ color: 'Purple' }), 'Strange room.').toJSON();
  assertEquals(data.color, COLORS.DEFAULT);
});

Deno.test('buildRoomEmbed — title contains the roll number', () => {
  const data = buildRoomEmbed(makeRoom({ roll: 77 }), 'Narrative.').toJSON();
  assertStringIncludes(data.title ?? '', '77');
});

Deno.test('buildRoomEmbed — description is the narrative string', () => {
  const narrative = 'You enter a damp cavern filled with glowing fungi.';
  const data = buildRoomEmbed(makeRoom(), narrative).toJSON();
  assertEquals(data.description, narrative);
});

Deno.test('buildRoomEmbed — adds Time field when timeTrack provided', () => {
  const timeTrack: TimeTrack = { day: 2, phase: 'Afternoon' };
  const data = buildRoomEmbed(makeRoom(), 'Narrative.', timeTrack).toJSON();
  const timeField = data.fields?.find((f) => f.value.includes('Day'));
  assert(timeField, 'Should have a time field');
  assertStringIncludes(timeField.value, '2');
  assertStringIncludes(timeField.value, 'Afternoon');
});

Deno.test('buildRoomEmbed — does NOT add Time field when timeTrack is absent', () => {
  const data = buildRoomEmbed(makeRoom(), 'Narrative.').toJSON();
  const timeField = data.fields?.find((f) => f.value.includes('Day **'));
  assertEquals(timeField, undefined);
});

Deno.test('buildRoomEmbed — adds Upkeep field when upkeepMessages provided', () => {
  const data = buildRoomEmbed(makeRoom(), 'Narrative.', undefined, [
    'You ate 1 food.',
    'Torch burned down.',
  ]).toJSON();
  const upkeepField = data.fields?.find((f) => f.name?.includes('Upkeep'));
  assert(upkeepField, 'Should have an Upkeep field');
  assertStringIncludes(upkeepField.value, 'food');
});

// ── buildSearchEmbed ──────────────────────────────────────────────────────────

Deno.test('buildSearchEmbed — RARE_LOOT color when item found', () => {
  const data = buildSearchEmbed('Gold Coin', 5, 'You found treasure!').toJSON();
  assertEquals(data.color, COLORS.RARE_LOOT);
});

Deno.test('buildSearchEmbed — DEATH color when nothing found', () => {
  const data = buildSearchEmbed('Nothing', undefined, 'The room is bare.').toJSON();
  assertEquals(data.color, COLORS.DEATH);
});
