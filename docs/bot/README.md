# VagrantSoul Discord Bot

> A Discord bot that wraps the D100 Dungeon API into an interactive slash-command + button experience.

---

## Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Configuration](#configuration)
- [Quick Start](#quick-start)
- [Slash Commands](#slash-commands)
- [Interaction Architecture](#interaction-architecture)
- [Character Creation Flow](#character-creation-flow)
- [Dungeon Flow](#dungeon-flow)
- [Camp System](#camp-system)
- [Combat Flow](#combat-flow)
- [Session Management](#session-management)
- [Account Store](#account-store)
- [API Client Layer](#api-client-layer)
- [ID Reference](#id-reference)
- [Styling Constants](#styling-constants)
- [Deployment](#deployment)

---

## Overview

The bot provides a fully interactive Discord UI for playing D100 Dungeon. Players never need to call the API directly — all game actions are exposed as slash commands, buttons, modals, and select menus.

Key design decisions:

- **Ephemeral-first** — most responses are ephemeral (visible only to the player) to keep channels clean.
- **Edit-in-place** — messages are edited rather than re-sent to avoid chat spam. `deferUpdate()` + `editReply()` is the standard pattern.
- **Caller-supplied rolls** — where the API requires dice rolls in the body, the bot either rolls server-side or collects them via modal inputs.
- **Two adventurer IDs** — the bot maintains `kvAdventurerId` (for API headers) and `stateAdventurerId` (party leader ID, used in combat request bodies). See [Session Management](#session-management).

---

## Tech Stack

| Component | Technology |
|---|---|
| Runtime | Deno 2.0 |
| Discord Library | discord.js v14 (via `npm:` specifier) |
| Persistence | Deno KV (`d100-bot.db`) |
| API Communication | Fetch (native) |

---

## Directory Structure

```
d100-bot/
├── src/
│   ├── index.ts                    # Bot entry point + interaction router
│   ├── deploy-commands.ts          # Slash command registration script
│   ├── constants.ts                # Colors, emoji constants
│   │
│   ├── api/                        # Typed API client wrappers
│   │   ├── client.ts               # Base fetch wrapper
│   │   ├── auth.ts                 # Register + login
│   │   ├── chargen.ts              # Chargen steps 1-5 + fast-track
│   │   ├── adventurer.ts           # Get adventurer, equip/unequip
│   │   ├── party.ts                # Create / join party
│   │   ├── dungeon.ts              # Move + search
│   │   ├── combat.ts               # Attack, defend, flee, pass-item
│   │   ├── downtime.ts             # Heal, repair, sell, buy, train, etc.
│   │   └── extrarules.ts           # Beast, Arcanist, Artisan APIs
│   │
│   ├── commands/                   # Slash command definitions + handlers
│   │   ├── register.ts             # /register
│   │   ├── create.ts               # /create
│   │   ├── enter.ts                # /enter
│   │   ├── status.ts               # /status
│   │   ├── help.ts                 # /help
│   │   ├── inventory.ts            # /inventory
│   │   ├── quests.ts               # /quests
│   │   ├── worldbuilder.ts         # /worldbuilder
│   │   └── charsheet.ts            # /charsheet
│   │
│   ├── interactions/               # Button / modal / select handlers
│   │   ├── chargen/
│   │   │   ├── step1-modal.ts      # modal:chargen_step1
│   │   │   ├── step2-path.ts       # chargen:path:* buttons
│   │   │   ├── step3-race.ts       # chargen:race:* buttons
│   │   │   ├── step4-skills.ts     # chargen:skills select menu
│   │   │   └── step5-finalize.ts   # chargen:finalize button
│   │   ├── dungeon/
│   │   │   ├── move.ts             # dungeon:move
│   │   │   ├── search.ts           # dungeon:search
│   │   │   ├── camp.ts             # dungeon:camp → camp menu
│   │   │   └── camp/
│   │   │       ├── heal.ts         # camp:heal + camp:heal:submit
│   │   │       ├── repair.ts       # camp:repair + camp:repair:submit
│   │   │       ├── trade.ts        # camp:trade sub-menu + 3 modals
│   │   │       ├── train.ts        # camp:train + camp:train:submit
│   │   │       ├── empire.ts       # camp:empire + camp:empire:submit
│   │   │       ├── witchery.ts     # camp:witchery sub-menu + brew modal + clear
│   │   │       ├── beast.ts        # camp:beast sub-menu + modals
│   │   │       ├── arcanist.ts     # camp:arcanist sub-menu + modals
│   │   │       └── artisan.ts      # camp:artisan sub-menu + modals
│   │   └── combat/
│   │       ├── attack.ts           # combat:attack:rHand / lHand
│   │       ├── defend.ts           # combat:defend
│   │       └── flee.ts             # combat:flee
│   │
│   ├── embeds/                     # Discord embed builders
│   │   ├── chargen.ts
│   │   ├── status.ts
│   │   ├── charsheet.ts
│   │   ├── room.ts
│   │   ├── camp.ts
│   │   ├── combat.ts
│   │   ├── inventory.ts
│   │   ├── questlog.ts
│   │   ├── worldbuilder.ts
│   │   └── error.ts
│   │
│   ├── db/
│   │   └── store.ts                # Deno KV account CRUD
│   │
│   └── utils/
│       └── logo.ts                 # Bot logo attachment helper
│
├── deno.json                       # Tasks + import map
├── .env.example
└── Dockerfile
```

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Yes | Application ID |
| `DISCORD_GUILD_ID` | No | Dev guild for instant command registration |
| `D100_API_URL` | Yes | Backend URL (e.g. `http://localhost:4200`) |
| `FEED_CHANNEL_ID` | No | Channel for adventure feed posts |
| `FALLEN_CHANNEL_ID` | No | Channel for death notifications |
| `DUNGEON_ACCESS_CHANNEL_ID` | No | Channel ID that restricts dungeon access |

Copy `.env.example` to `.env` and fill in values before running.

### deno.json Tasks

```bash
deno task dev      # hot-reload dev server
deno task start    # production start
deno task deploy   # register slash commands with Discord
deno task test     # run tests
```

---

## Quick Start

```bash
# 1. Copy env
cp .env.example .env
# (edit .env with your token, client ID, API URL)

# 2. Register slash commands (once per config change)
deno task deploy

# 3. Start the bot
deno task dev
```

The bot only needs to restart if you add new slash commands. Button/modal handlers take effect immediately on restart.

---

## Slash Commands

| Command | Auth | Description |
|---|---|---|
| `/register` | None | Create a D100 account linked to your Discord ID |
| `/create` | Account | Open the 5-step character creation wizard |
| `/enter` | Account + Adventurer | Enter the dungeon (starts session) |
| `/status` | Account + Adventurer | Quick vitals: HP, stats, gold, oil, food |
| `/charsheet` | Account + Adventurer | Full character sheet (stats, skills, spells, beast, artisan, arcanist) |
| `/inventory` | Account + Adventurer | Equipment slots + backpack contents |
| `/quests` | Account + Adventurer | Active quest log |
| `/worldbuilder` | Account + Adventurer | World Builder summary: hex, calendar, mounts |
| `/help` | None | Command reference and feature overview |

All commands check for an account in KV first. Commands that need an adventurer check `account.adventurer_id`. If missing, they prompt the user to `/create` first.

---

## Interaction Architecture

The main router in `src/index.ts` handles four interaction types:

```
Interaction received
    │
    ├── isChatInputCommand()  → commands/{name}.ts
    │
    ├── isModalSubmit()       → interactions/.../handler.ts  (by customId)
    │
    ├── isButton()            → interactions/.../handler.ts  (by customId prefix)
    │
    └── isStringSelectMenu()  → interactions/.../handler.ts  (by customId)
```

### Standard Handler Pattern

```ts
// Button → Modal → API → Edit reply
interaction.isButton()
  → deferUpdate() or showModal()

interaction.isModalSubmit()
  → deferUpdate()
  → API call
  → editReply({ embeds: [...], components: [...] })
```

**Direct actions** (no modal needed): `deferUpdate()` → API → `editReply()`.
**Sub-menus**: `deferUpdate()` → `editReply()` with new action button rows + Back button.
**Modal-triggering buttons**: `showModal(modal)` (no deferral).

### Error Pattern

```ts
try {
  await interaction.deferUpdate();
  const result = await apiCall(...);
  await interaction.editReply({ ... });
} catch (e) {
  const errMsg = e instanceof Error ? e.message : String(e);
  if (interaction.deferred) {
    await interaction.editReply({ embeds: [errorEmbed(errMsg)] });
  } else if (!interaction.replied) {
    await interaction.reply({ embeds: [errorEmbed(errMsg)], ephemeral: true });
  }
}
```

---

## Character Creation Flow

Character creation is a guided 5-step wizard started by `/create`. State is stored in an in-memory `chargenSessions` map keyed by Discord user ID.

```
/create
  │
  └─ Step 1: showModal("modal:chargen_step1")
       Name, STR, DEX, INT inputs
       → POST /api/v1/chargen/create
       → Save chargenSession { chargenId, step: 2, adventurer }
       → Show path selection buttons (4 per row)

  chargen:path:{PATH} button
       → POST /api/v1/chargen/path
       → Update session step: 3
       → Show race selection buttons

  chargen:race:{RACE} button
       → POST /api/v1/chargen/race
       → Update session step: 4
       → Show skills select menu (choose exactly 2)

  chargen:skills select menu
       → POST /api/v1/chargen/skills
       → Update session step: 5
       → Show finalize button with preview

  chargen:finalize button
       → POST /api/v1/chargen/finalize
       → KV: setAdventurerId(discordId, adventurer.id)
       → Clear chargenSession
       → Show "Ready for adventure! Use /enter" embed
```

### ChargenSession Shape

```ts
interface ChargenSession {
  chargenId: string;           // adventurer UUID from /chargen/create
  step: number;                // 1–5
  adventurer: Adventurer;      // partial adventurer (fills in as steps complete)
}
```

---

## Dungeon Flow

```
/enter
  │
  ├─ POST /api/v1/party/create      → gets partyId + stateAdventurerId
  ├─ POST /api/v1/dungeon/move      → gets first room
  └─ Save DungeonSession + show room embed with buttons
       [Move Forward] [Search Room] [Make Camp]

dungeon:move button
  ├─ deferUpdate()
  ├─ POST /api/v1/dungeon/move
  ├─ Update session lastRoom
  └─ editReply → room embed
       [Move Forward] [Search Room*] [Make Camp]
       (* Search disabled if room.searched = true)

dungeon:search button (disabled after use)
  ├─ deferUpdate()
  ├─ POST /api/v1/dungeon/search
  ├─ session.roomSearched = true (disables search button)
  └─ editReply → search result embed + dungeon buttons

dungeon:camp button
  ├─ deferUpdate()
  └─ editReply → camp menu embed
       [Heal] [Repair] [Trade]
       [Train] [Empire] [Witchery*]
       [Beast] [Arcanist] [Artisan]
       [← Continue Delving]
       (* Witchery shown only if path is Druid/Warlock OR witcheryFormulas non-empty)
```

### Room Embed Data

| Field | Source |
|---|---|
| Room color | `room.color` (Green/Blue/Red/Yellow) |
| Roll | `room.roll` (1–100) |
| Exits | `room.exits` |
| Features | `room.features` array |
| Narrative | AI-generated dungeon description |
| Time track | `timeTrack` (0–20 pips) |
| Upkeep messages | `upkeepReport.messages` |

Embed color matches the room color constant.

### LastRoom Interface

```ts
interface LastRoom {
  roll: number;
  color: string;
  exits: number;
  searched: boolean;
  narrative: string;
  timeTrack?: { day: number; phase: string };
  upkeepMessages?: string[];
}
```

Stored in `DungeonSession.lastRoom`. The **camp:back** button restores the dungeon view from this snapshot.

---

## Camp System

The camp menu is accessed via `dungeon:camp`. It provides all downtime actions between dungeon runs.

### Camp Menu Layout

| Row | Buttons |
|---|---|
| 1 | Heal · Repair · Trade |
| 2 | Train · Empire · Witchery (conditional) |
| 3 | Beast · Arcanist · Artisan |
| 4 | ← Continue Delving |

**Witchery visibility gate:** shown if `adv.path === "Druid" || adv.path === "Warlock"` OR `Object.keys(adv.witcheryFormulas ?? {}).length > 0`.

---

### Heal — `camp:heal`

```
camp:heal → showModal
  Modal: "Amount to heal" (integer)
  → POST /api/v1/downtime/heal  { amount }
  → editReply: result embed + Back-to-Camp button
```

---

### Repair — `camp:repair`

```
camp:repair → showModal
  Modal: "Item ID" + "Repair pips"
  → POST /api/v1/downtime/repair  { itemId, pips }
  → editReply: result + Back-to-Camp
```

---

### Trade — `camp:trade`

Sub-menu with 3 options:

```
camp:trade → editReply with sub-buttons
  [Sell Item] [Buy Needed Item] [Search Market] [← Back to Camp]

camp:trade:sell → showModal
  Modal: "Item ID"
  → POST /api/v1/downtime/sell  { itemId }

camp:trade:buy → showModal
  Modal: "Item name"
  → POST /api/v1/downtime/buy-needed  { itemName }

camp:trade:market → showModal
  Modal: "Table (A/W)" + "Roll (1-100)"
  → POST /api/v1/downtime/search-market  { table, roll }
```

---

### Train — `camp:train`

```
camp:train → showModal
  Modal: "Target (e.g. str, Bravery)" + "Pips to spend"
  → POST /api/v1/downtime/train  { target, pips }
```

---

### Empire Building — `camp:empire`

```
camp:empire → showModal
  Modal: "Investment type" + "Gold amount"
  → POST /api/v1/downtime/empire-building  { [type]: goldAmount }
```

---

### Witchery — `camp:witchery`

```
camp:witchery → editReply with sub-buttons
  [Brew Potion] [Clear Effects] [← Back to Camp]

camp:witchery:brew → showModal
  Modal fields:
    part1, part2, part3  (monster part names)
    roll                 (d100)
    tableRoll            (d100)
  → POST /api/v1/downtime/witchery  { parts: [p1,p2,p3], roll, tableRoll }

camp:witchery:clear → deferUpdate (no modal)
  → POST /api/v1/downtime/witchery/clear
```

---

### Beast Companion — `camp:beast`

Displays current beast status (or "No beast companion" if none).

```
camp:beast → editReply: beast status + sub-buttons
  [Buy Beast*] [Tame Monster] [Train Beast*] [Sell Beast*] [Resurrect Dragon*]
  [← Back to Camp]
  (* conditional: disabled if conditions not met)

camp:beast:buy → showModal
  Modal: "Roll (1–100)"
  → POST /api/v1/extra/:id/beast/buy  { roll }

camp:beast:tame → showModal
  Modal: "Monster name" + "Roll (1–100)"
  → POST /api/v1/extra/:id/beast/tame  { monsterName, roll }

camp:beast:train → showModal  (disabled if beast dead or null)
  Modal: "Roll (1–100)"
  → POST /api/v1/extra/:id/beast/train  { roll }

camp:beast:sell → deferUpdate (no modal)
  → POST /api/v1/extra/:id/beast/sell

camp:beast:resurrect → deferUpdate  (disabled if beast alive; Dragon Hatchling only)
  → POST /api/v1/extra/:id/beast/resurrect
```

**Beast Status Display:**

| Field | Value |
|---|---|
| Name | beast.name |
| Level | beast.level (1–10) |
| HP | beast.currentHp / beast.hp |
| Training pips | beast.trainingPips / 10 |
| Cooperative | ✅ / ❌ |
| Abilities | beast.abilities joined |
| Dragon hearts | shown only if isDragonHatchling |

---

### Arcanist — `camp:arcanist`

Displays current Arcanist status (or "Not an Arcanist").

```
camp:arcanist → editReply: arcanist status + sub-buttons

camp:arcanist:become → showModal  (disabled if already arcanist)
  Modal: "Order" (Alchemy/Elements/Illusion/Invocation/Psyche/Summoning/Esoteric)
  → POST /api/v1/extra/:id/arcanist/become  { order }

camp:arcanist:learn → showModal
  Modal: "Spell table roll (1–100)"
  → POST /api/v1/extra/:id/arcanist/learn  { spellTableRoll }

camp:arcanist:donate → deferUpdate  (disabled if not arcanist)
  → POST /api/v1/extra/:id/arcanist/donate

camp:arcanist:conceal → showModal
  Modal: "Roll (1–100)"
  → POST /api/v1/extra/:id/arcanist/conceal  { roll }

camp:arcanist:prism → showModal  (styled danger red)
  Modal: "STR roll" + "DEX roll" + "INT roll"
  → POST /api/v1/extra/:id/arcanist/prism  { strRoll, dexRoll, intRoll }
```

**Arcanist Status Display:**

| Field | Value |
|---|---|
| Order | arcanist.order |
| Rank | arcanist.rank |
| Spells known | arcanist.arcanistSpells.length |
| Arcane Law violations | arcanist.arcaneLawBroken |
| Stave energy | arcanist.stafeEnergy |

---

### Artisan — `camp:artisan`

Displays current Artisan status (or "Not an Artisan").

```
camp:artisan → editReply: artisan status + sub-buttons

camp:artisan:unlock → deferUpdate  (disabled if already artisan)
  → POST /api/v1/extra/:id/artisan/unlock

camp:artisan:salvage → showModal
  Modal: "Item name" + "Roll (1–100)"
  → POST /api/v1/extra/:id/artisan/salvage  { itemName, roll }

camp:artisan:craft → showModal
  Modal: "Item name" + "Roll (1–100)"
  → POST /api/v1/extra/:id/artisan/craft  { itemName, roll }

camp:artisan:convert → showModal
  Modal: "From material" + "To material" + "Quantity"
  → POST /api/v1/extra/:id/artisan/convert  { from, to, quantity }

camp:artisan:storage → deferUpdate  (disabled if not artisan)
  → POST /api/v1/extra/:id/artisan/storage

camp:artisan:train → showModal
  Modal: "Type (Salvage/Crafting/Art)" + "Contacts to spend"
  → POST /api/v1/extra/:id/artisan/train  { type, contactsUsed }
```

---

## Combat Flow

Combat is initiated automatically when a dungeon encounter occurs. The session `inCombat` flag is set, and the room embed is replaced with a combat embed.

```
Monster appears (dungeon event)
  → session.inCombat = true
  → editReply: combat embed
       [⚔ Attack (Main)] [⚔ Attack (Off)] [🛡 Defend] [💨 Flee]

combat:attack:rHand → deferUpdate
  → POST /api/v1/combat/attack
      { partyId, adventurerId: stateAdventurerId, weaponSlot: "rHand" }
  → Check response.resolution
     ├─ No resolution (waiting for party): show "Waiting for allies..." message
     └─ Resolution present: show combat result embed
          ├─ combatOver = true: session.inCombat = false → show dungeon buttons
          └─ combatOver = false: show combat buttons again

combat:attack:lHand → same as above with weaponSlot: "lHand"
combat:defend → POST /api/v1/combat/defend
combat:flee   → POST /api/v1/combat/flee
```

### Combat Embed Contents

- Monster name and current HP bar
- Round logs (array of strings)
- Winner announcement (if `combatOver && winner`)
- Party member HP summary
- Action buttons (or dungeon buttons if combat ended)

### Resolution Detection

The turn resolves when **all party members** have submitted. The response shape:

```ts
// Still waiting:
{ message: "Action submitted, waiting for party", pendingCount: 1, totalCount: 2 }

// Resolved:
{ message: "Turn resolved", resolution: { logs, monster, roundOver, combatOver, winner } }
```

Check `response.resolution` — if present, render the result. If absent, show a waiting message and leave buttons active.

---

## Session Management

Two in-memory maps in `src/index.ts`:

```ts
const chargenSessions = new Map<string, ChargenSession>();  // key: Discord user ID
const dungeonSessions = new Map<string, DungeonSession>();  // key: Discord user ID
```

Sessions are lost on bot restart. Players need to `/enter` again after a restart.

### DungeonSession

```ts
interface DungeonSession {
  adventurerId:       string;   // same as kvAdventurerId (kept for clarity)
  kvAdventurerId:     string;   // sent in X-Adventurer-Id header
  stateAdventurerId:  string;   // party.leaderId — used in combat bodies
  partyId:            string;   // current party UUID
  messageId:          string;   // Discord message being edited in-place
  channelId:          string;   // Discord channel ID
  roomSearched:       boolean;  // disables search button when true
  inCombat:           boolean;  // switches button set to combat actions
  beastAbilityUses:   number;   // beast ability usage counter this session
  combatMonsterId?:   string;   // current monster ID (if applicable)
  lastRoom?:          LastRoom; // snapshot for camp:back
}
```

### The Two-ID Problem

The API uses two different adventurer identifiers in different contexts:

| ID | Source | Used For |
|---|---|---|
| `kvAdventurerId` | From chargen / KV store | `X-Adventurer-Id` header on dungeon/downtime/extra routes |
| `stateAdventurerId` | `party.leaderId` from `POST /party/create` | `adventurerId` field in combat request bodies |

This asymmetry exists because the combat system uses the in-memory party state, which tracks members by a different internal ID than the KV-persisted adventurer UUID.

---

## Account Store

File: `src/db/store.ts` — backed by Deno KV (`d100-bot.db`).

Key pattern: `["accounts", discordId]`

```ts
interface Account {
  discord_id:    string;
  username:      string;        // auto-generated "d_XXXXX" on register
  game_token:    string;        // JWT from /auth/register
  adventurer_id: string | null; // null until chargen finalize
}
```

| Function | Description |
|---|---|
| `getAccount(discordId)` | Load account by Discord user ID |
| `saveAccount(discordId, username, gameToken)` | Create or update account |
| `setAdventurerId(discordId, adventurerId)` | Update adventurer_id after chargen finalize |

---

## API Client Layer

File: `src/api/client.ts`

```ts
const BASE_URL = Deno.env.get("D100_API_URL") ?? "http://localhost:4200";

apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: { token?: string; adventurerId?: string }
): Promise<T>
```

Sets headers:
- `Authorization: Bearer {token}` if `token` provided
- `X-Adventurer-Id: {adventurerId}` if `adventurerId` provided
- `Content-Type: application/json`

Throws on non-2xx responses with the API error message extracted from the response body.

---

## ID Reference

### Button Custom IDs

| ID Pattern | Triggers | Modal? |
|---|---|---|
| `chargen:path:{PATH}` | Path selection step | No |
| `chargen:race:{RACE}` | Race selection step | No |
| `chargen:finalize` | Final character creation | No |
| `dungeon:move` | Move to next room | No |
| `dungeon:search` | Search current room | No |
| `dungeon:camp` | Open camp menu | No |
| `camp:back` | Return to last room | No |
| `camp:heal` | Open heal modal | Yes |
| `camp:repair` | Open repair modal | Yes |
| `camp:trade` | Open trade sub-menu | No |
| `camp:trade:sell` | Open sell modal | Yes |
| `camp:trade:buy` | Open buy modal | Yes |
| `camp:trade:market` | Open market modal | Yes |
| `camp:train` | Open train modal | Yes |
| `camp:empire` | Open empire modal | Yes |
| `camp:witchery` | Open witchery sub-menu | No |
| `camp:witchery:brew` | Open brew modal | Yes |
| `camp:witchery:clear` | Clear effects (direct) | No |
| `camp:beast` | Open beast sub-menu | No |
| `camp:beast:buy` | Open buy beast modal | Yes |
| `camp:beast:tame` | Open tame modal | Yes |
| `camp:beast:train` | Open train modal | Yes |
| `camp:beast:sell` | Sell beast (direct) | No |
| `camp:beast:resurrect` | Resurrect dragon (direct) | No |
| `camp:arcanist` | Open arcanist sub-menu | No |
| `camp:arcanist:become` | Open become modal | Yes |
| `camp:arcanist:learn` | Open learn modal | Yes |
| `camp:arcanist:donate` | Pay donation (direct) | No |
| `camp:arcanist:conceal` | Open conceal modal | Yes |
| `camp:arcanist:prism` | Open prism modal (danger) | Yes |
| `camp:artisan` | Open artisan sub-menu | No |
| `camp:artisan:unlock` | Unlock artisan (direct) | No |
| `camp:artisan:salvage` | Open salvage modal | Yes |
| `camp:artisan:craft` | Open craft modal | Yes |
| `camp:artisan:convert` | Open convert modal | Yes |
| `camp:artisan:storage` | Pay storage (direct) | No |
| `camp:artisan:train` | Open train modal | Yes |
| `combat:attack:rHand` | Attack with main hand | No |
| `combat:attack:lHand` | Attack with off-hand | No |
| `combat:defend` | Defend this round | No |
| `combat:flee` | Flee attempt | No |

### Modal Custom IDs

| Modal ID | Fields |
|---|---|
| `modal:chargen_step1` | name, str, dex, int |
| `camp:heal:submit` | amount |
| `camp:repair:submit` | itemId, pips |
| `camp:trade:sell:submit` | itemId |
| `camp:trade:buy:submit` | itemName |
| `camp:trade:market:submit` | table, roll |
| `camp:train:submit` | target, pips |
| `camp:empire:submit` | type, amount |
| `camp:witchery:brew:submit` | part1, part2, part3, roll, tableRoll |
| `camp:beast:buy:submit` | roll |
| `camp:beast:tame:submit` | monsterName, roll |
| `camp:beast:train:submit` | roll |
| `camp:arcanist:become:submit` | order |
| `camp:arcanist:learn:submit` | spellTableRoll |
| `camp:arcanist:conceal:submit` | roll |
| `camp:arcanist:prism:submit` | strRoll, dexRoll, intRoll |
| `camp:artisan:salvage:submit` | itemName, roll |
| `camp:artisan:craft:submit` | itemName, roll |
| `camp:artisan:convert:submit` | from, to, quantity |
| `camp:artisan:train:submit` | type, contactsUsed |

### Select Menu Custom IDs

| ID | Description |
|---|---|
| `chargen:skills` | Step 4 skills (min 2, max 2 selections) |

---

## Styling Constants

File: `src/constants.ts`

### Colors

| Name | Hex | Used For |
|---|---|---|
| `DEFAULT` | `0xf0c040` | General / gold |
| `ROOM_GREEN` | `0x27ae60` | Green rooms |
| `ROOM_RED` | `0xc0392b` | Red rooms |
| `ROOM_BLUE` | `0x2980b9` | Blue rooms |
| `ROOM_YELLOW` | `0xf39c12` | Yellow rooms |
| `COMBAT` | `0xc0392b` | Combat embeds |
| `DEATH` | `0x2c2c2c` | Death notifications |
| `DOWNTIME` | `0x27ae60` | Camp / downtime |
| `RARE_LOOT` | `0x8e44ad` | Rare finds |
| `PARTY` | `0x1a1a2e` | Party embeds |
| `ARCANE` | `0x8e44ad` | Arcanist system |
| `ARTISAN` | `0xf39c12` | Artisan system |
| `ERROR` | `0xe74c3c` | Error embeds |
| `NAVY` | `0x1a1a2e` | Deep navy |
| `MAGIC` | `0x5b2d8e` | Magic embeds |

---

## Deployment

### Register Commands

```bash
# Guild-scoped (instant, good for dev) — set DISCORD_GUILD_ID
deno task deploy

# Global (takes up to 1 hour to propagate) — unset DISCORD_GUILD_ID
deno task deploy
```

### Docker

```bash
docker build -t d100-bot .
docker run --env-file .env d100-bot
```

### Notes

- The bot requires `--unstable-kv` flag for Deno KV access.
- KV database file: `d100-bot.db` (created automatically in working directory).
- Only register commands once. Re-run `deno task deploy` only when adding/changing slash commands.
- Sessions (`chargenSessions`, `dungeonSessions`) are in-memory and lost on restart. Players must `/enter` again after bot restarts.
