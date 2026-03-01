/**
 * Tests for chargen step 1 modal handler.
 *
 * We test the validation logic by calling execute() with mock interactions
 * that have pre-configured field values, then checking what was sent as reply.
 */
import { assert, assertStringIncludes } from '@std/assert';
import { execute } from '../../../interactions/chargen/step1-modal.ts';
import { _setKv, saveAccount } from '../../../db/store.ts';
import { makeInteraction, captureFetch } from '../../helpers/fixtures.ts';
import type { ChargenSession } from '../../../index.ts';

// Shared in-memory KV
const kv = await Deno.openKv(':memory:');
_setKv(kv);

function makeModalInteraction(fields: Record<string, string>) {
  return makeInteraction({
    fields: {
      getTextInputValue: (key: string) => fields[key] ?? '',
    },
  });
}

Deno.test('step1-modal — rejects when str+dex+int does not equal 15', async () => {
  const chargenSessions = new Map<string, ChargenSession>();
  await saveAccount('user-modal-1', 'd_user1', 'tok-1');

  const interaction = makeModalInteraction({
    name: 'Thorn',
    str: '5',
    dex: '5',
    int: '5', // sum = 15 → valid, so test with wrong sum
  });
  // Override to sum = 14
  const badInteraction = makeModalInteraction({ name: 'Thorn', str: '4', dex: '5', int: '5' });
  badInteraction.user = { id: 'user-modal-1' };

  await execute(badInteraction as unknown as Parameters<typeof execute>[0], chargenSessions);

  const replies = badInteraction._calls.editReply;
  assert(replies.length > 0, 'editReply should have been called');
  const replyArg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  const desc = replyArg.embeds[0].toJSON().description ?? '';
  assertStringIncludes(desc, '14'); // mentions the wrong sum
});

Deno.test('step1-modal — rejects when attribute is below 1', async () => {
  const chargenSessions = new Map<string, ChargenSession>();
  await saveAccount('user-modal-2', 'd_user2', 'tok-2');

  const interaction = makeModalInteraction({ name: 'Thorn', str: '0', dex: '8', int: '7' });
  interaction.user = { id: 'user-modal-2' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], chargenSessions);

  const replies = interaction._calls.editReply;
  assert(replies.length > 0);
  const replyArg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(replyArg.embeds[0].toJSON().description ?? '', '1');
});

Deno.test('step1-modal — rejects when attribute is above 8', async () => {
  const chargenSessions = new Map<string, ChargenSession>();
  await saveAccount('user-modal-3', 'd_user3', 'tok-3');

  const interaction = makeModalInteraction({ name: 'Thorn', str: '9', dex: '4', int: '2' });
  interaction.user = { id: 'user-modal-3' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], chargenSessions);

  const replies = interaction._calls.editReply;
  assert(replies.length > 0);
  const replyArg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(replyArg.embeds[0].toJSON().description ?? '', '8');
});

Deno.test('step1-modal — rejects NaN attribute values', async () => {
  const chargenSessions = new Map<string, ChargenSession>();
  await saveAccount('user-modal-4', 'd_user4', 'tok-4');

  const interaction = makeModalInteraction({ name: 'Thorn', str: 'abc', dex: '5', int: '5' });
  interaction.user = { id: 'user-modal-4' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], chargenSessions);

  const replies = interaction._calls.editReply;
  assert(replies.length > 0, 'Should have replied with error');
});

Deno.test('step1-modal — calls chargenCreate API with correct values on valid input', async () => {
  const chargenSessions = new Map<string, ChargenSession>();
  await saveAccount('user-modal-5', 'd_user5', 'tok-5');

  const { calls, restore } = captureFetch({
    id: 'chargen-session-001',
    adventurer: {
      id: 'adv-001', name: 'Thorn', path: '', race: '', level: 1,
      hp: 20, maxHp: 20, str: 6, dex: 5, int: 4, fate: 3, life: 3,
      gold: 50, skills: [], inventory: [], rHand: null, lHand: null,
      beast: null, arcanist: null, artisan: null,
    },
  });

  const interaction = makeModalInteraction({ name: 'Thorn', str: '6', dex: '5', int: '4' });
  interaction.user = { id: 'user-modal-5' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], chargenSessions);
  restore();

  assert(calls.length > 0, 'Should have called the API');
  const body = JSON.parse(calls[0].init?.body as string);
  assert(body.name === 'Thorn', 'Name should be Thorn');
  assert(body.str === 6, 'STR should be 6');
  assert(body.dex === 5, 'DEX should be 5');
  assert(body.int === 4, 'INT should be 4');
});

Deno.test('step1-modal — creates chargen session entry with step=2 on success', async () => {
  const chargenSessions = new Map<string, ChargenSession>();
  await saveAccount('user-modal-6', 'd_user6', 'tok-6');

  const { restore } = captureFetch({
    id: 'chargen-session-002',
    adventurer: {
      id: 'adv-002', name: 'Grimm', path: '', race: '', level: 1,
      hp: 20, maxHp: 20, str: 5, dex: 6, int: 4, fate: 3, life: 3,
      gold: 50, skills: [], inventory: [], rHand: null, lHand: null,
      beast: null, arcanist: null, artisan: null,
    },
  });

  const interaction = makeModalInteraction({ name: 'Grimm', str: '5', dex: '6', int: '4' });
  interaction.user = { id: 'user-modal-6' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], chargenSessions);
  restore();

  const session = chargenSessions.get('user-modal-6');
  assert(session, 'Session should be stored');
  assert(session.step === 2, 'Step should be 2');
  assert(session.chargenId === 'chargen-session-002', 'chargenId should match API response');
});

Deno.test('step1-modal — replies with error embed when no account found', async () => {
  const chargenSessions = new Map<string, ChargenSession>();

  const interaction = makeModalInteraction({ name: 'Thorn', str: '5', dex: '5', int: '5' });
  interaction.user = { id: 'user-unregistered' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], chargenSessions);

  const replies = interaction._calls.editReply;
  assert(replies.length > 0, 'Should reply with error');
  const replyArg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(replyArg.embeds[0].toJSON().description ?? '', 'account');
});

Deno.test('step1-modal — replies with error when chargenCreate API throws', async () => {
  const chargenSessions = new Map<string, ChargenSession>();
  await saveAccount('user-modal-8', 'd_user8', 'tok-8');

  const restore = mockFetch500();

  const interaction = makeModalInteraction({ name: 'Thorn', str: '6', dex: '5', int: '4' });
  interaction.user = { id: 'user-modal-8' };

  await execute(interaction as unknown as Parameters<typeof execute>[0], chargenSessions);
  restore();

  const replies = interaction._calls.editReply;
  assert(replies.length > 0, 'Should reply with error');
  const replyArg = replies[0][0] as { embeds: { toJSON: () => { description?: string } }[] };
  assertStringIncludes(replyArg.embeds[0].toJSON().description ?? '', '500');
});

function mockFetch500(): () => void {
  const original = globalThis.fetch;
  // deno-lint-ignore no-explicit-any
  globalThis.fetch = async () => new Response('Server Error', { status: 500 }) as any;
  return () => { globalThis.fetch = original; };
}
