# Data Models

All models are defined with [Zod](https://zod.dev/) in `server/models/`. TypeScript types are inferred via `z.infer<>`.

---

## Table of Contents

- [GameState](#gamestate)
- [Adventurer](#adventurer)
  - [Core Stats](#core-stats)
  - [Equipment Slots](#equipment-slots)
  - [Resources](#resources)
  - [Status Effects](#status-effects)
  - [Quest Tracking](#quest-tracking)
  - [Beast](#beast-sub-object)
  - [Arcanist](#arcanist-sub-object)
  - [Artisan](#artisan-sub-object)
  - [WorldBuilderState](#worldbuilderstate-sub-object)
  - [Book 8 Extensions](#book-8-extensions)
- [Item](#item)
- [Monster](#monster)
- [Party](#party)

---

## GameState

Persisted to Deno KV as `["adventurers", <uuid>]`.

```ts
{
  adventurer:   Adventurer          // full adventurer object
  timeTrack:    number              // 0–20 upkeep pips
  currentArea?: number             // dungeon area number
  currentRoom?: {
    id?:       string               // uuid
    roll:      number               // d100 room roll
    color:     string               // "Yellow" | "Blue" | "Red" | ...
    exits:     number               // number of exits
    features:  string[]             // e.g. ["Trap", "Chest"]
    searched:  boolean
  }
  startedAt:    string              // ISO datetime
  lastSavedAt:  string              // ISO datetime
}
```

---

## Adventurer

The central game object. Every service reads and returns an updated `Adventurer`.

### Core Stats

| Field | Type | Notes |
|---|---|---|
| `id` | `string (uuid)` | Adventurer UUID |
| `userId` | `string (uuid)?` | Owning user UUID |
| `name` | `string` | |
| `hp` | `number` | Current HP |
| `maxHp` | `number` | Max HP |
| `fate` | `number` | Fate points |
| `life` | `number` | Life points |
| `str` | `number` | Strength stat (default 50) |
| `dex` | `number` | Dexterity stat (default 40) |
| `int` | `number` | Intelligence stat (default 30) |
| `experiencePips` | `number` | XP pips (10 pips = +5 to a stat) |
| `reputation` | `number` | Rep score |
| `path` | `string?` | Hero path (see Chargen) |
| `race` | `string?` | Race (see Chargen) |

### Equipment Slots

| Field | Type | Notes |
|---|---|---|
| `head` | `Item \| null` | Head slot |
| `torso` | `Item \| null` | Torso/armour slot |
| `back` | `Item \| null` | Back/cloak slot |
| `mainHand` | `Item \| null` | Main hand (rHand) |
| `offHand` | `Item \| null` | Off hand (lHand) |
| `belt1` | `Item \| null` | Belt slot 1 |
| `belt2` | `Item \| null` | Belt slot 2 |
| `backpack` | `Item[]` | General inventory |

### Resources

| Field | Type | Notes |
|---|---|---|
| `gold` | `number` | Gold pieces |
| `oil` | `number` | Oil for lantern upkeep |
| `food` | `number` | Food rations |
| `picks` | `number` | Lock picks |
| `skills` | `Record<string, number>` | Skill name → bonus, e.g. `{ "Bravery": 15 }` |
| `spells` | `Record<string, number>` | Spell name → pips |
| `investments` | `Record<string, { shares, pips }>` | Empire building investments |

### Status Effects

| Field | Type | Notes |
|---|---|---|
| `poison` | `number` | Poison counter (0 = none) |
| `disease` | `number` | Disease counter (0 = none) |
| `darkness` | `boolean` | In darkness (no lantern) |
| `starvation` | `boolean` | Starving |

### Quest Tracking

| Field | Type | Notes |
|---|---|---|
| `campaignQuests` | `Record<string, "pending"\|"complete"\|"failed">` | CQ1–CQ20 |
| `sideQuests` | `Record<string, "complete"\|"failed">` | QAA–QAY |
| `questsCompleted` | `number` | Cumulative total |
| `questsFailed` | `number` | Cumulative total |

### Witchery Fields

| Field | Type | Notes |
|---|---|---|
| `monsterParts` | `{ name, rarity, value }[]` | Looted parts inventory |
| `witcheryFormulas` | `Record<string, WitcheryFormula>` | Learned formulas; key = sorted part names joined by `\|` |
| `witcheryEffects` | `string[]` | Active effects this quest |
| `witcheryMishaps` | `string[]` | Active mishap penalties this quest |

### Beast Sub-object

Present when `beast` is non-null.

```ts
{
  name:             string
  level:            number (1–10)
  bonus:            number          // combat bonus (can be negative)
  gpValue:          number          // gold value per level
  abilities:        string[]        // e.g. ["Guard", "Guide", "Attack"]
  hp:               number          // max HP at current level
  currentHp:        number
  trainingPips:     number (0–10)
  isCooperative:    boolean         // false after failed TRAIN
  isDragonHatchling: boolean
  dragonHearts:     number (0–2)    // Dragon Hatchling revival uses
}
```

### Arcanist Sub-object

Present when `arcanist` is non-null.

```ts
{
  order:               "Alchemy" | "Elements" | "Illusion" | "Invocation"
                     | "Psyche" | "Summoning" | "Esoteric"
  rank:                "Initiate" | "Neophyte" | "Apprentice" | "Magi"
                     | "Adept" | "Tyro Magister" | "Magister"
                     | "Tyro Magus" | "Magus" | "Master Magus"
  arcanistSpells:      string[]           // spells in the spell book
  ingredientsBagActive: boolean
  ingredients:         Record<string, number>  // ingredient → qty
  arcaneLawBroken:     number            // running total; resets on concealment
  stafeEnergy:         number            // energy in stave/quarterstaff
}
```

### Artisan Sub-object

Present when `artisan` is non-null.

```ts
{
  art:                    number (0–80)  // ART skill (default 40)
  salvageSkill:           number (0–20)
  craftingSkill:          number (0–20)
  artExperiencePips:      number
  salvageExperiencePips:  number
  craftingExperiencePips: number
  materials:              Record<string, number>  // material name → qty
  schematics:             Schematic[]
  scrapsPips:             number (0–50)  // dungeon scraps track
  guildStoragePaid:       boolean
}
```

**Schematic shape:**
```ts
{
  name:               string
  modifier:           number         // roll modifier for crafting
  standardMaterials:  Record<string, number>
  upgradedMaterials:  Record<string, number>
  gpValue:            number
  slot?:              string
  dmg?:               number
  def?:               number
  str?:               number
  dex?:               number
  int?:               number
  hp?:                number
}
```

### WorldBuilderState Sub-object

Present when `worldBuilder` is non-null. See [World Builder Models](#worldbuilderstate-detail) below.

### Guild Fields

| Field | Type | Notes |
|---|---|---|
| `guildId` | `string \| null` | ID of current guild |
| `guildStanding` | `number (0–100)` | Guild standing points |

### Book 8 Extensions

These fields are all `null | undefined` when not activated.

| Field | Type | Description |
|---|---|---|
| `butchery` | `{ br, pips }` | Butchery Roll track |
| `dualWield` | `boolean` | Dual-wield enabled |
| `weaponProficiency` | `Record<string, number>` | Weapon type → proficiency pips |
| `cheatDeath` | `"active" \| null` | Cheat Death ability status |
| `spellMana` | `SpellMana` | Mana pool (see below) |
| `ammunition` | `AmmunitionState` | Ammo holders (see below) |
| `herbBags` | `HerbBag[]` | Herbalism herb bags |
| `artisanSheet` | `Record<string, number>` | Mining/herbalism material store |
| `accolades` | `Record<string, boolean>` | Earned accolades map |
| `honourPoints` | `number` | Honour points total |
| `heroicItemTracker` | `{ pips }` | Heroic item pip track |
| `yellowEventTracker` | `{ pips }` | Yellow event track |
| `combatExperience` | `Record<string, number>` | Monster name → kill pips (max 20) |
| `property` | `Property` | Owned property |

**SpellMana shape:**
```ts
{
  primary:     number   // base mana from path
  adjusted:    number   // modifier from effects/equipment
  total:       number   // primary + adjusted
  current:     number   // remaining this quest
  magicPower:  boolean  // if true: spell fail = -1d3 HP (not Table C)
}
```

**AmmunitionState shape:**
```ts
{
  pouch?: { smoothStones: number, leadShot: number }
  quiver?: { bodkinArrows: number, broadheadArrows: number }
  bandolier?: { crossbowBolts: number, heavyQuarrels: number }
}
```

**Property shape:**
```ts
{
  name:        string
  slots:       number    // max items storable
  security:    number (0–90)
  upkeep:      number
  storedItems: string[]
}
```

---

## WorldBuilderState Detail

```ts
{
  hexSheets:          HexSheet[]        // all sheets ever visited
  currentSheetIndex:  number            // index into hexSheets
  currentHexId:       string            // axial: "q:0,r:0"
  calendar:           WBCalendar
  mounts:             WBMount[]         // max 6 slots
  lawlessPoints:      number
  witchSuspicion:     number
  wbStartingSkills:   string[]
  uniqueTreasuresFound: string[]
  hasBandOfUnity:     boolean
}
```

### WBCalendar

```ts
{
  year:           number (default 1072)
  month:          number (1–12)
  day:            number (1–31)
  rations:        number (0–30)
  fatigue:        number (0–10)
  questTimePips:  number
  circledDates:   CircledDate[]
}
```

### HexSheet

```ts
{
  sheetId:          number
  hexes:            Record<hexId, HexData>
  quests:           WBQuestRecord[]
  questsCompleted:  number
  isComplete:       boolean
  continentId?:     number   // links to Valoria continent (1–6)
  continentName?:   string   // e.g. "Caldoria"
}
```

Continent IDs: 1=Caldoria, 2=Pyrethum, 3=Verdenmoor, 4=Thalassus, 5=Frosthold, 6=Althenara.

### HexData

```ts
{
  id:                string        // "q:0,r:0"
  sheetId:           number
  terrain:           "Deserts" | "Tundras" | "Grasslands" | "Forests"
                   | "Jungles" | "Marshlands" | "Swamps" | "Hills"
                   | "Mountains" | "Seas"
  name:              string
  rewardAdjustment:  number
  settlement?:       { type: "camp"|"village"|"town"|"city", name: string }
  roads:             number[]       // edge directions 1–6
  rivers:            number[]       // edge directions 1–6
  questCode?:        string         // e.g. "Q1"
  completedSideQuest?: string
  atWar:             boolean
  hasCamp:           boolean
}
```

### WBQuestRecord

```ts
{
  code:            string     // "Q1" – "Q25"
  hexId:           string
  tableRoll:       number
  name:            string
  details:         string
  qc:              number     // quest coin value (Q¢)
  pc:              number     // person coin value (P¢)
  hc:              number     // hex reward adjustment (H¢)
  rv:              number     // reward value = Q¢ + P¢ + H¢
  successText:     string
  failureText:     string
  encMod:          number     // encounter modifier for quest
  npcName?:        string
  isUnique:        boolean
  requiresHandIn:  boolean
  status:          "active" | "complete" | "failed"
}
```

### WBMount

```ts
{
  slotNumber:     number (1–6)
  name:           string        // e.g. "Storm" (user-named)
  type:           string        // "horse", "mule", "dragon", etc.
  rations:        number (0–30)
  malnutrition:   number (0–10) // 10 = death check
  saddlebags:     SaddlebagSlot[]  // max 4
  notes:          string
  value:          number        // gp value
  isStolen:       boolean
  stolenDaysAgo:  number
}
```

---

## Item

Defined in `server/models/item.ts`.

```ts
{
  id?:          string (uuid)
  name:         string
  description?: string
  slot?:        EquipmentSlot
  modifiers?:   { str?, dex?, int? }
  twoHanded:    boolean
  usable:       boolean
  effect?:      string          // e.g. "HEAL:4", "BUFF:STR:5"
  damage?:      string          // e.g. "1d6", "2d4+2"
  bonus:        number          // attack/defense bonus
  value:        number          // sell value in gold
  fix:          number          // repair cost per pip
  damagePips:   number (0–5)    // wear track (5 = broken)
  // Book 8
  def?:         number          // defense value
  rv?:          number          // resilience value
  spiked?:      boolean         // spiked shield
}
```

**Equipment slots:** `Head`, `Torso`, `Back`, `MainHand`, `OffHand`, `Belt1`, `Belt2`.

---

## Monster

Defined in `server/models/monster.ts`. Generated by `EncounterService`.

```ts
{
  name:          string
  hp:            number
  damage:        string        // e.g. "1d6"
  bonus:         number        // combat bonus
  special?:      string[]      // special abilities
  monsterPart?:  string        // what part drops on kill
  partRarity?:   "normal" | "uncommon" | "scarce" | "rare"
}
```

---

## Party

In-memory only (not persisted to KV). Lives in `PartyService`.

```ts
{
  id:          string
  leaderId:    string         // adventurer ID of party leader
  members:     PartyMember[]
  createdAt:   string
}

// PartyMember
{
  adventurerId: string
  name:         string
}
```

---

## User

Persisted to Deno KV as `["users", username]`.

```ts
{
  id:           string (uuid)
  username:     string
  passwordHash: string       // bcrypt hash
  createdAt:    string       // ISO datetime
}
```

---

## KV Key Schema

| Key Pattern | Value | Description |
|---|---|---|
| `["adventurers", id]` | `GameState` | Single adventurer state |
| `["users", username]` | `User` | User by username |
| `["users", userId]` | `User` | User by ID |
| `["users", userId, "adventurers", id]` | `true` | Index: user → their adventurers |
| `["guild_members", guildId, advId]` | `GuildMemberRecord` | Guild membership |
| `["guild_events", guildId]` | `GuildEvent[]` | Last 20 guild events |
