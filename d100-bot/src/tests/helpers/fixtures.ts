import type { AdventurerData } from '../../api/adventurer.ts';
import type { MonsterData } from '../../embeds/combat.ts';

/** Minimal adventurer for testing embed builders. */
export function makeAdventurer(overrides: Partial<AdventurerData> = {}): AdventurerData {
  return {
    id: 'adv-001',
    name: 'Thorn',
    path: 'Warrior',
    race: 'Human',
    level: 1,
    hp: 20,
    maxHp: 20,
    str: 6,
    dex: 5,
    int: 4,
    fate: 3,
    life: 3,
    gold: 50,
    skills: [],
    inventory: [],
    rHand: null,
    lHand: null,
    beast: null,
    arcanist: null,
    artisan: null,
    ...overrides,
  };
}

/** Minimal monster for testing embed builders. */
export function makeMonster(overrides: Partial<MonsterData> = {}): MonsterData {
  return {
    name: 'Goblin',
    av: 3,
    def: 2,
    hpValues: [5, 5],
    abilities: [],
    isUndead: false,
    isDaemonic: false,
    ...overrides,
  };
}

/** Mock Discord interaction with captured call history. */
export interface MockInteractionCalls {
  deferReply: unknown[][];
  deferUpdate: unknown[][];
  editReply: unknown[][];
  followUp: unknown[][];
  reply: unknown[][];
}

export function makeInteraction(overrides: Record<string, unknown> = {}): {
  user: { id: string };
  channelId: string;
  deferReply: (opts?: unknown) => Promise<void>;
  deferUpdate: (opts?: unknown) => Promise<void>;
  editReply: (opts?: unknown) => Promise<{ id: string }>;
  followUp: (opts?: unknown) => Promise<void>;
  reply: (opts?: unknown) => Promise<void>;
  replied: boolean;
  deferred: boolean;
  _calls: MockInteractionCalls;
} & Record<string, unknown> {
  const calls: MockInteractionCalls = {
    deferReply: [],
    deferUpdate: [],
    editReply: [],
    followUp: [],
    reply: [],
  };
  return {
    user: { id: 'test-discord-123' },
    channelId: 'test-channel-456',
    deferReply: async (opts?: unknown) => { calls.deferReply.push([opts]); },
    deferUpdate: async (opts?: unknown) => { calls.deferUpdate.push([opts]); },
    editReply: async (opts?: unknown) => { calls.editReply.push([opts]); return { id: 'msg-789' }; },
    followUp: async (opts?: unknown) => { calls.followUp.push([opts]); },
    reply: async (opts?: unknown) => { calls.reply.push([opts]); },
    replied: false,
    deferred: true,
    _calls: calls,
    ...overrides,
  };
}

/** Install a fetch mock; returns a restore function. */
export function mockFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
): () => void {
  const original = globalThis.fetch;
  // deno-lint-ignore no-explicit-any
  globalThis.fetch = handler as any;
  return () => {
    globalThis.fetch = original;
  };
}

/** Capture all fetch calls into an array; return captured calls + restore fn. */
export function captureFetch(response: unknown = {}): {
  calls: { url: string; init?: RequestInit }[];
  restore: () => void;
} {
  const calls: { url: string; init?: RequestInit }[] = [];
  const restore = mockFetch((url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  return { calls, restore };
}
