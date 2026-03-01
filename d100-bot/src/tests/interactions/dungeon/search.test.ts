import { assert, assertStringIncludes } from '@std/assert';
import { execute } from '../../../interactions/dungeon/search.ts';
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

Deno.test('dungeon:search — followUp error when no session', async () => {
  const sessions = new Map<string, DungeonSession>();
  const interaction = makeInteraction();
  interaction.user = { id: 'user-search-1' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0, 'Should followUp with error');
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', '/enter');
});

Deno.test('dungeon:search — followUp error when in combat', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-search-2', { ...BASE_SESSION, inCombat: true });
  const interaction = makeInteraction();
  interaction.user = { id: 'user-search-2' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'combat');
});

Deno.test('dungeon:search — followUp error when room already searched', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-search-3', { ...BASE_SESSION, roomSearched: true });
  const interaction = makeInteraction();
  interaction.user = { id: 'user-search-3' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'searched');
});

Deno.test('dungeon:search — sets session.roomSearched = true on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-search-4', { ...BASE_SESSION, roomSearched: false });
  await saveAccount('user-search-4', 'd_search4', 'tok-search4');

  const { restore } = captureFetch({
    roll: 33,
    find: { name: 'Old Sword', value: undefined },
    narrative: 'You find a rusty old sword.',
    upkeepReport: { messages: [] },
  });

  const interaction = makeInteraction();
  interaction.user = { id: 'user-search-4' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);
  restore();

  const session = sessions.get('user-search-4')!;
  assert(session.roomSearched === true, 'roomSearched should be true after search');
  assert(interaction._calls.editReply.length > 0, 'Should editReply');
});

Deno.test('dungeon:search — followUp error when API throws', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-search-5', BASE_SESSION);
  await saveAccount('user-search-5', 'd_search5', 'tok-search5');

  const original = globalThis.fetch;
  // deno-lint-ignore no-explicit-any
  globalThis.fetch = async () => new Response('Internal Server Error', { status: 500 }) as any;

  const interaction = makeInteraction();
  interaction.user = { id: 'user-search-5' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  globalThis.fetch = original;

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'Search failed');
});
