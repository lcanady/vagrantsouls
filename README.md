 _   _  ___  _____ ______  ___   _   _ _____ _____  _____ _   _ _
| | | |/ _ \|  __ \| ___ \/ _ \ | \ | |_   _/  ___||  _  | | | | |
| | | / /_\ \ |  \/| |_/ / /_\ \|  \| | | | \ `--. | | | | | | | |
| | | |  _  | | __ |    /|  _  || . ` | | |  `--. \| | | | | | | |
\ \_/ / | | | |_\ \| |\ \| | | || |\  | | | /\__/ /\ \_/ / |_| | |____
 \___/\_| |_/\____/\_| \_\_| |_/\_| \_/ \_/ \____/  \___/ \___/\_____/

# D100 Dungeon API

A REST API backend for playing [D100 Dungeon](https://www.drivethrurpg.com/product/231010/D100-Dungeon)—the solo dungeon-crawling tabletop RPG—powered by Deno, Hono, and an AI narrator backed by Google Gemini and RAG over the game's rulebook.

Includes a Discord bot companion (`d100-bot/`) for playing directly in Discord.

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Discord Bot](#discord-bot)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Vector Store Setup](#vector-store-setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Key Features

### Core Systems
- **Full Character Generation** — 5-step chargen: name/stats → hero path → race → skill bonuses → finalize with equipment rolls. Supports 12 hero paths and 8 races
- **AI-Powered Narrator** — LangGraph agent backed by Gemini 2.5 Flash generates grimdark room descriptions, with tool-calling access to the rulebook via RAG
- **Dungeon Exploration** — d100 table-driven room generation (Table M + Table EA) with move and search actions
- **Multiplayer Party Combat** — Real-time combat via WebSocket; turn resolution waits for all party members. Supports ganging-up bonus and Pass Item action
- **Downtime System** — Full inter-session economy: healing, item repair, selling, training, magic tuition, empire-building investments, and witchery brewing
- **JWT Authentication** — Scrypt-hashed passwords, JWT-protected routes
- **Deno KV Persistence** — Native key-value store with optimistic concurrency for conflict-safe state updates

### Extended Systems
- **Extended Chargen** — 9 additional hero paths (Knight, Paladin, Assassin, Scoundrel, Warlock, Druid, Barbarian, Hunter, Arcane Wizard), 5 additional races (Halfling, Half Elf, Half Giant, High Elf, Mountain Dwarf), fast-track endpoint
- **EA Encounter Table** — 40 new monsters with special abilities (Allies, Doppelgänger, Frenzy, Leap, Petrify) and the Encounter Rule for out-of-range rolls
- **Death Kill System** — Table K: location-based instant-kill checks when excess damage ≥ 10
- **Witchery** — Brew potions/anointments by combining 3 monster parts; formula learning; Table O effects and mishaps
- **Quest Maker** — Procedural quest generation with objectives, encounter modifiers, and reward/penalty tables
- **Campaign & Side Quests** — All 20 Campaign Quests and 25 Side Quests (Table QA)

### Extraordinary Rules
- **Beast Companions** — Buy, tame, train, and sell beast companions (Table Y). Includes Dragon Hatchling with resurrection mechanic. Beasts participate in combat with abilities and damage deflection
- **Arcanist System** — Join one of 7 Arcane Orders (Alchemy, Elements, Illusion, Invocation, Psyche, Summoning, Esoteric); learn order spells; rank progression; Arcane Law consequences and Arcane Prism survival challenge
- **Artisan's Guild** — Salvage items for materials (Table X1/X2), craft new items (Table X6/X7), convert materials, manage guild storage, and train salvage/crafting/art skills
- **Combat Experience** — Track kill pips per monster type; unlock special combat abilities at tier 10 and tier 20

### Guild System
- 4 persistent guilds: ⚔️ Iron Vanguard, 🔮 Arcane Circle, 🗡️ Shadow Step, 🌙 Silver Wanderers
- 5 ranks per guild; contribution-based standing progression
- Guild events feed (last 20 events per guild)
- Leaderboard across all members

### Discord Bot
- Full Discord interface for all gameplay systems
- Slash commands: `/register`, `/create`, `/enter`, `/status`, `/help`
- Interactive chargen (5-step modal → buttons → select menus)
- Dungeon exploration, combat, and camp (downtime) via button UI

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Deno 2.0 |
| **Web Framework** | Hono 4 |
| **Persistence** | Deno KV (built-in) |
| **AI Orchestration** | LangChain / LangGraph 0.2 |
| **LLM** | Google Gemini 2.5 Flash (`@langchain/google-genai`) |
| **Vector Database** | ChromaDB (Docker) |
| **Embeddings** | `@xenova/transformers` — `all-MiniLM-L6-v2` (local) |
| **Schema Validation** | Zod 3 |
| **Auth** | `djwt` (JWT) + `scrypt` (password hashing) |
| **TUI Client** | React + Ink 5 |
| **Discord Bot** | discord.js v14 (via `npm:` in Deno) |
| **Containerization** | Docker + Docker Compose |

---

## Prerequisites

Before starting, ensure you have:

- **Deno 2.0+** — [Install Deno](https://deno.com/manual/getting_started/installation)
- **Docker & Docker Compose** — Required for ChromaDB (the vector database)
- **Google Gemini API Key** — Free tier available at [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd d100
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and set your API key:

```env
# Required
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional — only if you want to use OpenAI instead of Gemini
# OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Start ChromaDB + Dev Server

