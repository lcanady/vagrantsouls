# Guild System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add persistent guilds (Iron Vanguard, Arcane Circle, Shadow Step, Silver Wanderers) that adventurers can join, contribute gold to earn standing, and progress through 5 ranks — with a public leaderboard and event feed for the Discord bot.

**Architecture:** Static guild definitions live in a data file; per-adventurer state (`guildId`, `guildStanding`) is stored on the Adventurer object (consistent with how arcanist/beast work); a KV member index (`["guild_members", guildId, adventurerId]`) enables leaderboard queries without scanning all adventurers; a KV event log (`["guild_events", guildId]`) gives the Discord bot a feed to poll.

**Tech Stack:** Deno 2.0 + Hono + Deno KV + Zod. Same patterns as existing Book 4 services — pure service functions, route handlers handle persistence.

---

## Route Map

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/guilds` | — | List all 4 guilds |
| GET | `/api/v1/guilds/:guildId` | — | Guild info + leaderboard |
| GET | `/api/v1/guilds/:guildId/events` | — | Event feed for Discord bot |
| GET | `/api/v1/guilds/adventurer/:id/status` | ✓ | My guild status + rank + benefits |
| POST | `/api/v1/guilds/adventurer/:id/join` | ✓ | Join a guild |
| POST | `/api/v1/guilds/adventurer/:id/leave` | ✓ | Leave current guild |
| POST | `/api/v1/guilds/adventurer/:id/contribute` | ✓ | Spend gold to gain standing |

The `/adventurer/:id/` prefix cleanly separates protected adventurer actions from public guild-info routes, avoiding any Hono routing ambiguity.

---

## KV Key Schema

```
["guild_members", guildId, adventurerId]  → GuildMemberRecord  (for leaderboard)
["guild_events",  guildId]                → GuildEvent[]        (capped at 20, for Discord bot)
```

Adventurer's own `guildId` and `guildStanding` live on the Adventurer object (already in KV under `["adventurers", id]`).

---

## Task 1: Static Guild Data

**Files:**
- Create: `src/data/guilds.ts`

### Step 1: Write the file

```typescript
// src/data/guilds.ts

export type GuildRank = "newcomer" | "initiate" | "veteran" | "champion" | "legend";

export const GUILD_RANKS: GuildRank[] = [
  "newcomer",
  "initiate",
  "veteran",
  "champion",
  "legend",
];

export interface GuildRankInfo {
  description: string; // Shown to players
  effect: string;      // Machine-readable key for future mechanical integration
}

export interface GuildDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  compatiblePaths: string[];
  rankThresholds: Record<GuildRank, number>;
  rankBenefits: Record<GuildRank, GuildRankInfo>;
}

