import { assert, assertStringIncludes } from '@std/assert';
import { execute } from '../../../interactions/dungeon/move.ts';
import { _setKv, saveAccount } from '../../../db/store.ts';
import { makeInteraction, captureFetch } from '../../helpers/fixtures.ts';
import type { DungeonSession } from '../../../index.ts';

const kv = await Deno.openKv(':memory:');
_setKv(kv);

const BASE_SESSION: DungeonSession = {
  adventurerId: 'adv-001',
  kvAdventurerId: 'adv-001',
  stateAdventurerId: 'state-001',
  partyId: 'party-001',
  messageId: 'msg-001',
  channelId: 'ch-001',
  roomSearched: false,
  inCombat: false,
  beastAbilityUses: 0,
};

Deno.test('dungeon:move — followUp error when no session exists', async () => {
  const sessions = new Map<string, DungeonSession>();
  const interaction = makeInteraction();
  interaction.user = { id: 'user-move-1' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0, 'Should followUp with error');
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', '/enter');
});

Deno.test('dungeon:move — followUp error when session.inCombat is true', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-move-2', { ...BASE_SESSION, inCombat: true });
  const interaction = makeInteraction();
  interaction.user = { id: 'user-move-2' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0, 'Should followUp with error');
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'combat');
});

Deno.test('dungeon:move — followUp error when no account found in KV', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-move-unregistered', BASE_SESSION);
  const interaction = makeInteraction();
  interaction.user = { id: 'user-move-unregistered' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0, 'Should followUp with error');
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'account');
});

Deno.test('dungeon:move — calls API and updates session.roomSearched on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-move-3', { ...BASE_SESSION, roomSearched: false });
  await saveAccount('user-move-3', 'd_move3', 'tok-move3');

  const { restore } = captureFetch({
    roll: 55,
    room: { roll: 55, color: 'Blue', exits: 2, searched: false },
    narrative: 'You step into a cool chamber.',
    timeTrack: { day: 1, phase: 'Morning' },
    upkeepReport: { messages: [] },
  });

  const interaction = makeInteraction();
  interaction.user = { id: 'user-move-3' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);
  restore();

  // editReply called with room embed
  assert(interaction._calls.editReply.length > 0, 'Should editReply with room embed');
  // session updated
  const session = sessions.get('user-move-3')!;
  assert(session.roomSearched === false, 'roomSearched should match room.searched');
});

Deno.test('dungeon:move — followUp error when dungeonMove API throws', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-move-4', BASE_SESSION);
  await saveAccount('user-move-4', 'd_move4', 'tok-move4');

  const original = globalThis.fetch;
  // deno-lint-ignore no-explicit-any
  globalThis.fetch = async () => new Response('Server Error', { status: 500 }) as any;

  const interaction = makeInteraction();
  interaction.user = { id: 'user-move-4' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  globalThis.fetch = original;

  const replies = interaction._calls.followUp;
  assert(replies.length > 0, 'Should followUp with error');
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'Move failed');
});
