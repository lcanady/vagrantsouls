# API Reference

Base URL: `http://localhost:4200`
All protected routes require `Authorization: Bearer <token>` and most require `X-Adventurer-Id: <uuid>`.

---

## Table of Contents

- [Auth](#auth)
- [Character Generation](#character-generation)
- [Adventurer](#adventurer)
- [Dungeon](#dungeon)
- [Combat](#combat)
- [Party](#party)
- [Downtime](#downtime)
- [Quests](#quests)
- [Extra Rules — Book 4](#extra-rules--book-4)
  - [Beast Mastery](#beast-mastery)
  - [Arcanist](#arcanist)
  - [Artisan](#artisan)
  - [Combat Experience](#combat-experience)
- [Extra Rules — Book 8](#extra-rules--book-8)
  - [Butchery](#butchery)
  - [Dual Wield](#dual-wield)
  - [Weapon Proficiency](#weapon-proficiency)
  - [Cheat Death](#cheat-death)
  - [Pursuit](#pursuit)
  - [Secret Passageways](#secret-passageways)
  - [Monster Variants](#monster-variants)
  - [Honour Points](#honour-points)
  - [Accolades](#accolades)
  - [Heroic Items](#heroic-items)
  - [Epic Dungeon](#epic-dungeon)
  - [Identify](#identify)
  - [Yellow Events](#yellow-events)
  - [Ammunition](#ammunition)
  - [Throw](#throw)
  - [Aimed Attack](#aimed-attack)
  - [Equipment Mods](#equipment-mods)
  - [Spell Mana](#spell-mana)
- [Guilds](#guilds)
- [World Builder](#world-builder)
  - [Setup](#setup)
  - [State](#state)
  - [Calendar](#calendar)
  - [Actions](#actions)
  - [Quests (WB)](#quests-wb)
  - [Mounts](#mounts)
  - [Events](#events)
  - [Settlement](#settlement)
  - [Herbalism](#herbalism)
  - [Mining](#mining)
  - [Skinning](#skinning)
  - [Maps](#maps)
- [WebSocket](#websocket)

---

## Auth

### `POST /api/v1/auth/register`

Register a new user account.

**Body**
```json
{ "username": "string", "password": "string" }
```

**Response `200`**
```json
{
  "token": "jwt_string",
  "user": { "id": "uuid", "username": "string" }
}
```

**Errors:** `400` username already exists.

---

### `POST /api/v1/auth/login`

Log in with username + password.

**Body**
```json
{ "username": "string", "password": "string" }
```

**Response `200`**
```json
{
  "token": "jwt_string",
  "user": { "id": "uuid", "username": "string" }
}
```

**Errors:** `401` invalid credentials.

---

## Character Generation

All chargen routes require `Authorization` but **not** `X-Adventurer-Id` (except steps 2–5 and fast-track, which take `id` in the body).

### `GET /api/v1/chargen/options`

List all valid hero paths and races with their stat/skill modifiers.

**Response `200`**
```json
{
  "paths": [
    { "name": "Warrior", "strMod": 10, "dexMod": -5, "intMod": -5, "skills": { "Bravery": 5, "Escape": 5 } },
    ...
  ],
  "races": [
    { "name": "Dwarf", "strMod": 5, "dexMod": 0, "intMod": -5, "skills": { "Strong": 5 } },
    ...
  ]
}
```

---

### `GET /api/v1/chargen/list`

List all adventurers owned by the authenticated user.

**Response `200`** — array of `Adventurer` objects.

---

### `POST /api/v1/chargen/create`

**Step 1.** Create a new adventurer with base stats.

Stats must be a permutation of `[50, 40, 30]` (standard) or a Book 8 race assignment (`50/35/25`, `60/30/20`, `45/35/30`, `40/30/30`).

**Body**
```json
{ "name": "Aldric", "str": 50, "dex": 30, "int": 40 }
```

**Response `200`**
```json
{
  "message": "Adventurer created. Proceed to select Path.",
  "id": "uuid",
  "adventurer": { ... }
}
```

---

### `POST /api/v1/chargen/path`

**Step 2.** Choose hero path. Applies stat and skill modifiers.

Valid paths: `Warrior`, `Rogue`, `Sorcerer`, `Knight`, `Paladin`, `Assassin`, `Scoundrel`, `Warlock`, `Druid`, `Barbarian`, `Hunter`, `Arcane Wizard`.

**Body**
```json
{ "id": "uuid", "path": "Warrior" }
```

**Response `200`**
```json
{ "message": "Hero Path 'Warrior' chosen...", "adventurer": { ... } }
```

---

### `POST /api/v1/chargen/race`

**Step 3.** Choose race. Applies stat and skill modifiers.

Valid races: `Dwarf`, `Elf`, `Human`, `Halfling`, `Half Elf`, `Half Giant`, `High Elf`, `Mountain Dwarf`, plus Book 8 races: `Gnome`, `Dragon Scar`, `Half Orc`, `Wood Elf`.

**Body**
```json
{ "id": "uuid", "race": "Elf" }
```

**Response `200`**
```json
{ "message": "Race 'Elf' chosen...", "adventurer": { ... } }
```

---

### `POST /api/v1/chargen/skills`

**Step 4.** Choose 2 bonus skills (+5 each).

**Body**
```json
{ "id": "uuid", "skills": ["Dodge", "Lucky"] }
```

**Response `200`**
```json
{ "message": "Skills applied.", "adventurer": { ... } }
```

---

### `POST /api/v1/chargen/finalize`

**Step 5.** Finalize the adventurer. Sets HP/Fate/Life to starting values, rolls a starting weapon (Table W), 3 armour pieces (Table A), and 3 Lesser Healing Potions.

**Body**
```json
{ "id": "uuid" }
```

**Response `200`**
```json
{ "message": "Adventurer finalized. Ready for quest!", "adventurer": { ... } }
```

---

### `POST /api/v1/chargen/fast-track`

Skip the training quests. Simulates 5 training quests being played out, applying experience, gear, consequences. All randomness is caller-supplied via `rolls`.

**Body**
```json
{
  "id": "uuid",
  "rolls": {
    "questOutcome":    85,   "pathExperience":  60,
    "skillExperience": 40,   "consequences":    70,
    "weaponRolls":     [12, 55, 78, 33],
    "armourRolls":     [5, 44, 91, 22],
    "taRolls":         [61, 17],
    "randomSkill":     4
  }
}
```

**Response `200`**
```json
{
  "message": "Fast track complete. Adventurer is quest-ready!",
  "questsCompleted": 5,
  "questsFailed": 1,
  "adventurer": { ... }
}
```

---

## Adventurer

All routes require `X-Adventurer-Id`.

### `GET /api/v1/adventurer`

Get the full adventurer object.

**Response `200`** — `Adventurer` object.

---

### `POST /api/v1/adventurer/equip`

Move an item from backpack to an equipment slot.

**Body**
```json
{ "itemId": "uuid", "slot": "MainHand" }
```

Valid slots: `Head`, `Torso`, `Back`, `MainHand`, `OffHand`, `Belt1`, `Belt2`.

**Response `200`**
```json
{ "message": "Equipped Sword into MainHand", "adventurer": { ... } }
```

---

### `POST /api/v1/adventurer/unequip`

Move an equipped item back to backpack.

**Body**
```json
{ "slot": "MainHand" }
```

**Response `200`**
```json
{ "message": "Unequipped item from MainHand", "adventurer": { ... } }
```

---

### `POST /api/v1/adventurer/update`

Direct stat patch (for debugging / manual corrections). Body is merged into the adventurer object.

**Body** — any subset of adventurer fields.

**Response `200`** — updated `Adventurer`.

---

## Dungeon

All routes require `X-Adventurer-Id`. Adventurer must be alive (`checkDead` guard).

### `POST /api/v1/dungeon/move`

Move to the next room. Advances the time track, triggers upkeep, rolls Table M for the room, and generates an AI narrative.

**Body** — empty `{}`.

**Response `200`**
```json
{
  "timeTrack": 4,
  "roll": 73,
  "room": {
    "roll": 73,
    "color": "Yellow",
    "exits": 2,
    "features": ["Trap"],
    "searched": false
  },
  "narrative": "You step through a crumbling arch...",
  "upkeepReport": {
    "messages": [],
    "oilConsumed": 1
  }
}
```

---

### `POST /api/v1/dungeon/search`

Search the current room. Rolls Table S. Can only be done once per room.

**Body** — empty `{}`.

**Response `200`**
```json
{
  "roll": 44,
  "find": { "name": "Gold Coins", "value": 20 },
  "narrative": "You search the room... and find Gold Coins!",
  "upkeepReport": { ... }
}
```

**Errors:** `400` no current room or already searched.

---

## Combat

All routes require `X-Adventurer-Id`. Adventurer must be alive.

Combat is party-based and turn-synchronised. All members of a party must submit their action before the turn resolves.

### `POST /api/v1/combat/start`

Generate a monster encounter and start combat for a party.

**Body**
```json
{
  "partyId": "string",
  "roll": 55,
  "table": "E",
  "encounterModifier": 0
}
```

- `table`: `"E"` (Book 1, default) or `"EA"` (Book 2 extended)
- `encounterModifier`: integer added to roll before table lookup (positive = harder, negative = easier)

**Response `200`**
```json
{ "message": "Combat started", "monster": { "name": "...", "hp": 20, ... } }
```

---

### `POST /api/v1/combat/attack`

Submit an attack action.

**Body**
```json
{
  "partyId": "string",
  "adventurerId": "string",
  "weaponSlot": "rHand",
  "targetId": "optional-monster-id"
}
```

**Response — action queued**
```json
{ "message": "Action submitted, waiting for party", "pendingCount": 1, "totalCount": 2 }
```

**Response — turn resolved (all members submitted)**
```json
{ "message": "Turn resolved", "resolution": { ... } }
```

---

### `POST /api/v1/combat/defend`

Submit a WAIT (defend) action — adventurer defends this round.

**Body**
```json
{ "partyId": "string", "adventurerId": "string" }
```

Same queued/resolved response pattern as `/attack`.

---

### `POST /api/v1/combat/flee`

Submit a FLEE action.

**Body**
```json
{ "partyId": "string", "adventurerId": "string" }
```

---

### `POST /api/v1/combat/pass-item`

Pass an item from one adventurer's slot to another's backpack (Book 2 party rule).

**Body**
```json
{
  "partyId": "string",
  "adventurerId": "string",
  "targetId": "string",
  "slot": "Belt1"
}
```

---

## Party

Party state is **in-memory only** — parties are lost on server restart.

### `POST /api/v1/party/create`

**Body**
```json
{ "leaderName": "Aldric" }
```

**Response `200`** — `Party` object with `id`, `members`.

---

### `POST /api/v1/party/:partyId/join`

**Body**
```json
{ "adventurerName": "Brynn" }
```

**Response `200`**
```json
{ "party": { ... }, "adventurerId": "string" }
```

---

### `POST /api/v1/party/:partyId/leave`

**Body**
```json
{ "adventurerId": "string" }
```

**Response `200`** — updated `Party`.

---

### `GET /api/v1/party/:partyId`

Get party state.

**Response `200`** — `Party` object.

---

## Downtime

All routes require `X-Adventurer-Id`. These are the **camp** actions between dungeon runs.

### `POST /api/v1/downtime/refresh`

Refresh time tracks at start of downtime.

**Body** — empty `{}`.

---

### `POST /api/v1/downtime/heal`

Heal HP (costs oil from supplies).

**Body**
```json
{ "amount": 4 }
```

---

### `POST /api/v1/downtime/repair`

Repair a damaged item by spending fix pips.

**Body**
```json
{ "itemId": "uuid", "pips": 2 }
```

---

### `POST /api/v1/downtime/sell`

Sell an item from backpack for its `value` in gold.

**Body**
```json
{ "itemId": "uuid" }
```

---

### `POST /api/v1/downtime/buy-needed`

Buy a standard supply item by name (oil, food, picks, poison, etc.).

**Body**
```json
{ "itemName": "Oil Flask" }
```

---

### `POST /api/v1/downtime/search-market`

Roll on Table A (armour) or Table W (weapon) to buy a random market item.

**Body**
```json
{ "table": "W", "roll": 42 }
```

---

### `POST /api/v1/downtime/train`

Spend experience pips to improve a stat or skill.

**Body**
```json
{ "target": "str", "pips": 10 }
```

---

### `POST /api/v1/downtime/magic-tuition`

Spend experience pips to learn a spell.

**Body**
```json
{ "spellName": "Fireball", "pips": 5 }
```

---

### `POST /api/v1/downtime/empire-building`

Process empire building investments. Body is a map of investment name → d100 roll.

**Body**
```json
{ "Inn": 55, "Farm": 32 }
```

---

### `POST /api/v1/downtime/witchery`

Attempt to brew a witchery potion/anointment from 3 monster parts.

**Body**
```json
{
  "parts": ["Dragon Scale", "Goblin Eye", "Wolf Fang"],
  "roll": 45,
  "tableRoll": 71
}
```

**Response `200`**
```json
{
  "result": { "formula": "...", "effect": "...", "mishap": "...", "success": true },
  "state": { ... }
}
```

---

### `POST /api/v1/downtime/witchery/clear`

Clear witchery effects and mishaps at end of quest.

**Body** — empty `{}`.

---

## Quests

All routes require `X-Adventurer-Id`.

### `POST /api/v1/quests/generate`

Procedurally generate a new quest using the Quest Maker tables (Book 2).

**Body**
```json
{
  "objectiveRolls": [55, 30],
  "modifierRoll": 72,
  "rewardRoll": 6
}
```

**Response `200`**
```json
{
  "quest": {
    "objectives": ["Slay 3 Orcs", "Retrieve the Amulet"],
    "modifier": "At Night",
    "reward": "Gold × 3"
  }
}
```

---

### `GET /api/v1/quests/campaign`

List all 20 campaign quest definitions (CQ1–CQ20).

---

### `GET /api/v1/quests/campaign/:id`

Get a specific campaign quest by ID (e.g. `CQ5`).

---

### `GET /api/v1/quests/campaign/status`

Get the current adventurer's campaign quest progress map.

**Response `200`**
```json
{ "campaignQuests": { "CQ1": "complete", "CQ2": "failed" } }
```

---

### `POST /api/v1/quests/campaign/:id/complete`

Mark a campaign quest outcome.

**Body**
```json
{ "outcome": "complete" }
```

**Response `200`**
```json
{
  "message": "Campaign quest CQ1 marked as complete.",
  "nextQuest": { ... },
  "state": { ... }
}
```

---

### `GET /api/v1/quests/side`

List all 25 side quest definitions (QAA–QAY).

---

### `GET /api/v1/quests/side/roll?roll=<1-100>`

Look up a side quest by a d100 roll. If `roll` is omitted the server rolls.

---

### `GET /api/v1/quests/side/:id`

Get a specific side quest by ID (e.g. `QAB`).

---

### `POST /api/v1/quests/side/:id/complete`

Mark a side quest outcome.

**Body**
```json
{ "outcome": "failed" }
```

---

## Extra Rules — Book 4

All routes: `POST /api/v1/extra/:adventurerId/<system>/<action>`.
All require `Authorization` and `X-Adventurer-Id`.

---

### Beast Mastery

#### `POST /api/v1/extra/:id/beast/buy`

Buy a beast from Table Y.

**Body** `{ "roll": number (1–100) }`

**Response** `{ message, beast }`

---

#### `POST /api/v1/extra/:id/beast/tame`

Attempt to tame a monster encountered in the dungeon.

**Body** `{ "monsterName": string, "roll": number }`

**Response** `{ message, beast }` or `{ error, extraDamageDice }` on failure.

---

#### `POST /api/v1/extra/:id/beast/train`

Spend a downtime action training the beast (+training pips, possible level-up).

**Body** `{ "roll": number }`

**Response** `{ message, leveledUp, beast }`

---

#### `POST /api/v1/extra/:id/beast/sell`

Sell the current beast companion.

**Body** — empty `{}`.

**Response** `{ message, goldGained, gold }`

---

#### `POST /api/v1/extra/:id/beast/ability`

Use a beast ability during combat/exploration.

**Body** `{ "ability": string, "usesThisQuest": number }`

**Response** `{ message, effect }`

---

#### `POST /api/v1/extra/:id/beast/deflect`

Order the beast to take a hit on behalf of the adventurer.

**Body** `{ "incomingDamage": number }`

**Response** `{ beastDamage, adventurerDamage, beast }`

---

#### `POST /api/v1/extra/:id/beast/resurrect`

Resurrect a Dragon Hatchling (costs a Dragon Heart; max 2 times).

**Body** — empty `{}`.

**Response** `{ message, dragon }`

---

### Arcanist

#### `POST /api/v1/extra/:id/arcanist/become`

Join an Arcanist order (one of 7 orders). Adventurer must not already be an Arcanist.

**Body** `{ "order": "Alchemy" | "Elements" | "Illusion" | "Invocation" | "Psyche" | "Summoning" | "Esoteric" }`

**Response** `{ message, arcanist }`

---

#### `POST /api/v1/extra/:id/arcanist/learn`

Learn a spell from the order's spell table.

**Body** `{ "spellTableRoll": number, "cost": number? }`

**Response** `{ message, arcanist }`

---

#### `POST /api/v1/extra/:id/arcanist/donate`

Pay the mandatory donation to maintain Arcanist standing.

**Body** — empty `{}`.

**Response** `{ message, gold }`

---

#### `POST /api/v1/extra/:id/arcanist/conceal`

Roll to conceal Arcane Law violations.

**Body** `{ "roll": number }`

**Response** `{ concealed, sentToPrism, adventurer }`

---

#### `POST /api/v1/extra/:id/arcanist/prism`

Survive the Arcane Prism (3 stat survival rolls).

**Body** `{ "strRoll": number, "dexRoll": number, "intRoll": number }`

**Response** `{ survived, statLosses, adventurer }`

---

### Artisan

#### `POST /api/v1/extra/:id/artisan/unlock`

Unlock the Artisan system (pay 200 gp, receive artisan sheet).

**Body** — empty `{}`.

**Response** `{ message, artisan }`

---

#### `POST /api/v1/extra/:id/artisan/salvage`

Salvage materials from a defeated monster or item.

**Body** `{ "itemName": string, "roll": number, "prefix": string? }`

**Response** `{ message, materials, artisan }`

---

#### `POST /api/v1/extra/:id/artisan/craft`

Craft an item from a schematic.

**Body** `{ "itemName": string, "roll": number }`

**Response** `{ message, item, artisan }`

---

#### `POST /api/v1/extra/:id/artisan/convert`

Convert lower-tier materials to higher-tier.

**Body** `{ "from": string, "to": string, "quantity": number }`

**Response** `{ message, artisan }`

---

#### `POST /api/v1/extra/:id/artisan/storage`

Pay guild storage fee for the season.

**Body** — empty `{}`.

**Response** `{ message, artisan }`

---

#### `POST /api/v1/extra/:id/artisan/train`

Train artisan skills at the guild.

**Body** `{ "type": "salvage" | "craft" | "art", "contactsUsed": number }`

**Response** `{ message, artisan }`

---

### Combat Experience

#### `POST /api/v1/extra/:id/combat-xp/kill`

Record a monster kill (updates kill count, may unlock abilities).

**Body** `{ "monsterName": string, "packDefeated": boolean? }`

**Response** — `KillResult` with `{ monsterName, kills, newAbilitiesUnlocked, ... }`

---

#### `GET /api/v1/extra/:id/combat-xp`

Get all combat experience records for this adventurer.

**Response** `{ experience: Record<monsterName, KillRecord> }`

---

#### `GET /api/v1/extra/:id/combat-xp/:monster`

Get kill status and unlocked abilities for a specific monster.

**Response** `{ monsterName, kills, tier10Unlocked, tier20Unlocked, abilities }`

---

## Extra Rules — Book 8

All routes under `/api/v1/extra/:adventurerId/`.

---

### Butchery

#### `POST /api/v1/extra/:id/butchery/butcher`

Butcher a defeated monster for parts.

**Body** `{ "monsterName": string, "roll": number }`

**Response** `{ parts, adventurer }`

---

### Dual Wield

#### `POST /api/v1/extra/:id/dual-wield/enable`

Enable dual-wielding for the adventurer.

#### `POST /api/v1/extra/:id/dual-wield/roll-damage`

Roll dual-wield off-hand damage.

**Body** `{ "roll": number }`

---

### Weapon Proficiency

#### `POST /api/v1/extra/:id/weapon-proficiency/train`

Train proficiency with a weapon type.

**Body** `{ "weaponType": string, "roll": number }`

---

### Cheat Death

#### `POST /api/v1/extra/:id/cheat-death/attempt`

Attempt to cheat death when HP reaches 0.

**Body** `{ "roll": number }`

**Response** `{ survived, newHp, adventurer }`

---

### Pursuit

#### `POST /api/v1/extra/:id/pursuit/flee`

Attempt to flee from a pursuing monster.

**Body** `{ "roll": number, "monsterSpeed": number }`

---

### Secret Passageways

#### `POST /api/v1/extra/:id/secret-passageway/search`

Search for a secret passageway in the current room.

**Body** `{ "roll": number }`

---

### Monster Variants

#### `POST /api/v1/extra/:id/monster-variant/roll`

Roll for a monster variant modifier.

**Body** `{ "monsterName": string, "hp": number, "roll": number }`

**Response** `{ variant, modifiedMonster }`

---

### Honour Points

#### `POST /api/v1/extra/:id/honour/gain`

Award honour points for a deed.

**Body** `{ "deed": string, "points": number }`

#### `POST /api/v1/extra/:id/honour/spend`

Spend honour points for a benefit.

**Body** `{ "benefit": string }`

---

### Accolades

#### `GET /api/v1/extra/:id/accolades`

Get all accolades earned by this adventurer.

#### `POST /api/v1/extra/:id/accolades/check`

Check if new accolades have been earned (pass current stats/kills).

**Body** `{ "roll": number }`

---

### Heroic Items

#### `POST /api/v1/extra/:id/heroic-item/generate`

Generate a heroic item by rolling on the Legends A table twice.

**Body** `{ "la1Roll": number, "la2Roll": number }`

**Response** `{ heroicItem, adventurer }`

---

### Epic Dungeon

#### `POST /api/v1/extra/:id/epic-dungeon/enter`

Enter the epic dungeon level (requires prerequisites).

#### `POST /api/v1/extra/:id/epic-dungeon/roll-room`

Roll for an epic dungeon room.

**Body** `{ "roll": number }`

---

### Identify

#### `POST /api/v1/extra/:id/identify/item`

Identify an unidentified item using the Identify table.

**Body** `{ "itemId": string, "roll": number }`

---

### Yellow Events

#### `POST /api/v1/extra/:id/yellow-event/roll`

Roll for a Yellow dungeon event.

**Body** `{ "roll": number }`

**Response** `{ event, effect, adventurer }`

---

### Ammunition

#### `GET /api/v1/extra/:id/ammunition`

Get the adventurer's ammunition state (pouch, quiver, bandolier).

#### `POST /api/v1/extra/:id/ammunition/load`

Load ammunition into a holder.

**Body** `{ "holder": "pouch" | "quiver" | "bandolier", "type": string, "qty": number }`

#### `POST /api/v1/extra/:id/ammunition/fire`

Fire a shot (deducts ammo).

**Body** `{ "holder": "pouch" | "quiver" | "bandolier", "roll": number }`

---

### Throw

#### `POST /api/v1/extra/:id/throw/attack`

Make a thrown weapon attack.

**Body** `{ "itemId": string, "roll": number }`

**Response** `{ hit, damage, adventurer }`

---

### Aimed Attack

#### `POST /api/v1/extra/:id/aimed-attack/attack`

Make an aimed attack at a specific body location.

**Body** `{ "location": "head" | "torso" | "arms" | "legs", "roll": number }`

**Response** `{ hit, critEffect, damage }`

---

### Equipment Mods

#### `POST /api/v1/extra/:id/equipment-mod/apply`

Apply a modification to a piece of equipment.

**Body** `{ "itemId": string, "mod": string, "roll": number }`

---

### Spell Mana

#### `GET /api/v1/extra/:id/spell-mana`

Get current mana state.

#### `POST /api/v1/extra/:id/spell-mana/enable`

Enable the spell mana system for this adventurer.

**Body** `{ "primaryStat": "int", "magicPower": number }`

#### `POST /api/v1/extra/:id/spell-mana/cast`

Cast a spell, consuming mana.

**Body** `{ "spellName": string, "manaCost": number }`

#### `POST /api/v1/extra/:id/spell-mana/restore`

Restore mana (rest/meditation).

**Body** `{ "amount": number }`

---

## Guilds

### Public Routes

#### `GET /api/v1/guilds`

List all 4 guilds with summary info.

**Response `200`**
```json
{
  "guilds": [
    {
      "id": "iron_vanguard",
      "name": "Iron Vanguard",
      "emoji": "⚔️",
      "description": "...",
      "compatiblePaths": ["Warrior", "Knight", "Paladin", "Barbarian"]
    },
    ...
  ]
}
```

The 4 guilds: `iron_vanguard`, `arcane_circle`, `shadow_step`, `silver_wanderers`.

---

#### `GET /api/v1/guilds/:guildId`

Guild detail including full rank/benefit table and leaderboard (top 20).

---

#### `GET /api/v1/guilds/:guildId/events`

Last 20 guild events (newest first). Used by the Discord bot for the event feed.

---

### Protected Routes

All require `Authorization` and `X-Adventurer-Id` (via path param `:id`).

#### `GET /api/v1/guilds/adventurer/:id/status`

Get current guild membership and rank for this adventurer.

**Response `200`**
```json
{
  "guildId": "iron_vanguard",
  "guildName": "Iron Vanguard",
  "standing": 35,
  "rank": "Veteran",
  "benefits": ["..."]
}
```

---

#### `POST /api/v1/guilds/adventurer/:id/join`

Join a guild. Adventurer must not already be in a guild.

**Body** `{ "guildId": string }`

**Response `200`**
```json
{ "message": "...", "guildId": "iron_vanguard", "standing": 10, "rank": "Recruit" }
```

---

#### `POST /api/v1/guilds/adventurer/:id/leave`

Leave current guild. Standing resets to 0.

**Body** — empty `{}`.

---

#### `POST /api/v1/guilds/adventurer/:id/contribute`

Donate gold to gain guild standing.

**Body** `{ "gold": number (min 10) }`

**Response `200`**
```json
{
  "message": "...",
  "standing": 45,
  "rank": "Sergeant",
  "goldSpent": 50,
  "standingGained": 5,
  "rankChanged": true,
  "newRank": "Sergeant"
}
```

---

## World Builder

All routes: `/api/v1/worldbuilder/:adventurerId/<path>`.
All require `Authorization` and `X-Adventurer-Id`.

---

### Setup

#### `POST /api/v1/worldbuilder/:id/setup`

Initialize a new world. Sets starting hex, calendar, WB starting skills.

**Body**
```json
{
  "rolls": {
    "initWorldRolls": { "terrain": 42, "name_prefix": 17, "name_suffix": 83 },
    "startingSkills": [3, 7]
  }
}
```

---

#### `POST /api/v1/worldbuilder/:id/setup/hex`

Generate a hex on the current sheet.

**Body**
```json
{
  "hexId": "q:1,r:0",
  "adjacentHexIds": ["q:0,r:0"],
  "rolls": {
    "terrain": 55, "name_prefix": 12, "name_suffix": 67,
    "settlement": 88, "road": 14, "river": 91
  }
}
```

---

### State

#### `GET /api/v1/worldbuilder/:id/state`

Full `WorldBuilderState` for this adventurer.

---

#### `GET /api/v1/worldbuilder/:id/hexes`

All hexes on the current sheet as a `Record<hexId, HexData>`.

---

#### `GET /api/v1/worldbuilder/:id/hexes/:hexId`

Single hex detail.

---

### Calendar

#### `POST /api/v1/worldbuilder/:id/calendar/mark-day`

Advance the calendar by 1 day. Applies rations, fatigue, circled date triggers.

**Body**
```json
{ "rolls": { "ration": 5, "fatigue": 3 } }
```

---

### Actions

All action routes accept `{ "rolls": { ... } }` with action-specific roll fields.

#### `POST /api/v1/worldbuilder/:id/action/rest`

Rest in current hex — recover fatigue.

#### `POST /api/v1/worldbuilder/:id/action/scout`

Scout an adjacent hex.

**Body** `{ "targetHexId": "q:1,r:0", "rolls": { ... } }`

#### `POST /api/v1/worldbuilder/:id/action/forage`

Forage for food.

**Body** `{ "method": "gather" | "hunt" | "fish", "rolls": { ... } }`

#### `POST /api/v1/worldbuilder/:id/action/fish`

Fish in adjacent water hex.

**Body** `{ "useBait": boolean, "rolls": { ... } }`

#### `POST /api/v1/worldbuilder/:id/action/move`

Move to an adjacent hex.

**Body** `{ "targetHexId": string, "rolls": { ... } }`

#### `POST /api/v1/worldbuilder/:id/action/cart`

Travel by cart (costs 2 days, carries more).

**Body** `{ "rolls": { ... } }`

#### `POST /api/v1/worldbuilder/:id/action/ride`

Travel mounted.

**Body** `{ "mountSlot": number, "rolls": { ... } }`

#### `POST /api/v1/worldbuilder/:id/action/lay-of-land`

Learn terrain info about a distant hex.

**Body** `{ "targetHexId": string, "rolls": { ... } }`

#### `POST /api/v1/worldbuilder/:id/action/news-of-quests`

Ask locals about quests in a hex.

**Body** `{ "targetHexId": string, "rolls": { ... } }`

#### `POST /api/v1/worldbuilder/:id/action/make-camp`

Establish a camp in the current hex (▲ marker).

**Body** — empty `{}`.

---

### Quests (WB)

#### `POST /api/v1/worldbuilder/:id/quests/generate`

Generate a World Builder quest for the current sheet.

**Body** `{ "rolls": { "q": number, "p": number, "direction": number, "distance": number } }`

**Response** `{ quest: WBQuestRecord, questEntry, adventurer, state }`

---

#### `POST /api/v1/worldbuilder/:id/quests/generate-side`

Generate a WB side quest.

**Body** `{ "rolls": { ... } }`

---

#### `POST /api/v1/worldbuilder/:id/quests/:code/complete`

Complete or fail a WB quest.

**Body** `{ "success": boolean, "rolls": { ... } }`

---

#### `GET /api/v1/worldbuilder/:id/quests`

List all quests on the current sheet.

---

### Mounts

#### `POST /api/v1/worldbuilder/:id/mounts/buy`

Buy a mount.

**Body** `{ "name": string, "type": string, "cost": number, "value": number, "availabilityRoll": number? }`

---

#### `POST /api/v1/worldbuilder/:id/mounts/:slot/sell`

Sell a mount.

**Body** `{ "settlementType": "camp"|"village"|"town"|"city", "buyerRoll": number }`

---

#### `POST /api/v1/worldbuilder/:id/mounts/:slot/feed`

Feed a mount (deducts rations from calendar).

**Body** `{ "rationsToPay": number, "double": boolean? }`

---

#### `POST /api/v1/worldbuilder/:id/mounts/:slot/saddlebag`

Add a saddlebag.

**Body** `{ "cost": number, "availabilityRoll": number?, "availabilityChance": number? }`

---

#### `POST /api/v1/worldbuilder/:id/mounts/:slot/stow`

Stow an item in a saddlebag.

**Body** `{ "bagIndex": number, "itemName": string, "isStackable": boolean, "qty": number? }`

---

#### `POST /api/v1/worldbuilder/:id/mounts/:slot/unload`

Remove an item from a saddlebag.

**Body** `{ "bagIndex": number, "itemName": string, "isTrackItem": boolean }`

---

#### `POST /api/v1/worldbuilder/:id/mounts/check-leaving`

Check if mounts left behind will wait or leave.

**Body** `{ "questTimePips": number, "mountRolls": number[] }`

---

#### `GET /api/v1/worldbuilder/:id/mounts`

List all mounts.

---

### Events

#### `POST /api/v1/worldbuilder/:id/events/roll`

Roll for a world event.

**Body** `{ "roll": number (1–100), "context": string, "modifier": number? }`

**Response** `{ event, pendingEvents: string[] }`

---

#### `POST /api/v1/worldbuilder/:id/events/resolve/:event`

Resolve a specific pending event.

**Body** `{ "rolls": { ... } }`

---

### Settlement

All 13 settlement sub-routes share the pattern `POST /api/v1/worldbuilder/:id/settlement/<action>`.

| Route | Description | Key Body Fields |
|---|---|---|
| `/settlement/law` | Check settlement law (LP) | `settlementType`, `d10Roll` |
| `/settlement/heal` | Heal at settlement | `settlementType`, `hpToHeal`, `rolls` |
| `/settlement/repair` | Repair at settlement | `settlementType`, `baseRepairCost`, `pips`, `rolls` |
| `/settlement/sell` | Sell items | `settlementType`, `items`, `rolls` |
| `/settlement/buy` | Buy an item | `settlementType`, `nTableRange`, `baseItemPrice`, `rolls` |
| `/settlement/search` | Search market by table | `settlementType`, `table`, `rolls` |
| `/settlement/train` | Train skill/stat | `settlementType`, `target`, `rolls` |
| `/settlement/magic` | Magic tuition | `settlementType`, `spellName`, `rolls` |
| `/settlement/empire` | Empire building | `settlementType`, `rolls` |
| `/settlement/witchery` | Witchery services | `settlementType`, `rolls` |
| `/settlement/artisan` | Artisan guild | `settlementType`, `rolls` |
| `/settlement/rumour` | Quest rumour | `settlementType`, `d100Roll` |
| `/settlement/event` | Settlement event | `settlementType`, `d100Roll` |

Valid `settlementType` values: `"camp"`, `"village"`, `"town"`, `"city"`.

---

### Herbalism (Book 8)

#### `POST /api/v1/worldbuilder/:id/herbalism/gather`

Gather herbs in the current terrain.

**Body** `{ "terrain": TerrainType, "roll": number (1–10) }`

**Response** `{ herb, quantity, adventurer }`

---

#### `POST /api/v1/worldbuilder/:id/herbalism/brew`

Brew a herbal recipe.

**Body** `{ "recipeName": string, "ingredientRoll": number }`

---

#### `POST /api/v1/worldbuilder/:id/herbalism/train`

Visit a herb trainer at settlement.

**Body** `{ "roll": number }`

---

### Mining (Book 8)

#### `POST /api/v1/worldbuilder/:id/mining/find-mine`

Search for a mine in hills/mountains terrain.

**Body** `{ "terrain": TerrainType, "roll": number }`

---

#### `POST /api/v1/worldbuilder/:id/mining/mine`

Mine for materials (requires Mining Pick, must be at a mine hex).

**Body** `{ "materialRolls": number[] (1–10 each) }`

**Response** `{ materials, artisan, adventurer }`

---

### Skinning (Book 8)

#### `POST /api/v1/worldbuilder/:id/skinning/salvage`

Salvage materials from a just-hunted creature (requires Skinning Blade, must be `afterHunt: true`).

**Body** `{ "creatureName": string, "roll": number }`

**Response** `{ materials, artisanSheet, adventurer }`

---

### Maps

All map routes return `Content-Type: image/svg+xml` (raw SVG, no JSON wrapper).

Optional query parameter: `?hexSize=36` (pixel size per hex, default 36).

#### `GET /api/v1/worldbuilder/:id/map/world`

Full Valoria world overview (800×600 SVG). Unvisited continents shown as fog-of-war.

---

#### `GET /api/v1/worldbuilder/:id/map/current`

Current hex sheet (continent) as a pointy-top hex grid SVG.

---

#### `GET /api/v1/worldbuilder/:id/map/sheet/:sheetId`

Specific hex sheet by sheet ID (1-based).

---

## WebSocket

### `GET /ws/party/:partyId`

Upgrade to a WebSocket connection for real-time party events. No auth required.

**Inbound events** (server → client):

| Type | When | Payload |
|---|---|---|
| `COMBAT_START` | Combat started | `{ monster }` |
| `TURN_RESOLUTION` | All party members submitted | `{ resolution }` |

**Usage** (JavaScript):
```js
const ws = new WebSocket("ws://localhost:4200/ws/party/<partyId>");
ws.onmessage = (e) => {
  const { type, ...payload } = JSON.parse(e.data);
  // handle type
};
```