export const GUILDS: GuildDefinition[] = [
  {
    id: "iron-vanguard",
    name: "Iron Vanguard",
    emoji: "⚔️",
    description: "A legendary order of Warriors sworn to protect the realm. Their hall rings with the clash of iron and the songs of heroes.",
    compatiblePaths: ["Warrior", "Knight", "Paladin", "Barbarian"],
    rankThresholds: { newcomer: 0, initiate: 25, veteran: 50, champion: 75, legend: 100 },
    rankBenefits: {
      newcomer:  { description: "Access to the Iron Vanguard Guild Hall.", effect: "guild_hall_access" },
      initiate:  { description: "Weapon training costs 20% less gold during downtime.", effect: "training_weapon_discount_20" },
      veteran:   { description: "Heal 5 HP for free at the Guild Hall once per downtime.", effect: "guild_hall_heal_5" },
      champion:  { description: "Armor repair is free during downtime at the Guild Hall.", effect: "repair_free" },
      legend:    { description: "+10 to all Warrior-class skills.", effect: "warrior_skills_plus_10" },
    },
  },
  {
    id: "arcane-circle",
    name: "Arcane Circle",
    emoji: "🔮",
    description: "A circle of Sorcerers who gather beneath starlit towers to share forbidden knowledge and guard the balance of magic.",
    compatiblePaths: ["Sorcerer", "Warlock", "Druid", "Arcane Wizard"],
    rankThresholds: { newcomer: 0, initiate: 25, veteran: 50, champion: 75, legend: 100 },
    rankBenefits: {
      newcomer:  { description: "Access to the Arcane Circle's library.", effect: "guild_hall_access" },
      initiate:  { description: "Magic tuition costs 20% less gold during downtime.", effect: "magic_tuition_discount_20" },
      veteran:   { description: "Gain 1 free spell pip once per downtime session.", effect: "free_spell_pip" },
      champion:  { description: "Spells learned during downtime cost 1 fewer pip (min 1).", effect: "spell_cost_minus_1" },
      legend:    { description: "+10 to all Sorcerer-class skills.", effect: "sorcerer_skills_plus_10" },
    },
  },
  {
    id: "shadow-step",
    name: "Shadow Step",
    emoji: "🗡️",
    description: "A guild of Rogues who move unseen through cities and dungeons alike. Membership is offered, never advertised.",
    compatiblePaths: ["Rogue", "Assassin", "Scoundrel", "Hunter"],
    rankThresholds: { newcomer: 0, initiate: 25, veteran: 50, champion: 75, legend: 100 },
    rankBenefits: {
      newcomer:  { description: "Access to Shadow Step's underground contacts.", effect: "guild_hall_access" },
      initiate:  { description: "Sell loot for 10% more gold during downtime.", effect: "sell_bonus_10" },
      veteran:   { description: "Buy items for 10% less gold during downtime.", effect: "buy_discount_10" },
      champion:  { description: "Poison and disease treatment costs 50% less gold.", effect: "cure_discount_50" },
      legend:    { description: "+10 to all Rogue-class skills.", effect: "rogue_skills_plus_10" },
    },
  },
  {
    id: "silver-wanderers",
    name: "Silver Wanderers",
    emoji: "🌙",
    description: "Lone adventurers who answer to no banner and no order — bound only by the open road and their own code.",
    compatiblePaths: [], // Open to all paths (solo players, no allegiance)
    rankThresholds: { newcomer: 0, initiate: 25, veteran: 50, champion: 75, legend: 100 },
    rankBenefits: {
      newcomer:  { description: "The road is yours. No hall, no obligations.", effect: "guild_hall_access" },
      initiate:  { description: "Downtime healing costs 10% less gold.", effect: "heal_discount_10" },
      veteran:   { description: "+5 to searching and scouting-related skills.", effect: "search_skills_plus_5" },
      champion:  { description: "Once per dungeon, you may reroll an encounter result.", effect: "encounter_reroll" },
      legend:    { description: "+5 to all base stats while adventuring solo.", effect: "solo_all_stats_plus_5" },
    },
  },
];

/** Returns a guild definition by its ID, or undefined if not found. */
export function getGuildById(id: string): GuildDefinition | undefined {
  return GUILDS.find((g) => g.id === id);
}

/**
 * Returns the rank an adventurer holds given their standing.
 * Standing 0–24 = newcomer, 25–49 = initiate, 50–74 = veteran, 75–99 = champion, 100 = legend.
 */
export function rankForStanding(standing: number): GuildRank {
  if (standing >= 100) return "legend";
  if (standing >= 75) return "champion";
  if (standing >= 50) return "veteran";
  if (standing >= 25) return "initiate";
  return "newcomer";
}

/** Returns all rank benefits unlocked at or below the given rank. */
export function unlockedBenefits(guild: GuildDefinition, rank: GuildRank): GuildRankInfo[] {
  const rankIndex = GUILD_RANKS.indexOf(rank);
  return GUILD_RANKS.slice(0, rankIndex + 1).map((r) => guild.rankBenefits[r]);
}
```

### Step 2: Commit

```bash
git add src/data/guilds.ts
git commit -m "feat: add static guild definitions (4 guilds, 5 ranks, LUNAR aesthetic)"
```

---

## Task 2: Adventurer Schema Extension

**Files:**
- Modify: `src/models/adventurer.ts` — add 2 new fields at the end of the schema

The Adventurer Zod schema currently has `property` as the last field (line 187). Add after it.

### Step 1: Write the new fields

In `src/models/adventurer.ts`, after the `property` field block (line 193, closing `}).nullable().optional(),`), add:

```typescript
  // --- Guilds ---
  guildId: z.string().nullable().optional(),
  guildStanding: z.number().int().min(0).max(100).default(0),
