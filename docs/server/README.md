# VagrantSoul — D100 Dungeon API Server

> A REST + WebSocket backend for playing the [D100 Dungeon](https://www.d100dungeon.co.uk/) solo/co-op tabletop RPG digitally.

---

## Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Route Map](#route-map)
- [Books Implemented](#books-implemented)

---

## Overview

VagrantSoul exposes the full D100 Dungeon ruleset as a JSON API. Each rule book is implemented as a set of deterministic service methods — the client provides dice rolls, the server applies the rules and persists state. This makes every action reproducible, testable, and bot-friendly.

Key design choices:

- **Caller-supplied rolls** — most endpoints accept pre-rolled dice values in the request body, keeping the server deterministic for testing and replays.
- **Flat routing** — all extra-rules (Books 4, 8) live under `/api/v1/extra/`, World Builder under `/api/v1/worldbuilder/`. No per-book namespacing.
- **Deno KV persistence** — adventurer state is a single JSON blob keyed by adventurer UUID. No SQL schema migrations needed.
- **Zod validation** — every request body is parsed with a Zod schema; malformed payloads get a `400` with details.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Deno 2.0 |
| HTTP Framework | Hono |
| Persistence | Deno KV (built-in) |
| AI Narrator | LangGraph + Google Gemini 2.5 Flash |
| Vector DB | ChromaDB (Docker, port 8000) |
| Discord Bot | Separate service in `d100-bot/` |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Hono App (port 4200)           │
│                                                  │
│  middleware/auth.ts   ← JWT Bearer verification  │
│  middleware/adventurer.ts ← loads GameState      │
│  middleware/game_logic.ts ← dead-check guard     │
│                                                  │
│  routes/auth.ts       /api/v1/auth               │
│  routes/chargen.ts    /api/v1/chargen            │
│  routes/adventurer.ts /api/v1/adventurer         │
│  routes/dungeon.ts    /api/v1/dungeon            │
│  routes/combat.ts     /api/v1/combat             │
│  routes/party.ts      /api/v1/party              │
│  routes/downtime.ts   /api/v1/downtime           │
│  routes/quests.ts     /api/v1/quests             │
│  routes/extrarules.ts /api/v1/extra              │
│  routes/guilds.ts     /api/v1/guilds             │
│  routes/world_builder.ts /api/v1/worldbuilder    │
└──────────────────┬──────────────────────────────┘
                   │
          ┌────────▼────────┐
          │  services/      │  Pure business logic
          │  (stateless)    │  Input: Adventurer
          │                 │  Output: { adventurer, result }
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │  Deno KV        │  ["adventurers", id]
          │  repository.ts  │  ["users", username]
          │                 │  ["guild_members", guildId, advId]
          └─────────────────┘
```

### Request Flow

1. JWT Bearer token validated by `authMiddleware`
2. `loadAdventurer` middleware reads `X-Adventurer-Id` header, loads `GameState` from KV, sets `gameState` and `adventurerId` on context
3. Route handler calls service method(s) with `gameState.adventurer`
4. Service returns `{ adventurer: updatedAdv, result }`
5. Route saves updated `GameState` back to KV and returns JSON

### Service Return Pattern

Almost all service methods follow the same contract:

```ts
// Standard pattern
{ adventurer: Adventurer, result: { success: boolean, message: string, ...extras } }

// ArcanistService — adventurer is nested inside result
{ result: { adventurer: Adventurer, success: boolean, ... } }

// CombatExperienceService — returns result directly (no wrapping)
KillResult
```

---

## Directory Structure

```
server/
├── main.ts                  # Hono app entry point, route mounting, KV init
├── repository.ts            # Deno KV CRUD (adventurers, users, guilds)
├── state.ts                 # In-memory legacy game state (unused in new flow)
│
├── models/
│   ├── adventurer.ts        # Adventurer + sub-schemas (Beast, Arcanist, Artisan,
│   │                        #   WorldBuilderState, etc.)
│   ├── item.ts              # Item, EquipmentSlot schemas
│   ├── monster.ts           # Monster schema
│   ├── room.ts              # Room schema
│   ├── party.ts             # Party schema
│   ├── gamestate.ts         # GameState = { adventurer, timeTrack, currentRoom, ... }
│   └── user.ts              # User schema
│
├── routes/                  # HTTP handlers (thin — delegate to services)
│   ├── auth.ts
│   ├── chargen.ts
│   ├── adventurer.ts
│   ├── dungeon.ts
│   ├── combat.ts
│   ├── party.ts
│   ├── downtime.ts
│   ├── quests.ts
│   ├── extrarules.ts        # Books 4 + 8
│   ├── guilds.ts
│   └── world_builder.ts     # Books 6 + 8 (WB actions)
│
├── services/                # Business logic (all stateless pure functions)
│   ├── AuthService.ts
│   ├── DowntimeService.ts
│   ├── WitcheryService.ts
│   ├── QuestMakerService.ts
│   ├── GuildService.ts
│   ├── EncounterService.ts
│   ├── CombatLobby.ts
│   ├── PartyService.ts
│   ├── WebSocketService.ts
│   ├── VectorService.ts
│   │
│   ├── BeastService.ts          # Book 4
│   ├── ArcanistService.ts       # Book 4
│   ├── ArtisanService.ts        # Book 4
│   ├── CombatExperienceService.ts # Book 4
│   │
│   ├── WorldBuilderSetupService.ts    # Book 6
│   ├── WorldBuilderCalendarService.ts # Book 6
│   ├── WorldBuilderActionService.ts   # Book 6
│   ├── WorldBuilderQuestService.ts    # Book 6
│   ├── WorldBuilderSettlementService.ts # Book 6
│   ├── WorldBuilderMountService.ts    # Book 6
│   ├── WorldBuilderEventService.ts    # Book 6
│   ├── WorldMapRenderService.ts       # Book 6 (SVG maps)
│   │
│   ├── ButcheryService.ts         # Book 8
│   ├── DualWieldService.ts        # Book 8
│   ├── WeaponProficiencyService.ts # Book 8
│   ├── CheatDeathService.ts       # Book 8
│   ├── PursuitService.ts          # Book 8
│   ├── SecretPassagewayService.ts # Book 8
│   ├── MonsterVariantService.ts   # Book 8
│   ├── HonourPointsService.ts     # Book 8
│   ├── AccoladeService.ts         # Book 8
│   ├── HeroicItemService.ts       # Book 8
│   ├── EpicDungeonService.ts      # Book 8
│   ├── IdentifyService.ts         # Book 8
│   ├── YellowEventService.ts      # Book 8
│   ├── AmmunitionService.ts       # Book 8
│   ├── ThrowService.ts            # Book 8
│   ├── AimedAttackService.ts      # Book 8
│   ├── EquipmentModService.ts     # Book 8
│   ├── SpellManaService.ts        # Book 8
│   ├── WorldBuilderHerbalismService.ts # Book 8 WB
│   ├── WorldBuilderMiningService.ts    # Book 8 WB
│   └── WorldBuilderSkinningService.ts  # Book 8 WB
│
├── data/                    # Static game tables (read-only lookup data)
│   ├── curious_rules/       # Book 8 tables
│   │   ├── herbalism_table.ts
│   │   ├── mining_table.ts
│   │   ├── identify_table.ts
│   │   ├── legends_a_table.ts
│   │   ├── quests_e_table.ts
│   │   ├── race_b_table.ts
│   │   ├── mapping_complex_table.ts
│   │   └── yellow_events_table.ts
│   ├── world_builder/       # Book 6 tables
│   │   ├── terrain_table.ts
│   │   ├── events_table.ts
│   │   ├── names_table.ts
│   │   ├── quests_table.ts
│   │   ├── quest_rewards_table.ts
│   │   ├── side_quests_table.ts
│   │   ├── settlements_table.ts
│   │   ├── random_treasure_table.ts
│   │   ├── new_items_table.ts
│   │   ├── unique_treasures_table.ts
│   │   └── world_data.ts    # Valoria world map (6 continents)
│   ├── arcanist_spells.ts
│   ├── artisan_tables.ts
│   ├── beast_table.ts
│   ├── combat_experience_table.ts
│   ├── death_kill_table.ts
│   ├── encounters_ea.ts
│   ├── witchery_table.ts
│   ├── campaign_quests.ts   # 20 campaign quests (CQ1–CQ20)
│   ├── side_quests.ts       # 25 side quests (QAA–QAY)
│   └── guilds.ts            # 4 guilds × 5 ranks
│
├── middleware/
│   ├── auth.ts              # JWT Bearer verification
│   ├── adventurer.ts        # Loads GameState from KV into context
│   └── game_logic.ts        # checkDead guard (blocks actions if adventurer dead)
│
└── logic/
    ├── narrator.ts          # LangGraph + Gemini AI dungeon narrator
    └── equipment.ts         # EquipmentManager (equip/unequip logic)
```

---

## Quick Start

### Prerequisites

- Deno 2.0+
- Docker (for ChromaDB)
- A `.env` file with required API keys

### Environment Variables

```
GEMINI_API_KEY=        # Google Gemini API key for the AI narrator
JWT_SECRET=            # Secret for signing JWT tokens
CHROMA_URL=http://localhost:8000  # ChromaDB URL
```

### Run

```bash
# Start ChromaDB + dev server (recommended)
deno task up

# Dev server only (hot-reload)
deno task dev

# Tests
deno task test
```

The server listens on **port 4200**.

### Build the vector store (one-time)

```bash
deno run -A --env-file=.env scripts/build_vector_store.ts
```

---

## Authentication

All routes except `POST /api/v1/auth/register` and `POST /api/v1/auth/login` require a Bearer token.

```
Authorization: Bearer <jwt_token>
```

Tokens are issued on registration and login. They do not expire by default.

### Adventurer selection

Protected routes that operate on an adventurer require the adventurer's UUID in the `X-Adventurer-Id` header:

```
X-Adventurer-Id: <adventurer-uuid>
```

The `loadAdventurer` middleware reads this header, loads the `GameState` from KV, and injects it into the Hono context.

---

## Route Map

| Module | Base Path | Auth Required |
|---|---|---|
| Auth | `/api/v1/auth` | No |
| Character Generation | `/api/v1/chargen` | Yes |
| Adventurer | `/api/v1/adventurer` | Yes |
| Dungeon | `/api/v1/dungeon` | Yes |
| Combat | `/api/v1/combat` | Yes |
| Party | `/api/v1/party` | Yes |
| Downtime | `/api/v1/downtime` | Yes |
| Quests | `/api/v1/quests` | Yes |
| Extra Rules (Bks 4+8) | `/api/v1/extra` | Yes |
| Guilds | `/api/v1/guilds` | Partial |
| World Builder (Bks 6+8) | `/api/v1/worldbuilder` | Yes |
| WebSocket | `/ws/party/:partyId` | No |

Full endpoint documentation: [API Reference](./api-reference.md)

---

## Books Implemented

| Book | Title | Status |
|---|---|---|
| Book 1 | D100 Dungeon (Core) | Complete |
| Book 2 | Adventurer's Companion | Complete |
| Book 4 | Lost Tome of Extraordinary Rules | Complete |
| Book 6 | World Builder | Complete |
| Book 8 | Curious Rules | Complete |

### Book 1 — Core

- Character generation (5-step flow: create → path → race → skills → finalize)
- Dungeon exploration (room rolls, search, time track, upkeep)
- Combat (turn-based, party actions, encounter tables E)
- Downtime (heal, repair, sell, buy, train, magic tuition, empire building)

### Book 2 — Adventurer's Companion

- 9 extended hero paths + 5 extended races
- Encounter table EA with encounter modifier support
- Death & Kill table integration in combat
- Witchery system (brew potions from monster parts)
- Quest Maker procedural generation
- Campaign quests (CQ1–CQ20) + Side quests (QAA–QAY)
- Party play: ganging up (+5 per extra attacker), PASS_ITEM combat action

### Book 4 — Lost Tome of Extraordinary Rules

- Beast Mastery (buy, tame, train, sell, abilities, Dragon Hatchling resurrection)
- Arcanist system (7 orders, 10 ranks, spell learning, Arcane Prism)
- Artisan system (salvage, craft, material conversion, guild storage)
- Combat Experience tracking (kill records → unlockable monster abilities)

### Book 6 — World Builder

- Hex-grid overworld with 10 terrain types
- Calendar + fatigue + rations tracking
- 10 overworld actions (rest, scout, forage, fish, move, cart, ride, etc.)
- World quests (Q1–Q25) + side quests
- Settlement services (13 sub-routes: law, heal, repair, sell, buy, train, etc.)
- Mount system (6 slots, saddlebags, malnutrition, stolen check)
- 60+ world events with chained resolution
- SVG world map (Valoria) + per-continent hex sheet rendering

### Book 8 — Curious Rules

- 13 Phase 3 systems: butchery, dual-wield, weapon proficiency, cheat-death, pursuit, secret passageways, monster variants, honour points, accolades, heroic items, epic dungeon, identify, yellow events
- 5 Phase 4 systems: ammunition pouches, throwing weapons, aimed attacks, equipment mods, spell mana
- 3 World Builder expansions: herbalism, mining, skinning
- 4 Book 8 races: Gnome, Dragon Scar, Half Orc, Wood Elf
