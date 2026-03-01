import { assert, assertStringIncludes } from '@std/assert';
import { handleButton, handleModal } from '../../../../interactions/dungeon/camp/heal.ts';
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

// ─── handleButton ─────────────────────────────────────────────────────────────

Deno.test('camp:heal handleButton — calls showModal', async () => {
  const sessions = new Map<string, DungeonSession>();
  const shownModals: unknown[] = [];
  const interaction = makeInteraction({
    customId: 'camp:heal',
    showModal: async (modal: unknown) => { shownModals.push(modal); },
  });

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);

  assert(shownModals.length === 1, 'Should call showModal once');
});

// ─── handleModal ──────────────────────────────────────────────────────────────

Deno.test('camp:heal handleModal — followUp error when no session', async () => {
  const sessions = new Map<string, DungeonSession>();
  const interaction = makeInteraction({
    customId: 'camp:heal:submit',
    fields: { getTextInputValue: (name: string) => name === 'amount' ? '5' : '' },
  });
  interaction.user = { id: 'heal-modal-1' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0, 'Should followUp with error');
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'session');
});

Deno.test('camp:heal handleModal — followUp error when no account', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('heal-modal-2', BASE_SESSION);
  const interaction = makeInteraction({
    customId: 'camp:heal:submit',
    fields: { getTextInputValue: (name: string) => name === 'amount' ? '5' : '' },
  });
  interaction.user = { id: 'heal-modal-2' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'account');
});

Deno.test('camp:heal handleModal — followUp error when amount is invalid', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('heal-modal-3', BASE_SESSION);
  await saveAccount('heal-modal-3', 'd_heal3', 'tok-heal3');

  const interaction = makeInteraction({
    customId: 'camp:heal:submit',
    fields: { getTextInputValue: (_name: string) => 'abc' },
  });
  interaction.user = { id: 'heal-modal-3' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'valid');
});

Deno.test('camp:heal handleModal — editReply with result on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('heal-modal-4', BASE_SESSION);
  await saveAccount('heal-modal-4', 'd_heal4', 'tok-heal4');

  const apiResponse = { message: 'Healed 5 HP.', state: { hp: 15, maxHp: 20, gold: 50, food: 3, oil: 2 } };
  const { restore } = captureFetch(apiResponse);

  const interaction = makeInteraction({
    customId: 'camp:heal:submit',
    fields: { getTextInputValue: (name: string) => name === 'amount' ? '5' : '' },
  });
  interaction.user = { id: 'heal-modal-4' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0, 'Should editReply with result');
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { title?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().title ?? '', 'Heal');
});

Deno.test('camp:heal handleModal — followUp error when API throws', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('heal-modal-5', BASE_SESSION);
  await saveAccount('heal-modal-5', 'd_heal5', 'tok-heal5');

  const original = globalThis.fetch;
  // deno-lint-ignore no-explicit-any
  globalThis.fetch = async () => new Response('error', { status: 400 }) as any;

  const interaction = makeInteraction({
    customId: 'camp:heal:submit',
    fields: { getTextInputValue: (name: string) => name === 'amount' ? '5' : '' },
  });
  interaction.user = { id: 'heal-modal-5' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);
  globalThis.fetch = original;

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'Heal failed');
});