```

The final schema block will look like:

```typescript
  // --- Book 4: Property ---
  property: z.object({
    name: z.string(),
    slots: z.number().int().min(0),
    security: z.number().int().min(0).max(90).default(0),
    upkeep: z.number().int().min(0),
    storedItems: z.array(z.string()).default([]),
  }).nullable().optional(),

  // --- Guilds ---
  guildId: z.string().nullable().optional(),
  guildStanding: z.number().int().min(0).max(100).default(0),
});
```

### Step 2: Update `src/state.ts` — `createInitialState` and `createAdventurer`

In `createInitialState()` (line 17), add to the `adventurer` object (after `combatExperience: {}`):

```typescript
      guildId: undefined,
      guildStanding: 0,
```

In `createAdventurer()` (line 109), add the same two lines to the `newAdventurer` object (after `combatExperience: {}`):

```typescript
      guildId: undefined,
      guildStanding: 0,
```

### Step 3: Run type-check to confirm no breakage

```bash
deno check src/main.ts
```

Expected: no errors.

### Step 4: Commit

```bash
git add src/models/adventurer.ts src/state.ts
git commit -m "feat: add guildId and guildStanding to Adventurer schema"
```

---

## Task 3: Repository Guild Methods

**Files:**
- Modify: `src/repository.ts` — add 5 new methods

First, add the interfaces near the top of the file (after the existing imports). These types live here because they're persistence layer types, not game model types.

### Step 1: Add interfaces and methods to `src/repository.ts`

Add this block **after the import statements** (after line 4):

```typescript
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
```

Add these methods **inside the `Repository` class** (after `getUserByUsername`):

```typescript
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
    const events = existing.value ?? [];
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
```

### Step 2: Run type-check

```bash
deno check src/repository.ts
```

Expected: no errors.

### Step 3: Commit

```bash
git add src/repository.ts
git commit -m "feat: add guild member index and event log to Repository"
```

---

## Task 4: GuildService Tests (TDD Red)

**Files:**
- Create: `tests/guild_test.ts`

### Step 1: Write failing tests

```typescript
// tests/guild_test.ts
import { assertEquals } from "@std/assert";
import { GuildService } from "../src/services/GuildService.ts";
import { rankForStanding, getGuildById } from "../src/data/guilds.ts";
import { createInitialState } from "../src/state.ts";

const svc = new GuildService();

// --- rankForStanding helper ---

Deno.test("rankForStanding - 0 is newcomer", () => {
  assertEquals(rankForStanding(0), "newcomer");
});

Deno.test("rankForStanding - 24 is newcomer", () => {
  assertEquals(rankForStanding(24), "newcomer");
});

Deno.test("rankForStanding - 25 is initiate", () => {
  assertEquals(rankForStanding(25), "initiate");
});

Deno.test("rankForStanding - 49 is initiate", () => {
  assertEquals(rankForStanding(49), "initiate");
});

Deno.test("rankForStanding - 50 is veteran", () => {
  assertEquals(rankForStanding(50), "veteran");
});

Deno.test("rankForStanding - 75 is champion", () => {
  assertEquals(rankForStanding(75), "champion");
});

Deno.test("rankForStanding - 100 is legend", () => {
  assertEquals(rankForStanding(100), "legend");
});

// --- getGuildById helper ---

Deno.test("getGuildById - known id returns guild", () => {
  const guild = getGuildById("iron-vanguard");
  assertEquals(guild?.name, "Iron Vanguard");
});

Deno.test("getGuildById - unknown id returns undefined", () => {
  assertEquals(getGuildById("made-up-guild"), undefined);
});

// --- GuildService.joinGuild ---

Deno.test("joinGuild - valid guild sets guildId and resets standing to 0", () => {
  const state = createInitialState();
  const { adventurer, result } = svc.joinGuild(state.adventurer, "iron-vanguard");
  assertEquals(result.success, true);
  assertEquals(adventurer.guildId, "iron-vanguard");
  assertEquals(adventurer.guildStanding, 0);
});

Deno.test("joinGuild - emits a join event", () => {
  const state = createInitialState();
  const { result } = svc.joinGuild(state.adventurer, "iron-vanguard");
  assertEquals(result.event?.type, "joined");
});

Deno.test("joinGuild - invalid guildId returns failure", () => {
  const state = createInitialState();
  const { adventurer, result } = svc.joinGuild(state.adventurer, "bad-guild");
  assertEquals(result.success, false);
  assertEquals(adventurer.guildId, undefined);
});

Deno.test("joinGuild - already in a guild returns failure", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  const { result } = svc.joinGuild(state.adventurer, "arcane-circle");
  assertEquals(result.success, false);
});

