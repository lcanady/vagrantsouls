import { assert, assertStringIncludes } from '@std/assert';
import { handleButton, handleModal } from '../../../../interactions/dungeon/camp/artisan.ts';
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

const ARTISAN_DATA = {
  art: 2,
  salvageSkill: 3,
  craftingSkill: 4,
  materials: { Iron: 5, Wood: 2 },
  schematics: [{ name: 'Iron Shield' }],
  contacts: 1,
  guildStoragePaid: false,
};

// ─── Sub-menu ─────────────────────────────────────────────────────────────────

Deno.test('camp:artisan handleButton — shows menu when no artisan', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('art-btn-1', BASE_SESSION);
  await saveAccount('art-btn-1', 'd_art1', 'tok-art1');

  const adv = makeAdventurer({ artisan: null });
  const { restore } = captureFetch(adv);

  const interaction = makeInteraction({ customId: 'camp:artisan' });
  interaction.user = { id: 'art-btn-1' };

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'Not yet');
});

Deno.test('camp:artisan handleButton — shows artisan stats', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('art-btn-2', BASE_SESSION);
  await saveAccount('art-btn-2', 'd_art2', 'tok-art2');

  const adv = makeAdventurer({ artisan: ARTISAN_DATA });
  const { restore } = captureFetch(adv);

  const interaction = makeInteraction({ customId: 'camp:artisan' });
  interaction.user = { id: 'art-btn-2' };

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
});

Deno.test('camp:artisan:salvage handleButton — calls showModal', async () => {
  const sessions = new Map<string, DungeonSession>();
  const shownModals: unknown[] = [];
  const interaction = makeInteraction({
    customId: 'camp:artisan:salvage',
    showModal: async (m: unknown) => { shownModals.push(m); },
  });

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);

  assert(shownModals.length === 1);
});

Deno.test('camp:artisan:craft handleButton — calls showModal', async () => {
  const sessions = new Map<string, DungeonSession>();
  const shownModals: unknown[] = [];
  const interaction = makeInteraction({
    customId: 'camp:artisan:craft',
    showModal: async (m: unknown) => { shownModals.push(m); },
  });

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);

  assert(shownModals.length === 1);
});

// ─── Unlock (direct) ──────────────────────────────────────────────────────────

Deno.test('camp:artisan:unlock — editReply with result on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('art-unlock-1', BASE_SESSION);
  await saveAccount('art-unlock-1', 'd_artunlock1', 'tok-artunlock1');

  const apiResponse = { message: 'Artisan unlocked.', artisan: ARTISAN_DATA, gold: 40 };
  const { restore } = captureFetch(apiResponse);

  const interaction = makeInteraction({ customId: 'camp:artisan:unlock' });
  interaction.user = { id: 'art-unlock-1' };

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { title?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().title ?? '', 'Unlocked');
});

// ─── Modal: salvage ───────────────────────────────────────────────────────────

Deno.test('camp:artisan:salvage:submit — followUp error when no session', async () => {
  const sessions = new Map<string, DungeonSession>();
  const interaction = makeInteraction({
    customId: 'camp:artisan:salvage:submit',
    fields: {
      getTextInputValue: (name: string) => name === 'itemName' ? 'Iron Sword' : '55',
    },
  });
  interaction.user = { id: 'art-modal-1' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'session');
});

Deno.test('camp:artisan:salvage:submit — editReply on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('art-modal-2', BASE_SESSION);
  await saveAccount('art-modal-2', 'd_artmod2', 'tok-artmod2');

  const apiResponse = { success: true, message: 'Salvaged Iron Sword.', materials: { Iron: 3 } };
  const { restore } = captureFetch(apiResponse);

  const interaction = makeInteraction({
    customId: 'camp:artisan:salvage:submit',
    fields: {
      getTextInputValue: (name: string) => name === 'itemName' ? 'Iron Sword' : '55',
    },
  });
  interaction.user = { id: 'art-modal-2' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { title?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().title ?? '', 'Salvage');
});

// ─── Modal: artisan train ─────────────────────────────────────────────────────

Deno.test('camp:artisan:train:submit — followUp error on invalid type', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('art-train-1', BASE_SESSION);
  await saveAccount('art-train-1', 'd_arttrain1', 'tok-arttrain1');

  const interaction = makeInteraction({
    customId: 'camp:artisan:train:submit',
    fields: {
      getTextInputValue: (name: string) => name === 'type' ? 'InvalidType' : '1',
    },
  });
  interaction.user = { id: 'art-train-1' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'Salvage, Crafting');
});

Deno.test('camp:artisan:train:submit — editReply on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('art-train-2', BASE_SESSION);
  await saveAccount('art-train-2', 'd_arttrain2', 'tok-arttrain2');

  const apiResponse = { message: 'Trained Crafting.', artisan: ARTISAN_DATA, gold: 35 };
  const { restore } = captureFetch(apiResponse);

  const interaction = makeInteraction({
    customId: 'camp:artisan:train:submit',
    fields: {
      getTextInputValue: (name: string) => name === 'type' ? 'Crafting' : '1',
    },
  });
  interaction.user = { id: 'art-train-2' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { title?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().title ?? '', 'Trained');
});
