import { assert, assertStringIncludes } from '@std/assert';
import { handleButton, handleModal } from '../../../../interactions/dungeon/camp/train.ts';
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

Deno.test('camp:train handleButton — calls showModal', async () => {
  const sessions = new Map<string, DungeonSession>();
  const shownModals: unknown[] = [];
  const interaction = makeInteraction({
    customId: 'camp:train',
    showModal: async (modal: unknown) => { shownModals.push(modal); },
  });

  await handleButton(interaction as unknown as Parameters<typeof handleButton>[0], sessions);

  assert(shownModals.length === 1, 'Should call showModal once');
});

Deno.test('camp:train handleModal — followUp error when no session', async () => {
  const sessions = new Map<string, DungeonSession>();
  const interaction = makeInteraction({
    customId: 'camp:train:submit',
    fields: {
      getTextInputValue: (name: string) => name === 'target' ? 'STR' : '1',
    },
  });
  interaction.user = { id: 'train-modal-1' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'session');
});

Deno.test('camp:train handleModal — followUp error when pips is invalid', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('train-modal-2', BASE_SESSION);
  await saveAccount('train-modal-2', 'd_train2', 'tok-train2');

  const interaction = makeInteraction({
    customId: 'camp:train:submit',
    fields: {
      getTextInputValue: (name: string) => name === 'target' ? 'STR' : 'bad',
    },
  });
  interaction.user = { id: 'train-modal-2' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);

  const replies = interaction._calls.followUp;
  assert(replies.length > 0);
  const arg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().description ?? '', 'valid');
});

Deno.test('camp:train handleModal — editReply with result on success', async () => {
  const sessions = new Map<string, DungeonSession>();
  sessions.set('train-modal-3', BASE_SESSION);
  await saveAccount('train-modal-3', 'd_train3', 'tok-train3');

  const apiResponse = { message: 'Trained STR by 1 pip.', state: { hp: 20, maxHp: 20, gold: 40, food: 3, oil: 2 } };
  const { restore } = captureFetch(apiResponse);

  const interaction = makeInteraction({
    customId: 'camp:train:submit',
    fields: {
      getTextInputValue: (name: string) => name === 'target' ? 'STR' : '1',
    },
  });
  interaction.user = { id: 'train-modal-3' };

  await handleModal(interaction as unknown as Parameters<typeof handleModal>[0], sessions);
  restore();

  assert(interaction._calls.editReply.length > 0);
  const arg = interaction._calls.editReply[0][0] as { embeds: { toJSON: () => { title?: string } }[] };
  assertStringIncludes(arg.embeds[0].toJSON().title ?? '', 'Train');
});
