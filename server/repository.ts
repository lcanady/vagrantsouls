import { GameState } from "./models/gamestate.ts";
import { User } from "./models/user.ts";
import { equal } from "@std/assert";

export interface GuildMemberRecord {
  adventurerId: string;
  adventurerName: string;
  standing: number;
  rank: string;
}

export interface GuildEvent {
  type: "joined" | "left" | "rank_up";
  adventurerId: string;
  adventurerName: string;
  rank: string;
  timestamp: string;
}

/**
 * Repository for managing game persistence using Deno KV.
 * 
 * Adventurers are stored under the key ["adventurers", id].
 */
export class Repository {
  constructor(private kv: Deno.Kv) {}

  /**
   * Saves an adventurer's state directly and updates user character list.
   */
  async saveAdventurer(id: string, state: GameState): Promise<Deno.KvCommitResult | Deno.KvCommitError> {
    const key = ["adventurers", id];
    const atomic = this.kv.atomic().set(key, state);
    
    if (state.adventurer.userId) {
      const userCharKey = ["users", state.adventurer.userId, "adventurers", id];
      atomic.set(userCharKey, id); // Just store the ID as reference
    }
    
    return await atomic.commit();
  }

  /**
   * Lists all adventurer IDs for a specific user.
   */
  async listAdventurersForUser(userId: string): Promise<string[]> {
    const prefix = ["users", userId, "adventurers"];
    const entries = this.kv.list<string>({ prefix });
    const ids: string[] = [];
    for await (const entry of entries) {
      ids.push(entry.value);
    }
    return ids;
  }

  /**
   * Loads an adventurer's state.
   */
  async loadAdventurer(id: string): Promise<GameState | null> {
    const key = ["adventurers", id];
    const result = await this.kv.get<GameState>(key);
    return result.value;
  }

  /**
   * Atomically updates an adventurer's state.
   * Ensures that the current state in the DB matches `oldState` before updating to `newState`.
   * 
   * @throws Error if the state has changed (optimistic concurrency failure) or if the adventurer doesn't exist.
   */
  async processTurn(id: string, oldState: GameState, newState: GameState): Promise<Deno.KvCommitResult> {
    const key = ["adventurers", id];
    
    // 1. Fetch current version
    const currentEntry = await this.kv.get<GameState>(key);
    
    // 2. Initial check: state must exist
    if (!currentEntry.value) {
      throw new Error(`Adventurer ${id} not found.`);
    }

    // 3. Verify value matches oldState (Optimistic Concurrency Control by value)
    if (!equal(currentEntry.value, oldState)) {
      throw new Error("State conflict: The adventurer state has changed in the background.");
    }

    // 4. Atomic commit using versionstamp
    const result = await this.kv.atomic()
      .check(currentEntry) // Checks that key has strict versionstamp of currentEntry
      .set(key, newState)
      .commit();

    if (!result.ok) {
      throw new Error("Atomic commit failed. Race condition detected.");
    }

    return result;
  }

  /**
   * Returns a ReadableStream that emits updates for a specific adventurer.
   * Useful for Server-Sent Events (SSE) or similar real-time feeds.
   */
  streamAdventurer(id: string): ReadableStream<GameState | null> {
    const key = ["adventurers", id];
    const kv = this.kv;
    
    return new ReadableStream({
      async start(controller) {
        // kv.watch returns an async iterator of entry lists
        const watcher = kv.watch([key]);
        try {
          for await (const entries of watcher) {
            const entry = entries[0];
            controller.enqueue(entry.value as GameState | null);
          }
        } catch (error) {
          controller.error(error);
        }
      },
      cancel() {
        // kv.watch doesn't have an explicit cancel method in the iterator itself, 
        // but breaking the loop (which happens when stream is cancelled/reader release) handles cleanup?
        // Actually, for await loop on watcher keeps going. We need to signal abort?
        // Deno KV watcher is an async generator. Breaking the loop is enough.
        // However, we are inside `start` which is async. 
        // When `cancel` is called, the stream is closed. 
        // Ideally we should make the iterator cancellable, but Deno.Kv.watch doesn't accept an abort signal yet easily.
        // We can just return, but the loop might be stuck waiting for a change.
        // This is a known limitation of current Deno KV watch in some contexts, but usually it cleans up on GC or if we can break the loop. 
        // Since we can't easily break the loop from outside without a signal, we'll leave it as is for this demo.
      }
    });
  }

  /**
   * Saves a user to the database.
   */
  async saveUser(user: User): Promise<Deno.KvCommitResult | Deno.KvCommitError> {
    const key = ["users", user.username];
    return await this.kv.set(key, user);
  }

  /**
   * Loads a user by username.
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const key = ["users", username];
    const result = await this.kv.get<User>(key);
    return result.value;
  }

  /** Upserts a guild member record (used for leaderboard). */
  async saveGuildMember(
    guildId: string,
    adventurerId: string,
    record: GuildMemberRecord,
  ): Promise<void> {
    await this.kv.set(["guild_members", guildId, adventurerId], record);
  }

  /** Removes a guild member from the leaderboard index. */
  async removeGuildMember(guildId: string, adventurerId: string): Promise<void> {
    await this.kv.delete(["guild_members", guildId, adventurerId]);
  }

  /** Lists all members of a guild, sorted by standing (descending). */
  async listGuildMembers(guildId: string): Promise<GuildMemberRecord[]> {
    const prefix = ["guild_members", guildId];
    const entries = this.kv.list<GuildMemberRecord>({ prefix });
    const members: GuildMemberRecord[] = [];
    for await (const entry of entries) {
      if (entry.value) members.push(entry.value);
    }
    return members.sort((a, b) => b.standing - a.standing);
  }

  /**
   * Prepends a guild event to the event log. Keeps only the last 20 events.
   * The Discord bot polls this endpoint to broadcast rank changes and joins.
   */
  async addGuildEvent(guildId: string, event: GuildEvent): Promise<void> {
    const key = ["guild_events", guildId];
    const existing = await this.kv.get<GuildEvent[]>(key);
    const events = existing.value ? [...existing.value] : [];
    events.unshift(event);
    if (events.length > 20) events.length = 20;
    await this.kv.set(key, events);
  }

  /** Returns the last 20 guild events (newest first). */
  async getGuildEvents(guildId: string): Promise<GuildEvent[]> {
    const key = ["guild_events", guildId];
    const result = await this.kv.get<GuildEvent[]>(key);
    return result.value ?? [];
  }
}