// --- GuildService.leaveGuild ---

Deno.test("leaveGuild - clears guildId and resets standing", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.guildStanding = 40;
  const { adventurer, result } = svc.leaveGuild(state.adventurer);
  assertEquals(result.success, true);
  assertEquals(adventurer.guildId, null);
  assertEquals(adventurer.guildStanding, 0);
});

Deno.test("leaveGuild - emits a left event with correct previous guild", () => {
  const state = createInitialState();
  state.adventurer.guildId = "shadow-step";
  state.adventurer.guildStanding = 30;
  const { result } = svc.leaveGuild(state.adventurer);
  assertEquals(result.event?.type, "left");
  assertEquals(result.previousGuildId, "shadow-step");
});

Deno.test("leaveGuild - not in guild returns failure", () => {
  const state = createInitialState();
  const { result } = svc.leaveGuild(state.adventurer);
  assertEquals(result.success, false);
});

// --- GuildService.contribute ---

Deno.test("contribute - 10 gold gives 1 standing", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.guildStanding = 0;
  state.adventurer.gold = 100;
  const { adventurer, result } = svc.contribute(state.adventurer, 10);
  assertEquals(result.success, true);
  assertEquals(adventurer.guildStanding, 1);
  assertEquals(adventurer.gold, 90);
  assertEquals(result.standingGained, 1);
  assertEquals(result.goldSpent, 10);
});

Deno.test("contribute - 50 gold gives 5 standing", () => {
  const state = createInitialState();
  state.adventurer.guildId = "arcane-circle";
  state.adventurer.guildStanding = 0;
  state.adventurer.gold = 200;
  const { adventurer, result } = svc.contribute(state.adventurer, 50);
  assertEquals(adventurer.guildStanding, 5);
  assertEquals(result.goldSpent, 50);
});

Deno.test("contribute - crossing rank threshold sets rankChanged and emits event", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.guildStanding = 20; // 5 standing away from initiate (25)
  state.adventurer.gold = 500;
  const { adventurer, result } = svc.contribute(state.adventurer, 50); // +5 standing
  assertEquals(adventurer.guildStanding, 25);
  assertEquals(result.rankChanged, true);
  assertEquals(result.newRank, "initiate");
  assertEquals(result.previousRank, "newcomer");
  assertEquals(result.event?.type, "rank_up");
});

Deno.test("contribute - contribution capped at max standing (100)", () => {
  const state = createInitialState();
  state.adventurer.guildId = "shadow-step";
  state.adventurer.guildStanding = 98;
  state.adventurer.gold = 1000;
  const { adventurer, result } = svc.contribute(state.adventurer, 100); // would be +10, but capped at +2
  assertEquals(adventurer.guildStanding, 100);
  assertEquals(result.standingGained, 2);
  assertEquals(result.goldSpent, 20); // only paid for 2 standing
});

Deno.test("contribute - fails when not in a guild", () => {
  const state = createInitialState();
  state.adventurer.gold = 100;
  const { result } = svc.contribute(state.adventurer, 10);
  assertEquals(result.success, false);
});

Deno.test("contribute - fails when not enough gold", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.gold = 5;
  const { result } = svc.contribute(state.adventurer, 10);
  assertEquals(result.success, false);
});

Deno.test("contribute - fails with less than 10 gold contribution", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.gold = 100;
  const { result } = svc.contribute(state.adventurer, 9);
  assertEquals(result.success, false);
});

Deno.test("contribute - fails when already at max standing", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.guildStanding = 100;
  state.adventurer.gold = 100;
  const { result } = svc.contribute(state.adventurer, 10);
  assertEquals(result.success, false);
});

// --- GuildService.getStatus ---

Deno.test("getStatus - returns null when not in a guild", () => {
  const state = createInitialState();
  assertEquals(svc.getStatus(state.adventurer), null);
});

Deno.test("getStatus - returns rank and unlocked benefits for current standing", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.guildStanding = 30; // initiate
  const status = svc.getStatus(state.adventurer);
  assertEquals(status?.rank, "initiate");
  assertEquals(status?.guild.name, "Iron Vanguard");
  // Should have 2 benefits unlocked: newcomer + initiate
  assertEquals(status?.benefits.length, 2);
});

