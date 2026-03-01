import { assert, assertStringIncludes } from '@std/assert';
import { handleButton, handleModal } from '../../../../interactions/dungeon/camp/trade.ts';
import { _setKv, saveAccount } from '../../../../db/store.ts';
import { makeInteraction, captureFetch } from '../../../helpers/fixtures.ts';
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

// ─── camp:trade sub-menu ──────────────────────────────────────────────────────

Deno.test('camp:trade handleButton — shows sub-menu with editReply', async () => {
  const sessions = new Map<string, DungeonSession>();
  const interaction = makeInteraction({ customId: 'camp:trade' });
  interaction.user = { id: 'trade-btn-1' };

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);

  assert(interaction._calls.editReply.length > 0, 'Should editReply with trade sub-menu');
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { title?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().title ?? '', 'Trade');
});

Deno.test('camp:trade:sell handleButton — calls showModal', async () => {
  const sessions = new Map<string, DungeonSession>();
  const shownModals: unknown[] = [];
  const interaction = makeInteraction({
    customId: 'camp:trade:sell',
    showModal: async (m: unknown) => { shownModals.push(m); },
  });

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);

  assert(shownModals.length === 1);
});

Deno.test('camp:trade:buy handleButton — calls showModal', async () => {
  const sessions = new Map<string, DungeonSession>();
  const shownModals: unknown[] = [];
  const interaction = makeInteraction({
    customId: 'camp:trade:buy',
    showModal: async (m: unknown) => { shownModals.push(m); },
  });

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);

  assert(shownModals.length === 1);
});

Deno.test('camp:trade:market handleButton — calls showModal', async () => {
  const sessions = new Map<string, DungeonSession>();
  const shownModals: unknown[] = [];
  const interaction = makeInteraction({
    customId: 'camp:trade:market',
    showModal: async (m: unknown) => { shownModals.push(m); },
  });

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);

  assert(shownModals.length === 1);
});

// ─── Modal: sell ──────────────────────────────────────────────────────────────

Deno.test('camp:trade:sell:submit — followUp error when no session', async () => {
  const sessions = new Map<string, DungeonSession>();
  const interaction = makeInteraction({
    customId: 'camp:trade:sell:submit',
    fields: { getTextInputValue: (_: string) => 'sword-01' },
  });
  interaction.user = { id: 'trade-modal-1' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'session');
});

Deno.test('camp:trade:sell:submit — editReply with result on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('trade-modal-2', BASE_SESSION);
  await saveAccount('trade-modal-2', 'd_trade2', 'tok-trade2');

  const apiResponse = { message: 'Sold sword.', state: { hp: 20, maxHp: 20, gold: 60, food: 3, oil: 2 } };
  const { restore } = captureFetch(apiResponse);

  const interaction = makeInteraction({
    customId: 'camp:trade:sell:submit',
    fields: { getTextInputValue: (_: string) => 'sword-01' },
  });
  interaction.user = { id: 'trade-modal-2' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { title?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().title ?? '', 'Sold');
});

// ─── Modal: market ────────────────────────────────────────────────────────────

Deno.test('camp:trade:market:submit — followUp error on invalid table', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('trade-modal-3', BASE_SESSION);
  await saveAccount('trade-modal-3', 'd_trade3', 'tok-trade3');

  const interaction = makeInteraction({
    customId: 'camp:trade:market:submit',
    fields: {
      getTextInputValue: (name: string) => name === 'table' ? 'X' : '50',
    },
  });
  interaction.user = { id: 'trade-modal-3' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'Table must be');
});

Deno.test('camp:trade:market:submit — editReply with result on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('trade-modal-4', BASE_SESSION);
  await saveAccount('trade-modal-4', 'd_trade4', 'tok-trade4');

  const apiResponse = { message: 'Found: Iron Shield', state: { hp: 20, maxHp: 20, gold: 50, food: 3, oil: 2 } };
  const { restore } = captureFetch(apiResponse);

  const interaction = makeInteraction({
    customId: 'camp:trade:market:submit',
    fields: {
      getTextInputValue: (name: string) => name === 'table' ? 'A' : '42',
    },
  });
  interaction.user = { id: 'trade-modal-4' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { title?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().title ?? '', 'Market');
});