After the one-time vector store setup (step 4 below), you can start everything with a single command:

```bash
deno task up
```

This starts ChromaDB in the background via Docker, then launches the Deno dev server with hot-reload.

Or start them separately:

```bash
docker compose up vector-db -d   # ChromaDB only
deno task dev                     # Deno server with hot-reload
```

ChromaDB will be available at `http://localhost:8001`. Verify:

```bash
curl http://localhost:8001/api/v1/heartbeat
# → {"nanosecond heartbeat": ...}
```

### 4. Build the Vector Store (One-Time Setup)

This step reads the rulebook (`books/d100_dungeon_rules.txt`), chunks it by section headers, generates local embeddings using `all-MiniLM-L6-v2`, and indexes everything into ChromaDB. It only needs to be run once.

> The first run downloads the embedding model (~80 MB). Subsequent runs use the cached model.

```bash
deno run -A --env-file=.env scripts/build_vector_store.ts
```

Expected output:

```
Initializing Vector Service...
Collection 'd100-rules' created.
Loading rules...
Created 142 chunks.
Loading Embedding Model (this may take a while first time)...
Generating Embeddings and Indexing...
Indexed batch 1 / 15
...
Done!
```

### 5. Start the Development Server

```bash
deno task dev
```

The server starts with hot-reload on `http://localhost:4200`.

Verify it's running:

```bash
curl http://localhost:4200/
# → {"message":"Welcome to D100 Dungeon API"}
```

---

## Architecture

### Directory Structure