Deno.test("getStatus - legend rank unlocks all 5 benefits", () => {
  const state = createInitialState();
  state.adventurer.guildId = "shadow-step";
  state.adventurer.guildStanding = 100;
  const status = svc.getStatus(state.adventurer);
  assertEquals(status?.rank, "legend");
  assertEquals(status?.benefits.length, 5);
});
```

### Step 2: Run tests to confirm they FAIL

```bash
deno test -A --unstable-kv tests/guild_test.ts
```

Expected: all tests **fail** with "Cannot find module" (GuildService doesn't exist yet). If some pass unexpectedly, check your test logic.

### Step 3: Commit the failing tests

```bash
git add tests/guild_test.ts
git commit -m "test(red): add failing GuildService tests"
```

---

## Task 5: GuildService Implementation (TDD Green)

**Files:**
- Create: `src/services/GuildService.ts`

### Step 1: Write the implementation

```typescript
// src/services/GuildService.ts
import { Adventurer } from "../models/adventurer.ts";
import {
  GuildDefinition,
  GuildRank,
  getGuildById,
  rankForStanding,
  unlockedBenefits,
  GuildRankInfo,
} from "../data/guilds.ts";
import { GuildEvent } from "../repository.ts";

export interface GuildResult {
  success: boolean;
  message: string;
  rankChanged?: boolean;
  newRank?: GuildRank;
  previousRank?: GuildRank;
  standingGained?: number;
  goldSpent?: number;
  event?: GuildEvent;
  previousGuildId?: string;
}

export interface GuildStatus {
  guild: GuildDefinition;
  rank: GuildRank;
  standing: number;
  benefits: GuildRankInfo[];
}

export class GuildService {
  /**
   * Joins an adventurer to a guild.
   * Fails if the guild does not exist or the adventurer is already a member.
   */
  joinGuild(
    adventurer: Adventurer,
    guildId: string,
  ): { adventurer: Adventurer; result: GuildResult } {
    const guild = getGuildById(guildId);
    if (!guild) {
      return { adventurer, result: { success: false, message: `Guild '${guildId}' not found.` } };
    }
    if (adventurer.guildId) {
      return {
        adventurer,
        result: { success: false, message: `Already a member of '${adventurer.guildId}'. Leave first.` },
      };
    }

    const updated: Adventurer = { ...adventurer, guildId, guildStanding: 0 };
    const event: GuildEvent = {
      type: "joined",
      adventurerId: adventurer.id,
      adventurerName: adventurer.name,
      rank: "newcomer",
      timestamp: new Date().toISOString(),
    };

    return {
      adventurer: updated,
      result: {
        success: true,
        message: `Welcome to the ${guild.name}, ${adventurer.name}! Your legend begins here.`,
        event,
      },
    };
  }

  /**
   * Removes an adventurer from their current guild, resetting standing to 0.
   */
  leaveGuild(
    adventurer: Adventurer,
  ): { adventurer: Adventurer; result: GuildResult } {
    if (!adventurer.guildId) {
      return { adventurer, result: { success: false, message: "Not a member of any guild." } };
    }

    const previousGuildId = adventurer.guildId;
    const currentRank = rankForStanding(adventurer.guildStanding);
    const updated: Adventurer = { ...adventurer, guildId: null, guildStanding: 0 };
    const event: GuildEvent = {
      type: "left",
      adventurerId: adventurer.id,
      adventurerName: adventurer.name,
      rank: currentRank,
      timestamp: new Date().toISOString(),
    };

    return {
      adventurer: updated,
      result: {
        success: true,
        message: `${adventurer.name} has left the guild. Standing and rank have been reset.`,
        previousGuildId,
        event,
      },
    };
  }

