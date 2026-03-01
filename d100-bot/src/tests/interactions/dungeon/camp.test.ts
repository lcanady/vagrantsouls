import { assert, assertStringIncludes } from '@std/assert';
import { execute } from '../../../interactions/dungeon/camp.ts';
import { _setKv, saveAccount } from '../../../db/store.ts';
import { makeInteraction, makeAdventurer, captureFetch } from '../../helpers/fixtures.ts';
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

const LAST_ROOM = {
  roll: 42,
  color: 'Blue',
  exits: 2,
  searched: false,
  narrative: 'A cool chamber awaits.',
  timeTrack: { day: 1, phase: 'Morning' },
  upkeepMessages: [],
};

// ─── dungeon:camp handler ─────────────────────────────────────────────────────

Deno.test('dungeon:camp — followUp error when no session', async () => {
  const sessions = new Map<string, DungeonSession>();
  const interaction = makeInteraction({ customId: 'dungeon:camp' });
  interaction.user = { id: 'user-camp-1' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0, 'Should followUp with error');
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', '/enter');
});

Deno.test('dungeon:camp — followUp error when no account found', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-camp-2', BASE_SESSION);
  const interaction = makeInteraction({ customId: 'dungeon:camp' });
  interaction.user = { id: 'user-camp-2' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0, 'Should followUp with error');
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'account');
});

Deno.test('dungeon:camp — editReply with camp embed on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-camp-3', { ...BASE_SESSION, lastRoom: LAST_ROOM });
  await saveAccount('user-camp-3', 'd_camp3', 'tok-camp3');

  const adv = makeAdventurer({ hp: 15, maxHp: 20 });
  const { restore } = captureFetch(adv);

  const interaction = makeInteraction({ customId: 'dungeon:camp' });
  interaction.user = { id: 'user-camp-3' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0, 'Should editReply with camp embed');
});

Deno.test('dungeon:camp — followUp error when getAdventurer API throws', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-camp-4', BASE_SESSION);
  await saveAccount('user-camp-4', 'd_camp4', 'tok-camp4');

  const original = globalThis.fetch;
  // deno-lint-ignore no-explicit-any
  globalThis.fetch = async () => new Response('Internal Server Error', { status: 500 }) as any;

  const interaction = makeInteraction({ customId: 'dungeon:camp' });
  interaction.user = { id: 'user-camp-4' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);
  globalThis.fetch = original;

  const replies = interaction._calls.followUp;
  assert(replies.length > 0, 'Should followUp with error');
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'Camp failed');
});

Deno.test('dungeon:camp — witchery button present for Druid path', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-camp-5', BASE_SESSION);
  await saveAccount('user-camp-5', 'd_camp5', 'tok-camp5');

  const adv = makeAdventurer({ path: 'Druid' });
  const { restore } = captureFetch(adv);

  const interaction = makeInteraction({ customId: 'dungeon:camp' });
  interaction.user = { id: 'user-camp-5' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);
  restore();

  const editArgs = interaction._calls.editReply[0][0] as {
    components: { components: { data: { custom_id?: string } }[] }[];
  };
  const allIds = editArgs.components.flatMap((row) =>
    row.components.map((btn) => btn.data.custom_id ?? '')
  );
  assert(allIds.includes('camp:witchery'), 'Druid should see Witchery button');
});

Deno.test('dungeon:camp — witchery button absent for non-druid without formulas', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-camp-6', BASE_SESSION);
  await saveAccount('user-camp-6', 'd_camp6', 'tok-camp6');

  const adv = makeAdventurer({ path: 'Warrior' });
  const { restore } = captureFetch(adv);

  const interaction = makeInteraction({ customId: 'dungeon:camp' });
  interaction.user = { id: 'user-camp-6' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);
  restore();

  const editArgs = interaction._calls.editReply[0][0] as {
    components: { components: { data: { custom_id?: string } }[] }[];
  };
  const allIds = editArgs.components.flatMap((row) =>
    row.components.map((btn) => btn.data.custom_id ?? '')
  );
  assert(!allIds.includes('camp:witchery'), 'Warrior should NOT see Witchery button');
});

// ─── camp:back handler ────────────────────────────────────────────────────────

Deno.test('camp:back — editReply with error when no session', async () => {
  const sessions = new Map<string, DungeonSession>();
  const interaction = makeInteraction({ customId: 'camp:back' });
  interaction.user = { id: 'user-back-1' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  const replies = interaction._calls.editReply;
  assert(replies.length > 0, 'Should editReply with error');
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'unavailable');
});

Deno.test('camp:back — editReply with room embed when lastRoom is set', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-back-2', { ...BASE_SESSION, lastRoom: LAST_ROOM });
  const interaction = makeInteraction({ customId: 'camp:back' });
  interaction.user = { id: 'user-back-2' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  const replies = interaction._calls.editReply;
  assert(replies.length > 0, 'Should editReply with room card');
  const arg = replies[0][0] as {
    embeds: { toJSON: () => { description?: string } }[];
    components: unknown[];
  };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'A cool chamber awaits.');
  assert(arg.components.length > 0, 'Should restore room buttons');
});

Deno.test('camp:back — search button disabled when session.roomSearched is true', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('user-back-3', {
    ...BASE_SESSION,
    roomSearched: true,
    lastRoom: LAST_ROOM,
  });
  const interaction = makeInteraction({ customId: 'camp:back' });
  interaction.user = { id: 'user-back-3' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], sessions);

  const editArg = interaction._calls.editReply[0][0] as {
    components: { components: { data: { custom_id?: string; disabled?: boolean } }[] }[];
  };
  const searchBtn = editArg.components[0].components.find(
    (b) => b.data.custom_id === 'dungeon:search',
  );
  assert(searchBtn?.data.disabled === true, 'Search button should be disabled');
});