```
d100/
├── server/                      # API server source
│   ├── main.ts                  # Hono app entry point, route mounting
│   ├── state.ts                 # In-memory state helpers
│   ├── repository.ts            # Deno KV persistence layer
│   ├── routes/
│   │   ├── auth.ts              # POST /register, POST /login
│   │   ├── chargen.ts           # 5-step character creation + fast-track
│   │   ├── adventurer.ts        # Adventurer management (equip, inventory)
│   │   ├── dungeon.ts           # Room movement and searching
│   │   ├── combat.ts            # Turn-based combat with WebSocket resolution
│   │   ├── party.ts             # Party creation and management
│   │   ├── downtime.ts          # Between-delve economy actions + witchery
│   │   ├── extrarules.ts        # Extra rules: beast, arcanist, artisan, combat XP
│   │   ├── guilds.ts            # Guild join/leave/contribute/leaderboard
│   │   └── quests.ts            # Campaign quests, side quests, quest maker
│   ├── models/
│   │   ├── adventurer.ts        # Zod schema (includes beast, arcanist, artisan)
│   │   ├── gamestate.ts         # Top-level game state
│   │   ├── item.ts              # Equipment and backpack item schema
│   │   ├── monster.ts           # Monster schema with abilities
│   │   ├── party.ts             # Party schema
│   │   ├── room.ts              # Current room schema
│   │   └── user.ts              # User account schema
│   ├── services/
│   │   ├── AuthService.ts       # JWT generation + scrypt password hashing
│   │   ├── CombatLobby.ts       # Collects party actions, resolves turns
│   │   ├── DowntimeService.ts   # All between-delve economy logic
│   │   ├── EncounterService.ts  # Monster generation (Table E + EA)
│   │   ├── WitcheryService.ts   # Potion brewing, formula learning (Table O)
│   │   ├── QuestMakerService.ts # Procedural quest generation
│   │   ├── BeastService.ts      # Beast companion lifecycle
│   │   ├── ArcanistService.ts   # Arcane order progression
│   │   ├── ArtisanService.ts    # Salvage, craft, convert materials
│   │   ├── CombatExperienceService.ts # Kill tracking + ability unlocks
│   │   ├── GuildService.ts      # Guild membership and standing
│   │   ├── PartyService.ts      # Party CRUD helpers
│   │   ├── VectorService.ts     # ChromaDB client + embedding generation
│   │   ├── WebSocketService.ts  # Broadcasts events to party connections
│   │   ├── dice.ts              # Dice roll utilities
│   │   ├── instances.ts         # Singleton service instances
│   │   ├── table_service.ts     # D100 table lookups (rooms, encounters, loot)
│   │   └── time.ts              # Time track management and upkeep
│   ├── data/
│   │   ├── encounters_ea.ts     # Table EA — 40 new monsters
│   │   ├── death_kill_table.ts  # Table K — location-based instant kills
│   │   ├── witchery_table.ts    # Table O — 25 potion effects + 25 mishaps
│   │   ├── beast_table.ts       # Table Y — 20 beast types
│   │   ├── arcanist_spells.ts   # SA1–SA6 order spell tables
│   │   ├── artisan_tables.ts    # X1/X2 salvage, X6/X7 craft tables
│   │   ├── combat_experience_table.ts # 12 monster entries + tier abilities
│   │   ├── guilds.ts            # 4 guild definitions, 5 ranks each
│   │   ├── campaign_quests.ts   # 20 campaign quests
│   │   └── side_quests.ts       # 25 side quests (Table QA)
│   ├── logic/
│   │   ├── narrator.ts          # LangGraph AI narrator agent
│   │   └── equipment.ts         # Equipment management logic
│   └── middleware/
│       ├── auth.ts              # JWT validation middleware
│       ├── adventurer.ts        # Loads adventurer state from KV into context
│       └── game_logic.ts        # Checks for dead adventurer
│
├── d100-bot/                    # Discord bot (separate Deno project)
│   ├── deno.json
│   └── src/
│       ├── index.ts             # Bot entry point
│       ├── commands/            # Slash command definitions
│       ├── interactions/        # Button/modal/select handlers
│       ├── api/                 # HTTP client wrappers for the API
│       ├── db/                  # Deno KV account store
│       ├── embeds/              # Discord embed builders
│       └── tests/               # Bot test suite (112 tests)
│
├── scripts/
│   ├── build_vector_store.ts    # Indexes rulebook into ChromaDB
│   └── parse_tables.ts          # Parses raw table data
├── books/                       # Source rulebook text files
├── data/
│   └── tables.json              # Parsed game tables (rooms, encounters, etc.)
├── tests/                       # API server test suite (197 tests)
├── .env.example
├── deno.json                    # Task definitions and import map
├── docker-compose.yml           # ChromaDB service
└── Dockerfile                   # Production container for the API
```

### Request Lifecycle