  /**
   * Spends gold to increase guild standing.
   * Rate: 10 gold = 1 standing. Minimum contribution: 10 gold. Maximum standing: 100.
   * Only spends the gold needed to reach max standing (no waste).
   */
  contribute(
    adventurer: Adventurer,
    goldAmount: number,
  ): { adventurer: Adventurer; result: GuildResult } {
    if (!adventurer.guildId) {
      return { adventurer, result: { success: false, message: "Not a member of any guild." } };
    }
    if (goldAmount < 10) {
      return { adventurer, result: { success: false, message: "Minimum contribution is 10 gold." } };
    }
    if (adventurer.gold < goldAmount) {
      return { adventurer, result: { success: false, message: "Not enough gold." } };
    }
    if (adventurer.guildStanding >= 100) {
      return { adventurer, result: { success: false, message: "Already at maximum standing (Legend)." } };
    }

    const maxStandingGainable = 100 - adventurer.guildStanding;
    const requestedStanding = Math.floor(goldAmount / 10);
    const standingGained = Math.min(requestedStanding, maxStandingGainable);
    const goldSpent = standingGained * 10;

    const previousRank = rankForStanding(adventurer.guildStanding);
    const newStanding = adventurer.guildStanding + standingGained;
    const newRank = rankForStanding(newStanding);
    const rankChanged = newRank !== previousRank;

    const updated: Adventurer = {
      ...adventurer,
      gold: adventurer.gold - goldSpent,
      guildStanding: newStanding,
    };

    let event: GuildEvent | undefined;
    if (rankChanged) {
      event = {
        type: "rank_up",
        adventurerId: adventurer.id,
        adventurerName: adventurer.name,
        rank: newRank,
        timestamp: new Date().toISOString(),
      };
    }

    const message = rankChanged
      ? `${adventurer.name} has risen to ${newRank} of the guild! (${newStanding}/100 standing)`
      : `Contributed ${goldSpent} gold. Standing: ${newStanding}/100.`;

    return {
      adventurer: updated,
      result: {
        success: true,
        message,
        standingGained,
        goldSpent,
        rankChanged: rankChanged || undefined,
        newRank: rankChanged ? newRank : undefined,
        previousRank: rankChanged ? previousRank : undefined,
        event,
      },
    };
  }

  /**
   * Returns the adventurer's current guild status, or null if not in a guild.
   */
  getStatus(adventurer: Adventurer): GuildStatus | null {
    if (!adventurer.guildId) return null;
    const guild = getGuildById(adventurer.guildId);
    if (!guild) return null;

    const rank = rankForStanding(adventurer.guildStanding);
    const benefits = unlockedBenefits(guild, rank);

    return { guild, rank, standing: adventurer.guildStanding, benefits };
  }
}
```

### Step 2: Run tests — all must pass

```bash
deno test -A --unstable-kv tests/guild_test.ts
```

Expected: all tests **pass**. Fix any failures before continuing.

### Step 3: Run the full test suite to check for regressions

```bash
deno task test
```

Expected: all existing tests still pass (guild tests are additive, not breaking anything).

### Step 4: Commit

```bash
git add src/services/GuildService.ts
git commit -m "feat: implement GuildService (join, leave, contribute, getStatus)"
```

---

## Task 6: Guild Routes

**Files:**
- Create: `src/routes/guilds.ts`

Look at `src/middleware/adventurer.ts` before writing this file to confirm the exact variable names set by `loadAdventurer` (should be `adventurerId` and `gameState`).

### Step 1: Write the routes file

```typescript
// src/routes/guilds.ts
import { Hono, Context } from "hono";
import { z } from "zod";
import { Repository, GuildMemberRecord } from "../repository.ts";
import { GameState } from "../models/gamestate.ts";
import { loadAdventurer } from "../middleware/adventurer.ts";
import { GUILDS, getGuildById, rankForStanding } from "../data/guilds.ts";
import { GuildService } from "../services/GuildService.ts";

const guildService = new GuildService();

const guildsRoutes = new Hono<{
  Variables: {
    repository: Repository;
    gameState: GameState;
    adventurerId: string;
  };
}>();

// ----------------------------------------------------------------
// Public routes — no auth required
// ----------------------------------------------------------------

/** List all guilds with basic info. */
guildsRoutes.get("/", (c: Context) => {
  const summary = GUILDS.map((g) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    description: g.description,
    compatiblePaths: g.compatiblePaths,
  }));
  return c.json({ guilds: summary });
});

/** Guild details including full rank/benefit table and current leaderboard. */
guildsRoutes.get("/:guildId", async (c: Context) => {
  const { guildId } = c.req.param();
  const guild = getGuildById(guildId);
  if (!guild) return c.json({ error: "Guild not found." }, 404);

  const repo = c.get("repository") as Repository;
  const leaderboard = await repo.listGuildMembers(guildId);

  return c.json({ guild, leaderboard: leaderboard.slice(0, 20) });
});

