import { assertEquals, assertNotEquals, assertExists } from '@std/assert';
import { _setKv, getAccount, saveAccount, setAdventurerId } from '../../db/store.ts';

// Use a fresh in-memory KV for every test to prevent bleed.
// Because store.ts is a module singleton, we inject via _setKv before each test.

async function withFreshKv<T>(fn: () => Promise<T>): Promise<T> {
  const kv = await Deno.openKv(':memory:');
  _setKv(kv);
  try {
    return await fn();
  } finally {
    kv.close();
  }
}

Deno.test('getAccount — returns null for unknown discord ID', async () => {
  await withFreshKv(async () => {
    const result = await getAccount('unknown-user-999');
    assertEquals(result, null);
  });
});

Deno.test('saveAccount — creates a new account with correct fields', async () => {
  await withFreshKv(async () => {
    await saveAccount('user-001', 'd_user001', 'token-abc');
    const account = await getAccount('user-001');
    assertExists(account);
    assertEquals(account.discord_id, 'user-001');
    assertEquals(account.username, 'd_user001');
    assertEquals(account.game_token, 'token-abc');
  });
});

Deno.test('saveAccount — sets adventurer_id to null on first save', async () => {
  await withFreshKv(async () => {
    await saveAccount('user-002', 'd_user002', 'token-xyz');
    const account = await getAccount('user-002');
    assertEquals(account?.adventurer_id, null);
  });
});

Deno.test('saveAccount — preserves existing adventurer_id on re-save', async () => {
  await withFreshKv(async () => {
    await saveAccount('user-003', 'd_user003', 'token-1');
    await setAdventurerId('user-003', 'adv-abc');
    // Re-save with new token — adventurer_id should be preserved
    await saveAccount('user-003', 'd_user003', 'token-2');
    const account = await getAccount('user-003');
    assertEquals(account?.adventurer_id, 'adv-abc');
    assertEquals(account?.game_token, 'token-2');
  });
});

Deno.test('getAccount — retrieves all saved fields correctly', async () => {
  await withFreshKv(async () => {
    await saveAccount('user-004', 'd_user004', 'tok-zyx');
    const account = await getAccount('user-004');
    assertEquals(account?.username, 'd_user004');
    assertEquals(account?.game_token, 'tok-zyx');
    assertEquals(account?.adventurer_id, null);
  });
});

Deno.test('setAdventurerId — updates adventurer_id on existing account', async () => {
  await withFreshKv(async () => {
    await saveAccount('user-005', 'd_user005', 'tok-q');
    await setAdventurerId('user-005', 'adv-12345');
    const account = await getAccount('user-005');
    assertEquals(account?.adventurer_id, 'adv-12345');
  });
});

Deno.test('setAdventurerId — is a no-op when account does not exist', async () => {
  await withFreshKv(async () => {
    // Should not throw
    await setAdventurerId('nonexistent-user', 'adv-xyz');
    const account = await getAccount('nonexistent-user');
    assertEquals(account, null);
  });
});

Deno.test('store — multiple accounts stored under different IDs are independent', async () => {
  await withFreshKv(async () => {
    await saveAccount('alpha', 'd_alpha', 'tok-alpha');
    await saveAccount('beta', 'd_beta', 'tok-beta');
    await setAdventurerId('alpha', 'adv-alpha');

    const alpha = await getAccount('alpha');
    const beta = await getAccount('beta');

    assertEquals(alpha?.adventurer_id, 'adv-alpha');
    assertEquals(beta?.adventurer_id, null);
    assertNotEquals(alpha?.game_token, beta?.game_token);
  });
});