```
HTTP Request
    ↓
Hono Router (server/main.ts)
    ↓
Repository Middleware → injects Deno KV repository into context
    ↓
Auth Middleware → validates JWT, injects user into context
    ↓
Adventurer Middleware → loads GameState from KV into context
    ↓
Route Handler → business logic
    ↓
Repository → saves updated GameState to Deno KV
    ↓
JSON Response
```

### AI Narrator Data Flow

When a player moves to a new room:

```
POST /api/v1/dungeon/move
    ↓
Roll d100 → table_service.getTableM(roll) → RoomData {color, exits, features}
    ↓
narratorGraph.invoke({room: roomData})
    ↓
  [LangGraph: narrator node]
  Gemini 2.5 Flash — given room JSON + system prompt
    ↓  (if feature is unclear)
  [LangGraph: tools node]
  query_rules("altar of bone")
    ↓
  VectorService.queryText("d100-rules", query)
    ↓
  ChromaDB — nearest-neighbor search over embedded rulebook chunks
    ↓
  Returns relevant rules text back to Gemini
    ↓
  [LangGraph: narrator node again]
  Gemini generates final grimdark prose
    ↓
Narrative string returned in response
```

### Combat Flow (Multiplayer)

```
POST /combat/start  →  monster generated (Table E or EA), stored in CombatLobby
GET  /ws/party/:id  →  each player opens WebSocket connection

Each player:
  POST /combat/attack  →  action queued in CombatLobby
                          (ganging-up bonus: +5 per extra attacker on same target)

When all party members have submitted:
  CombatLobby.resolveTurn() → damage/effects calculated, Death Kill checked
  WebSocketService.broadcast() → TURN_RESOLUTION event to all clients
```

### Persistence (Deno KV)

Key schema:

```
["adventurers", adventurerId]                        → GameState
["users", username]                                  → User
["users", userId, "adventurers", adventurerId]       → adventurerId (index)
["guild_members", guildId, adventurerId]             → GuildMembership
["guild_events", guildId]                            → GuildEvent[] (capped at 20)
```

Optimistic concurrency control is used in `Repository.processTurn()`: the current state's versionstamp is checked atomically before committing, preventing race conditions in multiplayer turns.

### Adventurer Model

An adventurer tracks:

| Category | Fields |
|----------|--------|
| **Identity** | `id`, `userId`, `name`, `path`, `race` |
| **Combat Stats** | `hp`, `maxHp`, `str`, `dex`, `int` |
| **Meta-Resources** | `fate`, `life`, `experiencePips`, `reputation` |
| **Consumables** | `gold`, `oil`, `food`, `picks` |
| **Equipment Slots** | `head`, `torso`, `back`, `mainHand`, `offHand`, `belt1`, `belt2` |
| **Inventory** | `backpack[]` |
| **Skills** | `skills: Record<string, number>` |
| **Spells** | `spells: Record<string, number>` |
| **Status Effects** | `poison`, `disease`, `darkness`, `starvation` |
| **Investments** | `investments: Record<string, {shares, pips}>` |
| **Witchery** | `witcheryFormulas`, `witcheryEffects`, `witcheryMishaps`, `monsterParts` |
| **Beast** | `beast` (nullable) |
| **Arcanist** | `arcanist` (nullable) |
| **Artisan** | `artisan` (nullable) |
| **Combat XP** | `combatExperience: Record<string, {pips, kills}>` |
| **Quests** | `campaignQuests`, `sideQuests` |
| **Property** | `property` (nullable) |

---

## API Reference

