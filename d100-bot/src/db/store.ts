export interface Account {
  discord_id: string;
  username: string;
  game_token: string;
  adventurer_id: string | null;
}

// ─── Testability hook ─────────────────────────────────────────────────────────

let _kv: Deno.Kv | null = null;

/** Override the KV instance. Call with an in-memory KV for unit tests. */
export function _setKv(kv: Deno.Kv): void {
  _kv = kv;
}

async function getKv(): Promise<Deno.Kv> {
  if (!_kv) {
    _kv = await Deno.openKv('./d100-bot.db');
  }
  return _kv;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAccount(discordId: string): Promise<Account | null> {
  const kv = await getKv();
  const entry = await kv.get<Account>(['accounts', discordId]);
  return entry.value;
}

export async function saveAccount(
  discordId: string,
  username: string,
  gameToken: string,
): Promise<void> {
  const kv = await getKv();
  const existing = await kv.get<Account>(['accounts', discordId]);
  await kv.set(['accounts', discordId], {
    discord_id: discordId,
    username,
    game_token: gameToken,
    adventurer_id: existing.value?.adventurer_id ?? null,
  });
}

export async function setAdventurerId(
  discordId: string,
  adventurerId: string,
): Promise<void> {
  const kv = await getKv();
  const existing = await kv.get<Account>(['accounts', discordId]);
  if (!existing.value) return;
  await kv.set(['accounts', discordId], {
    ...existing.value,
    adventurer_id: adventurerId,
  });
}
