import { assert, assertStringIncludes } from '@std/assert';
import { handleButton, handleModal } from '../../../../interactions/dungeon/camp/beast.ts';
import { _setKv, saveAccount } from '../../../../db/store.ts';
import { makeInteraction, makeAdventurer, captureFetch } from '../../../helpers/fixtures.ts';
import type { DungeonSession } from '../../../../index.ts';

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

const BEAST_DATA = {
  name: 'Wolf',
  level: 1,
  bonus: 2,
  gpValue: 30,
  abilities: [],
  hp: 10,
  currentHp: 10,
  trainingPips: 0,
  isCooperative: true,
  isDragonHatchling: false,
  dragonHearts: 0,
};

// ─── camp:beast sub-menu ──────────────────────────────────────────────────────

Deno.test('camp:beast handleButton — shows menu with editReply when no beast', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('beast-btn-1', BASE_SESSION);
  await saveAccount('beast-btn-1', 'd_beast1', 'tok-beast1');

  const adv = makeAdventurer({ beast: null });
  const { restore } = captureFetch(adv);

  const interaction = makeInteraction({ customId: 'camp:beast' });
  interaction.user = { id: 'beast-btn-1' };

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'No beast');
});

Deno.test('camp:beast handleButton — shows beast stats when beast exists', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('beast-btn-2', BASE_SESSION);
  await saveAccount('beast-btn-2', 'd_beast2', 'tok-beast2');

  const adv = makeAdventurer({ beast: BEAST_DATA });
  const { restore } = captureFetch(adv);

  const interaction = makeInteraction({ customId: 'camp:beast' });
  interaction.user = { id: 'beast-btn-2' };

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'Wolf');
});

Deno.test('camp:beast:buy handleButton — calls showModal', async () => {
  const sessions = new Map<string, DungeonSession>();
  const shownModals: unknown[] = [];
  const interaction = makeInteraction({
    customId: 'camp:beast:buy',
    showModal: async (m: unknown) => { shownModals.push(m); },
  });

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);

  assert(shownModals.length === 1);
});

Deno.test('camp:beast:tame handleButton — calls showModal', async () => {
  const sessions = new Map<string, DungeonSession>();
  const shownModals: unknown[] = [];
  const interaction = makeInteraction({
    customId: 'camp:beast:tame',
    showModal: async (m: unknown) => { shownModals.push(m); },
  });

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);

  assert(shownModals.length === 1);
});

// ─── camp:beast:sell (direct) ─────────────────────────────────────────────────

Deno.test('camp:beast:sell — editReply with result on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('beast-sell-1', BASE_SESSION);
  await saveAccount('beast-sell-1', 'd_bsell1', 'tok-bsell1');

  const apiResponse = { message: 'Beast sold.', goldGained: 30, gold: 80 };
  const { restore } = captureFetch(apiResponse);

  const interaction = makeInteraction({ customId: 'camp:beast:sell' });
  interaction.user = { id: 'beast-sell-1' };

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { title?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().title ?? '', 'Sold');
});

// ─── Modal: buy ───────────────────────────────────────────────────────────────

Deno.test('camp:beast:buy:submit — followUp error when no session', async () => {
  const sessions = new Map<string, DungeonSession>();
  const interaction = makeInteraction({
    customId: 'camp:beast:buy:submit',
    fields: { getTextInputValue: (_: string) => '42' },
  });
  interaction.user = { id: 'beast-modal-1' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'session');
});

Deno.test('camp:beast:buy:submit — editReply with result on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('beast-modal-2', BASE_SESSION);
  await saveAccount('beast-modal-2', 'd_bmod2', 'tok-bmod2');

  const apiResponse = { message: 'Bought Wolf.', beast: BEAST_DATA };
  const { restore } = captureFetch(apiResponse);

  const interaction = makeInteraction({
    customId: 'camp:beast:buy:submit',
    fields: { getTextInputValue: (_: string) => '42' },
  });
  interaction.user = { id: 'beast-modal-2' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { title?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().title ?? '', 'Acquired');
});

Deno.test('camp:beast:buy:submit — followUp error when roll is invalid', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('beast-modal-3', BASE_SESSION);
  await saveAccount('beast-modal-3', 'd_bmod3', 'tok-bmod3');

  const interaction = makeInteraction({
    customId: 'camp:beast:buy:submit',
    fields: { getTextInputValue: (_: string) => '200' },
  });
  interaction.user = { id: 'beast-modal-3' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'Roll must be');
});