All protected routes require a `Bearer` token in the `Authorization` header.

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/register` | No | Register a new user account |
| `POST` | `/api/v1/auth/login` | No | Login and receive a JWT |

**Request body:**
```json
{ "username": "skullcrusher", "password": "darkdungeon42" }
```

**Response:**
```json
{
  "token": "eyJ...",
  "user": { "id": "uuid", "username": "skullcrusher" }
}
```

---

### Character Generation (`/api/v1/chargen`)

Character creation is a 5-step sequential process. Each step uses the adventurer `id` returned from step 1.

#### Step 1 — Create

`POST /api/v1/chargen/create` — Stats must be a permutation of `[50, 40, 30]`.

```json
{ "name": "Theron", "str": 50, "dex": 40, "int": 30 }
```

#### Step 2 — Hero Path

`POST /api/v1/chargen/path`

**Paths:** `Warrior`, `Rogue`, `Sorcerer`, `Knight`, `Paladin`, `Assassin`, `Scoundrel`, `Warlock`, `Druid`, `Barbarian`, `Hunter`, `Arcane Wizard`

```json
{ "id": "uuid", "path": "Warrior" }
```

#### Step 3 — Race

`POST /api/v1/chargen/race`

**Races:** `Human`, `Elf`, `Dwarf`, `Halfling`, `Half Elf`, `Half Giant`, `High Elf`, `Mountain Dwarf`

```json
{ "id": "uuid", "race": "Dwarf" }
```

#### Step 4 — Skill Bonuses

`POST /api/v1/chargen/skills` — Choose exactly 2 skills for +5 each.

```json
{ "id": "uuid", "skills": ["Strong", "Dodge"] }
```

#### Step 5 — Finalize

`POST /api/v1/chargen/finalize` — Rolls starting equipment and sets final stats.

```json
{ "id": "uuid" }
```

#### Other

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/chargen/list` | List all adventurers for current user |
| `GET` | `/api/v1/chargen/options` | List all available paths and races |
| `POST` | `/api/v1/chargen/fast-track` | Apply fast-track advancement |

---

### Dungeon Exploration (`/api/v1/dungeon`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/dungeon/move` | Roll d100 room table, advance time, invoke AI narrator |
| `POST` | `/api/v1/dungeon/search` | Search current room (once per room) |

**Move response:**
```json
{
  "timeTrack": 3,
  "roll": 47,
  "room": { "roll": 47, "color": "Green", "exits": 3, "features": ["Altar"], "searched": false },
  "narrative": "The passage opens into a chamber slicked with something that was once water...",
  "upkeepReport": { "messages": ["Food consumed."], "effects": [] }
}
```

---

### Combat (`/api/v1/combat`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/combat/start` | Generate monster, open combat lobby |
| `POST` | `/api/v1/combat/attack` | Submit attack action |
| `POST` | `/api/v1/combat/defend` | Submit defend action |
| `POST` | `/api/v1/combat/flee` | Attempt to flee |
| `POST` | `/api/v1/combat/pass-item` | Pass item to a party member |
| `GET`  | `/ws/party/:partyId` | WebSocket for real-time combat events |

Combat supports `table: "E" | "EA"` to select the encounter table, and `encounterModifier` for the Encounter Rule.

---

### Downtime (`/api/v1/downtime`)

| Endpoint | Description | Body |
|----------|-------------|------|
| `POST /refresh` | Reset time track and upkeep effects | `{}` |
| `POST /heal` | Restore HP | `{ "amount": 4 }` |
| `POST /repair` | Remove damage pips from an item | `{ "itemId": "uuid", "pips": 2 }` |
| `POST /sell` | Sell an item for gold | `{ "itemId": "uuid" }` |
| `POST /buy-needed` | Buy a specific item by name | `{ "itemName": "Torch" }` |
| `POST /search-market` | Roll for a market item (Table A or W) | `{ "table": "A", "roll": 42 }` |
| `POST /train` | Spend pips to train a skill or stat | `{ "target": "Strong", "pips": 3 }` |
| `POST /magic-tuition` | Spend pips to advance a spell | `{ "spellName": "Fireball", "pips": 2 }` |
| `POST /empire-building` | Process investment rolls | `{ "Tavern": 55, "Mine": 32 }` |
| `POST /witchery` | Brew a potion from 3 monster parts | `{ "parts": ["p1","p2","p3"], "roll": 42, "tableRoll": 17 }` |
| `POST /witchery/clear` | Clear active witchery effects | `{}` |

---

