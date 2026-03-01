import { assert, assertStringIncludes } from '@std/assert';
import { handleButton, handleModal } from '../../../../interactions/dungeon/camp/arcanist.ts';
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

const ARCANIST_DATA = {
  order: 'SA1',
  rank: 'Initiate',
  arcanistSpells: ['Fireball'],
  arcaneLawBroken: 0,
  stafeEnergy: 5,
  donations: 2,
  ingredientsBagActive: false,
  ingredients: {},
};

// ─── Sub-menu ─────────────────────────────────────────────────────────────────

Deno.test('camp:arcanist handleButton — shows menu when no arcanist', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('arc-btn-1', BASE_SESSION);
  await saveAccount('arc-btn-1', 'd_arc1', 'tok-arc1');

  const adv = makeAdventurer({ arcanist: null });
  const { restore } = captureFetch(adv);

  const interaction = makeInteraction({ customId: 'camp:arcanist' });
  interaction.user = { id: 'arc-btn-1' };

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'Not yet');
});

Deno.test('camp:arcanist handleButton — shows arcanist stats', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('arc-btn-2', BASE_SESSION);
  await saveAccount('arc-btn-2', 'd_arc2', 'tok-arc2');

  const adv = makeAdventurer({ arcanist: ARCANIST_DATA });
  const { restore } = captureFetch(adv);

  const interaction = makeInteraction({ customId: 'camp:arcanist' });
  interaction.user = { id: 'arc-btn-2' };

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'SA1');
});

Deno.test('camp:arcanist:become handleButton — calls showModal', async () => {
  const sessions = new Map<string, DungeonSession>();
  const shownModals: unknown[] = [];
  const interaction = makeInteraction({
    customId: 'camp:arcanist:become',
    showModal: async (m: unknown) => { shownModals.push(m); },
  });

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);

  assert(shownModals.length === 1);
});

Deno.test('camp:arcanist:learn handleButton — calls showModal', async () => {
  const sessions = new Map<string, DungeonSession>();
  const shownModals: unknown[] = [];
  const interaction = makeInteraction({
    customId: 'camp:arcanist:learn',
    showModal: async (m: unknown) => { shownModals.push(m); },
  });

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);

  assert(shownModals.length === 1);
});

// ─── Donate (direct) ─────────────────────────────────────────────────────────

Deno.test('camp:arcanist:donate — editReply with result on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('arc-donate-1', BASE_SESSION);
  await saveAccount('arc-donate-1', 'd_arcdon1', 'tok-arcdon1');

  const apiResponse = { message: 'Donated 10 gold.', gold: 40 };
  const { restore } = captureFetch(apiResponse);

  const interaction = makeInteraction({ customId: 'camp:arcanist:donate' });
  interaction.user = { id: 'arc-donate-1' };

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { title?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().title ?? '', 'Donation');
});

// ─── Modal: become ────────────────────────────────────────────────────────────

Deno.test('camp:arcanist:become:submit — followUp error when no session', async () => {
  const sessions = new Map<string, DungeonSession>();
  const interaction = makeInteraction({
    customId: 'camp:arcanist:become:submit',
    fields: { getTextInputValue: (_: string) => 'SA1' },
  });
  interaction.user = { id: 'arc-modal-1' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'session');
});

Deno.test('camp:arcanist:become:submit — editReply on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('arc-modal-2', BASE_SESSION);
  await saveAccount('arc-modal-2', 'd_arcmod2', 'tok-arcmod2');

  const apiResponse = { message: 'Joined SA1.', arcanist: ARCANIST_DATA };
  const { restore } = captureFetch(apiResponse);

  const interaction = makeInteraction({
    customId: 'camp:arcanist:become:submit',
    fields: { getTextInputValue: (_: string) => 'SA1' },
  });
  interaction.user = { id: 'arc-modal-2' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { title?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().title ?? '', 'SA1');
});

// ─── Modal: prism ─────────────────────────────────────────────────────────────

Deno.test('camp:arcanist:prism:submit — followUp error when rolls are invalid', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('arc-prism-1', BASE_SESSION);
  await saveAccount('arc-prism-1', 'd_arcprism1', 'tok-arcprism1');

  const interaction = makeInteraction({
    customId: 'camp:arcanist:prism:submit',
    fields: { getTextInputValue: (_: string) => 'bad' },
  });
  interaction.user = { id: 'arc-prism-1' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'numbers');
});