/** Event feed for the Discord bot. Returns last 20 events (newest first). */
guildsRoutes.get("/:guildId/events", async (c: Context) => {
  const { guildId } = c.req.param();
  if (!getGuildById(guildId)) return c.json({ error: "Guild not found." }, 404);

  const repo = c.get("repository") as Repository;
  const events = await repo.getGuildEvents(guildId);
  return c.json({ guildId, events });
});

// ----------------------------------------------------------------
// Protected adventurer routes — auth + loadAdventurer applied in main.ts
// ----------------------------------------------------------------

guildsRoutes.use("/adventurer/*", loadAdventurer);

/** Get current guild status for this adventurer. */
guildsRoutes.get("/adventurer/:id/status", (c: Context) => {
  const gameState = c.get("gameState") as GameState;
  const status = guildService.getStatus(gameState.adventurer);
  if (!status) return c.json({ guildId: null, message: "Not a member of any guild." });
  return c.json(status);
});

/** Join a guild. Body: { guildId: string } */
guildsRoutes.post("/adventurer/:id/join", async (c: Context) => {
  const repo = c.get("repository") as Repository;
  const adventurerId = c.get("adventurerId") as string;
  const gameState = c.get("gameState") as GameState;

  const body = await c.req.json();
  const { guildId } = z.object({ guildId: z.string() }).parse(body);

  const { adventurer, result } = guildService.joinGuild(gameState.adventurer, guildId);
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState: GameState = { ...gameState, adventurer };
  await repo.saveAdventurer(adventurerId, newState);

  const memberRecord: GuildMemberRecord = {
    adventurerId,
    adventurerName: adventurer.name,
    standing: 0,
    rank: "newcomer",
  };
  await repo.saveGuildMember(guildId, adventurerId, memberRecord);

  if (result.event) await repo.addGuildEvent(guildId, result.event);

  return c.json({
    message: result.message,
    guildId,
    standing: 0,
    rank: "newcomer",
  });
});

/** Leave current guild. Standing resets to 0. */
guildsRoutes.post("/adventurer/:id/leave", async (c: Context) => {
  const repo = c.get("repository") as Repository;
  const adventurerId = c.get("adventurerId") as string;
  const gameState = c.get("gameState") as GameState;

  const { adventurer, result } = guildService.leaveGuild(gameState.adventurer);
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState: GameState = { ...gameState, adventurer };
  await repo.saveAdventurer(adventurerId, newState);

  if (result.previousGuildId) {
    await repo.removeGuildMember(result.previousGuildId, adventurerId);
    if (result.event) await repo.addGuildEvent(result.previousGuildId, result.event);
  }

  return c.json({ message: result.message });
});

/**
 * Contribute gold to gain standing.
 * Body: { gold: number } — must be a multiple of 10 and at least 10.
 */
guildsRoutes.post("/adventurer/:id/contribute", async (c: Context) => {
  const repo = c.get("repository") as Repository;
  const adventurerId = c.get("adventurerId") as string;
  const gameState = c.get("gameState") as GameState;

  const body = await c.req.json();
  const { gold } = z.object({ gold: z.number().int().min(10) }).parse(body);

  const { adventurer, result } = guildService.contribute(gameState.adventurer, gold);
  if (!result.success) return c.json({ error: result.message }, 400);

  const newState: GameState = { ...gameState, adventurer };
  await repo.saveAdventurer(adventurerId, newState);

  // Update the leaderboard index with new standing and rank
  if (adventurer.guildId) {
    const memberRecord: GuildMemberRecord = {
      adventurerId,
      adventurerName: adventurer.name,
      standing: adventurer.guildStanding,
      rank: rankForStanding(adventurer.guildStanding),
    };
    await repo.saveGuildMember(adventurer.guildId, adventurerId, memberRecord);

    if (result.event) await repo.addGuildEvent(adventurer.guildId, result.event);
  }

  return c.json({
    message: result.message,
    standing: adventurer.guildStanding,
    rank: rankForStanding(adventurer.guildStanding),
    goldSpent: result.goldSpent,
    standingGained: result.standingGained,
    rankChanged: result.rankChanged ?? false,
    newRank: result.newRank,
  });
});