### Quests (`/api/v1/quests`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/quests/generate` | Generate a procedural quest (Quest Maker) |
| `GET`  | `/api/v1/quests/campaign` | List all 20 campaign quests |
| `GET`  | `/api/v1/quests/campaign/:id` | Get a specific campaign quest |
| `POST` | `/api/v1/quests/campaign/:id/complete` | Mark campaign quest complete or failed |
| `GET`  | `/api/v1/quests/side` | List all 25 side quests |
| `GET`  | `/api/v1/quests/side/roll` | Roll d100 for a random side quest |

---

### Extra Rules (`/api/v1/extra/:adventurerId`)

#### Beast Companion

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/beast/buy` | Acquire beast from Table Y | `{ "roll": 42 }` |
| `POST` | `/beast/tame` | Tame a wild monster | `{ "monsterName": "Wolf", "roll": 55 }` |
| `POST` | `/beast/train` | Train beast (gain pips, level up) | `{ "roll": 70 }` |
| `POST` | `/beast/sell` | Sell beast for gold | |
| `POST` | `/beast/ability` | Use a beast ability in combat | `{ "ability": "Bite", "usesThisQuest": 1 }` |
| `POST` | `/beast/deflect` | Beast intercepts incoming damage | `{ "incomingDamage": 8 }` |
| `POST` | `/beast/resurrect` | Resurrect Dragon Hatchling (uses a heart) | |

#### Arcanist

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/arcanist/become` | Join an Arcane Order | `{ "order": "Alchemy" }` |
| `POST` | `/arcanist/learn` | Learn a spell from order table | `{ "spellTableRoll": 42 }` |
| `POST` | `/arcanist/donate` | Make a donation to the order | |
| `POST` | `/arcanist/conceal` | Conceal an arcane law violation | `{ "roll": 55 }` |
| `POST` | `/arcanist/prism` | Survive the Arcane Prism | `{ "strRoll": 40, "dexRoll": 55, "intRoll": 70 }` |

#### Artisan

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/artisan/unlock` | Pay guild membership (300 GP) | |
| `POST` | `/artisan/salvage` | Salvage item for materials | `{ "itemName": "Sword", "roll": 42 }` |
| `POST` | `/artisan/craft` | Craft an item | `{ "itemName": "Shield", "roll": 55 }` |
| `POST` | `/artisan/convert` | Convert materials between tiers | `{ "from": "Iron", "to": "Steel", "quantity": 3 }` |
| `POST` | `/artisan/storage` | Pay guild storage fee | |
| `POST` | `/artisan/train` | Train a skill at the guild | `{ "type": "Salvage", "contactsUsed": 2 }` |

#### Combat Experience

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/combat-xp` | Get full combat XP status |
| `POST` | `/combat-xp/kill` | Record a monster kill | `{ "monsterName": "Goblin" }` |
| `GET`  | `/combat-xp/:monsterName` | Get XP stats for a specific monster |

---

### Guilds (`/api/v1/guild`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/guild/:guildId/join` | Join a guild |
| `POST` | `/api/v1/guild/:guildId/leave` | Leave a guild |
| `POST` | `/api/v1/guild/:guildId/contribute` | Contribute gold to raise standing |
| `GET`  | `/api/v1/guild/:guildId/status` | Get membership status and rank |
| `GET`  | `/api/v1/guild/:guildId/leaderboard` | Guild leaderboard |
| `GET`  | `/api/v1/guild/:guildId/events` | Last 20 guild events feed |

**Guild IDs:** `iron-vanguard`, `arcane-circle`, `shadow-step`, `silver-wanderers`

---

## Discord Bot

The Discord bot (`d100-bot/`) provides a full Discord interface for playing D100 Dungeon.

### Setup

```bash
cd d100-bot
cp .env.example .env
# Fill in DISCORD_TOKEN, CLIENT_ID, GUILD_ID, API_URL
```

### Commands

```bash
deno task dev     # Start bot with hot-reload
deno task deploy  # Register slash commands with Discord
deno task test    # Run bot test suite
```

### Slash Commands

| Command | Description |
|---------|-------------|
| `/register` | Create a user account |
| `/create` | Create an adventurer (5-step interactive flow) |
| `/enter` | Enter the dungeon |
| `/status` | View adventurer stats |
| `/help` | Show command list |

### Gameplay Flow

After `/enter`, all gameplay is driven by Discord buttons and select menus:

- **Dungeon:** Move, Search, Make Camp buttons on room card
- **Camp:** Full downtime hub — Heal, Repair, Trade, Train, Empire, Witchery, Beast, Arcanist, Artisan
- **Combat:** Attack, Defend, Flee buttons; Beast ability row when applicable

---

## Available Scripts

All commands run from the project root.

### API Server

| Command | Description |
|---------|-------------|
| `deno task up` | Start ChromaDB (Docker) + API dev server in one step |
| `deno task dev` | API dev server with hot-reload |
| `deno task start` | Start the production API server (port 4200) |
| `deno task check` | Type-check `server/main.ts` |
| `deno task test` | Run the full API test suite (197 tests) |
| `deno task test:watch` | Run API tests in watch mode |
| `deno task play` | Run `play.ts` terminal client |
| `deno task play-ink` | Run the Ink TUI client (`server/ink_play.tsx`) |

### Discord Bot

| Command | Description |
|---------|-------------|
| `deno task bot:dev` | Bot dev server with hot-reload |
| `deno task bot:start` | Start the production bot |
| `deno task bot:deploy` | Register slash commands with Discord |
| `deno task bot:test` | Run the bot test suite |

### Docker (full stack)

| Command | Description |
|---------|-------------|
| `deno task docker:up` | Build and start API + bot + ChromaDB |
| `deno task docker:down` | Stop all services |
| `deno task docker:logs` | Tail logs for all services |

**One-off scripts:**

```bash
# Build the ChromaDB vector store (required first-time setup)
deno run -A --env-file=.env scripts/build_vector_store.ts

# Parse raw table data
deno run -A scripts/parse_tables.ts
```

---

## Environment Variables

| Variable | Required | Description | How to Get |
|----------|----------|-------------|------------|
| `GOOGLE_API_KEY` | Yes | Google Gemini API key for the AI narrator | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `OPENAI_API_KEY` | No | OpenAI key if switching LLM providers | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `CHROMA_URL` | No | ChromaDB base URL | Defaults to `http://localhost:8001` |

The `GOOGLE_API_KEY` is the only required variable. Without it, dungeon move actions return a narrator error but otherwise continue to function.

The Discord bot has its own `.env` at `d100-bot/.env` — see `d100-bot/.env.example`.

---

## Vector Store Setup

The AI narrator uses RAG (Retrieval-Augmented Generation) to look up the D100 Dungeon rulebook when generating room descriptions.

### How it Works

1. `scripts/build_vector_store.ts` reads `books/d100_dungeon_rules.txt`
2. The text is chunked by all-caps section headers (e.g., `COMBAT`, `SEARCHING ROOMS`)
3. Each chunk is embedded locally using `Xenova/all-MiniLM-L6-v2` (80 MB, downloaded on first run)
4. Embeddings + text are stored in ChromaDB under the collection `d100-rules`
5. During gameplay, when the narrator encounters an unfamiliar room feature, it calls `query_rules` which performs a semantic search over this collection

### Running the Setup

```bash
# 1. Start ChromaDB first
docker compose up vector-db -d

# 2. Build the vector store
deno run -A --env-file=.env scripts/build_vector_store.ts
```

This only needs to be run once. If you update the rulebook text, re-run the script to re-index.

---

## Testing

### Run Tests

```bash
# Run all tests (197 tests)
deno task test

# Watch mode
deno task test:watch

# Run a specific test file
deno test -A --unstable-kv --env-file=.env tests/engine_test.ts

# Run tests matching a name pattern
deno test -A --unstable-kv --env-file=.env --filter "combat"
```

### Test Files