export default guildsRoutes;
```

### Step 2: Run type-check

```bash
deno check src/routes/guilds.ts
```

Expected: no errors.

### Step 3: Commit

```bash
git add src/routes/guilds.ts
git commit -m "feat: add guild routes (public info + protected adventurer actions)"
```

---

## Task 7: Mount Routes in main.ts

**Files:**
- Modify: `src/main.ts`

### Step 1: Add import

Add after the last route import (after line 13, `import extraRulesRoutes...`):

```typescript
import guildsRoutes from "./routes/guilds.ts";
```

### Step 2: Add auth middleware for protected guild paths

Add after the existing `app.use("/api/v1/extra/*", authMiddleware)` line (line 51):

```typescript
app.use("/api/v1/guilds/adventurer/*", authMiddleware);
```

### Step 3: Mount the route

Add after `app.route("/api/v1/extra", extraRulesRoutes)` (line 60):

```typescript
app.route("/api/v1/guilds", guildsRoutes);
```

### Step 4: Run type-check

```bash
deno check src/main.ts
```

Expected: no errors.

### Step 5: Run full test suite

```bash
deno task test
```

Expected: all tests pass (same count as before, guild tests already verified in Task 5).

### Step 6: Commit

```bash
git add src/main.ts
git commit -m "feat: mount guild routes at /api/v1/guilds"
```

---

## Task 8: Smoke Test (Manual)

Start the server and verify the public endpoints respond correctly.

### Step 1: Start the dev server

```bash
deno task dev
```

### Step 2: Test public endpoints

```bash
# List all guilds
curl http://localhost:4200/api/v1/guilds | jq .

# Guild details (no members yet — leaderboard will be empty)
curl http://localhost:4200/api/v1/guilds/iron-vanguard | jq .

# Events feed (empty initially)
curl http://localhost:4200/api/v1/guilds/iron-vanguard/events | jq .

# 404 for unknown guild
curl http://localhost:4200/api/v1/guilds/bad-guild
```

Expected responses:
- `/guilds` → array of 4 guild summaries
- `/guilds/iron-vanguard` → full guild definition + `leaderboard: []`
- `/guilds/iron-vanguard/events` → `{ events: [] }`
- `/guilds/bad-guild` → `{ "error": "Guild not found." }` with 404

### Step 3: Test protected endpoint (auth required)

```bash
# Register + login first, then:
TOKEN="your-jwt-here"
ADVENTURER_ID="your-adventurer-uuid"

# Join a guild
curl -X POST http://localhost:4200/api/v1/guilds/adventurer/$ADVENTURER_ID/join \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"guildId": "iron-vanguard"}' | jq .

# Check status
curl http://localhost:4200/api/v1/guilds/adventurer/$ADVENTURER_ID/status \
  -H "Authorization: Bearer $TOKEN" | jq .

# Contribute gold
curl -X POST http://localhost:4200/api/v1/guilds/adventurer/$ADVENTURER_ID/contribute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gold": 250}' | jq .
  # Standing should increase by 25 (from 0 to 25 = initiate rank!)

# Verify leaderboard updated
curl http://localhost:4200/api/v1/guilds/iron-vanguard | jq .leaderboard

# Verify event log
curl http://localhost:4200/api/v1/guilds/iron-vanguard/events | jq .
```

---

## Summary of Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/data/guilds.ts` | Create | Static guild definitions + helper functions |
| `src/models/adventurer.ts` | Modify | Add `guildId` and `guildStanding` fields |
| `src/state.ts` | Modify | Add guild fields to `createInitialState` and `createAdventurer` |
| `src/repository.ts` | Modify | Add `GuildMemberRecord`, `GuildEvent` types + 5 KV methods |
| `tests/guild_test.ts` | Create | 22 unit tests for GuildService |
| `src/services/GuildService.ts` | Create | Pure guild logic (join, leave, contribute, getStatus) |
| `src/routes/guilds.ts` | Create | 7 HTTP endpoints |
| `src/main.ts` | Modify | Import + mount guild routes + auth middleware |

## What's NOT in this plan (YAGNI — future work)

- **Mechanical benefit enforcement:** The `effect` keys on each rank (e.g. `training_weapon_discount_20`) are defined but not yet wired into DowntimeService. That's a separate plan.
- **Guild-compatible-path validation:** Joining a non-compatible guild is allowed in MVP. Enforce later if desired.
- **Leave cooldown / standing penalty on leave:** Not implemented — adventurers can rejoin freely.
- **Guild creation / admin management:** All 4 guilds are static, created in code. No CRUD.
- **Discord bot integration:** The event feed (`/api/v1/guilds/:guildId/events`) is ready for the bot to poll. The bot implementation is a separate project (`d100-bot/`).