```
tests/
├── auth_test.ts                  # Authentication: register, login, JWT validation
├── engine_test.ts                # Core game engine (dice, table lookups)
├── equipment_test.ts             # Item equipping and inventory management
├── encounter_service_test.ts     # Monster generation (Table E + EA)
├── death_kill_test.ts            # Table K death kill logic
├── witchery_service_test.ts      # Witchery brewing and formulas
├── quest_maker_service_test.ts   # Procedural quest generation
├── quest_data_test.ts            # Campaign and side quest data integrity
├── quests_api_test.ts            # Quest API endpoints
├── beast_service_test.ts         # Beast companion system
├── arcanist_service_test.ts      # Arcanist order progression
├── artisan_service_test.ts       # Artisan salvage/craft/convert
├── combat_experience_test.ts     # Kill tracking + ability unlocks
├── guild_test.ts                 # Guild membership and standing
├── downtime_test.ts              # Downtime activity logic
├── game_loop_test.ts             # Full game loop integration
├── chargen_verify.ts             # Character generation verification
├── game_flow_verify_multi.ts     # Multiplayer flow verification
├── coop_scenario.ts              # Cooperative party scenarios
├── vector_service_test.ts        # ChromaDB integration
└── services/
    └── time_service_test.ts      # Time track and upkeep logic
```

---

## Deployment

### Docker Compose (Full Stack)

```bash
# Build and start everything
docker compose up --build

# Detached mode
docker compose up --build -d

# View logs
docker compose logs -f app

# Stop everything
docker compose down
```

The API is exposed on port `4200`. ChromaDB is exposed on host port `8001` (internal port `8000`).

### Running with Docker Manually

```bash
docker build -t d100-api .

docker run -p 4200:4200 \
  -e GOOGLE_API_KEY=your_key_here \
  -e CHROMA_URL=http://your-chroma-host:8000 \
  d100-api
```

### Manual / VPS Deployment

```bash
curl -fsSL https://deno.land/install.sh | sh
git clone <repo-url> && cd d100
cp .env.example .env

docker run -d --name chroma -p 8001:8000 chromadb/chroma:latest
deno run -A --env-file=.env scripts/build_vector_store.ts
deno task start
```

To keep the process alive with systemd:

```ini
# /etc/systemd/system/d100.service
[Unit]
Description=D100 Dungeon API
After=network.target

[Service]
WorkingDirectory=/opt/d100
EnvironmentFile=/opt/d100/.env
ExecStart=/root/.deno/bin/deno task start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable d100
sudo systemctl start d100
```

---

## Troubleshooting

### ChromaDB Not Running

**Error:** `Failed to create collection: fetch failed`

```bash
docker compose up vector-db -d
curl http://localhost:8001/api/v1/heartbeat
```

### Narrator Returns Error

**Response includes:** `"The shadows deepen. (Narrator Error)"`

1. **Missing API key** — Check `GOOGLE_API_KEY` is set in `.env`
2. **ChromaDB not running** — The `query_rules` tool call will fail; start ChromaDB
3. **Vector store not built** — Run `build_vector_store.ts`

### Embedding Model Download Hangs

The first run of `build_vector_store.ts` downloads `Xenova/all-MiniLM-L6-v2` (~80 MB). If it appears stuck, check your connection. The model is cached in `~/.cache/huggingface/` on subsequent runs.

### Deno KV Errors (Unstable)

**Error:** `--unstable-kv flag required`

The task definitions in `deno.json` already include `--unstable-kv`. If running commands manually, add the flag:

```bash
deno run -A --unstable-kv --env-file=.env server/main.ts
```

### JWT Token Expired / Invalid

**Error:** `401 Unauthorized` on protected routes

```bash
curl -X POST http://localhost:4200/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your_user", "password": "your_pass"}'
```

### State Conflict Error (Multiplayer)

**Error:** `"State conflict: The adventurer state has changed in the background."`

This is the optimistic concurrency control firing — two requests tried to update the same adventurer simultaneously. Simply retry the request.

### Port Already in Use

**Error:** `error: Uncaught (in promise) Error: address already in use`

```bash
lsof -ti:4200 | xargs kill -9

# Or change the port in server/main.ts:
# Deno.serve({ port: 4201 }, app.fetch);
```
