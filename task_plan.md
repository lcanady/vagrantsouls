# World Builder Backend Implementation Plan

## Goal
Implement Book 6 — D100 Dungeon World Builder as a full backend module, following the same patterns as the existing Book 1/2/4 systems.

## Status: PLANNING

---

## Phases

### Phase 1: Data Tables + Models  `[ ]`
**Files to create:**
- `src/data/world_builder/terrain_table.ts` — (WB) T: 10 terrain types with MOVE, FP, RP, settlement%, road%, river%, pop%, colour
- `src/data/world_builder/events_table.ts` — (WB) E: 100 rolls × 11 terrain/settlement columns → event name
- `src/data/world_builder/names_table.ts` — (WB) N: 100 rows with prefix, suffix, person, hex name, mount name
- `src/data/world_builder/quests_table.ts` — (WB) Q: 100 quest entries with details and Q¢
- `src/data/world_builder/quest_rewards_table.ts` — (WB) QR: reward table by RV + d6
- `src/data/world_builder/side_quests_table.ts` — (WB) SQ: 10 side quest templates
- `src/data/world_builder/settlements_table.ts` — (WB) S: 11 steps × 4 settlement types
- `src/data/world_builder/random_treasure_table.ts` — (WB) RT: 1d10 result → table lookup
- `src/data/world_builder/new_items_table.ts` — (WB) NI: 6 items × 4 settlement prices
- `src/data/world_builder/unique_treasures_table.ts` — (WB) UT: 12 unique artefacts

**Model additions (src/models/adventurer.ts):**
- Add `worldBuilder?: WorldBuilderStateSchema` (nullable optional)
- WorldBuilderState contains: hexSheets, currentHexId, calendar, mounts, lawlessPoints, wbQuests, completedLands, hexSheetCount, circledDates, fatigue

---

### Phase 2: WorldBuilderSetupService  `[ ]`
`src/services/WorldBuilderSetupService.ts`

**Methods:**
- `initializeWorld(adventurer, opts)` — full map setup (steps 1-12 from rulebook)
  - Creates home hex based on race terrain preference
  - Generates home hex name, settlement, roads, rivers
  - Places starting Q1/Q2/Q3 in directions rolled by d6
  - Generates all 3 quest hexes and quest details
  - Creates initial calendar (year 1072/1074/1075)
  - Initializes 15 rations, 2 starting skills at +5
  - Sets lawlessPoints = 0
- `generateHex(hexSheets, hexId, adjacentHexes)` — procedural hex gen (6 steps)
  - 1. Terrain type (d100 on terrain table)
  - 2. Hex name (unique on sheet)
  - 3. Settlement (d100 vs %, then d6 for type)
  - 4. Settlement name (prefix + suffix, unique)
  - 5. Roads & rivers (%, direction d6, splits)
  - 6. (Colour — just stored, not rendered)
- `generateQuestDetails(hexId, repRolls)` — fills Q¢, P¢, details, RV, S/F/ENC

---

### Phase 3: WorldBuilderCalendarService  `[ ]`
`src/services/WorldBuilderCalendarService.ts`

**Methods:**
- `markDay(state)` — checks off 1 day on calendar:
  - Spends 1 ration (adventurer + each mount)
  - Applies mount malnutrition if not fed
  - Checks trigger day symbols: R (religious -10 event), S (satanic +10 event), o (guild fee 100gp), * (werewolf check d100≤5), disease/poison tests
  - Checks circled dates (STOLEN MOUNT, AT WAR, BITE, etc.)
  - Returns UpkeepReport-style result
- `markDays(state, count)` — mark N days at once
- `applyFatigue(state, pips)` — shade fatigue track; fatigue check if new month
- `checkYearEnd(state)` — apply -1 STR, -1 DEX, +2 INT
- `getSeasonModifier(month)` — returns +5/+10/-5/-10 for Spring/Summer/Autumn/Winter
- `addCircledDate(state, date, entry, ongoing)` — record future-triggered event

---

### Phase 4: WorldBuilderActionService  `[ ]`
`src/services/WorldBuilderActionService.ts`

**Methods (one per action type):**
- `restAction(state)` — 2 AP: remove 1 fatigue; markDays(2)
- `scoutAction(state, targetHexId)` — 2 AP: generateHex; check event vs terrain pop%; markDays(2)
- `forageAction(state, method, roll)` — 1 AP: HARVESTING/TRAPPING/HUNTING test vs Str/Dex/Int-FP; gains rations+forage bonus ç; markDay(1)
- `fishingAction(state, useBait, roll)` — 1 AP: FISHING test vs Dex-FP; success=rations; fail=rod damage pip; markDay(1)
- `moveAction(state, targetHexId)` — variable AP: look up terrain move cost; apply road/river/sea modifiers (roads -2AP, rivers +2AP if crossing, sea 8AP+60gp); markDays(apCost); check events during move
- `cartAction(state, roll)` — 1 AP: roll vs population%; success=move action at -3AP; fail=event; markDay(1)
- `rideAction(state, mountIndex, roll)` — 1 AP: RIDING test Dex-RP; success=move-3AP; fail=move-2AP + HP damage; markDay(1)
- `layOfTheLandAction(state, targetHexId, roll)` — 1 AP: roll vs population-5%×distance; success=generateHex; fail=event; markDay(1)
- `newsOfQuestsAction(state, targetHexId, roll)` — 1 AP: roll vs population-5%×distance; success=generateQuest; fail=event; markDay(1)
- `makeCampAction(state)` — 2 AP: add camp ▲ to current hex; markDays(2)
- `questAction(state, questCode)` — delegates to quest resolution; tracks quest time track on calendar

---

### Phase 5: WorldBuilderQuestService  `[ ]`
`src/services/WorldBuilderQuestService.ts`

**Methods:**
- `generateQuest(state, rolls)` — full quest generation:
  - Find next Q slot (Q1–Q25)
  - Roll location: d6 direction + d3 distance (skipping occupied hexes)
  - If hex blank → generateHex
  - Fill quest details: #, Q¢, details (NPC via names table), P¢, H¢ from hex, RV = Q¢+P¢+H¢, d6 on QR table → S/F/ENC
- `generateSideQuest(state, monsterRoll, tableChoice)` — 1d10 → SQ table; find/replace MONSTER name; generate encounter modifier
- `completeQuest(state, questCode, success)` — mark quest on sheet; apply S or F rewards; return updated adventurer
- `canCompleteQuest(state, questCode)` — check hand-in items present

---

### Phase 6: WorldBuilderSettlementService  `[ ]`
`src/services/WorldBuilderSettlementService.ts`

**Methods (mirrors DowntimeService but with WB pricing):**
- `settlementAction(state, settlementType)` — runs all 11 steps:
  1. Refresh Tracks — not available at WB settlements (time not reset this way)
  2. `heal(state, settlementType, hpAmount)` — prices per (WB) S table
  3. `repairItem(state, settlementType, itemId, pips, haggled)` — unlock roll + price adj
  4. `sellItem(state, settlementType, itemId, buyerRoll)` — find-buyer roll
  5. `buyNeeded(state, settlementType, tableRoll, itemName, haggledRoll)` — price adj by settlement
  6. `searchMarket(state, settlementType, table, roll, haggledRoll)` — A/W/P/TA/TB/TC availability
  7. `train(state, settlementType, target, unlockRoll)` — higher prices at lower settlements
  8. `magicTuition(state, settlementType, spellName, unlockRoll)` — 1750/1500/1250/1000gp
  9. `empireBuilding(state, settlementType, unlockRoll, roll)` — conditional availability
  10. `witchery(state, settlementType, parts, roll)` — witch suspicion accumulator → WITCHERY event
  11. `artisan(state, settlementType, unlockRoll, action)` — partial artisan steps by settlement
- `checkLawless(state, settlementType)` — d10 + LP vs law modifier → LAW event
- `checkQuestRumour(state, settlementType, roll)` — % chance → generateQuest
- `checkEvent(state, settlementType, roll)` — % chance → trigger event

---

### Phase 7: WorldBuilderMountService  `[ ]`
`src/services/WorldBuilderMountService.ts`

**Methods:**
- `buyMount(state, type, cost)` — add to mount sheet (max 6)
- `sellMount(state, mountIndex, settlementType, buyerRoll)` — malnutrition check first
- `feedMount(state, mountIndex, double)` — consume rations; double=recover 1 malnutrition pip
- `addSaddlebag(state, mountIndex, cost, availabilityRoll)` — max 4 per mount
- `stowItem(state, itemId, mountIndex, bagSlot)` — only during WB phase (not questing)
- `unloadItem(state, mountIndex, bagSlot)` — return to adventurer sheet
- `checkLeavingMounts(state, questTimePips)` — 5%×pips chance → d10 per mount → lost/stolen/eaten
- `stolenMountCheck(state, stolenMountEntry, daysSinceTheft, roll)` — per rulebook stolen mount check steps
- `checkMalnutrition(state)` — apply/remove pips; d6 death check if track full

---

### Phase 8: WorldBuilderEventService  `[ ]`
`src/services/WorldBuilderEventService.ts`

**Methods:**
- `rollEvent(state, roll, settlementOrTerrain)` — looks up (WB) E table → event name
- `resolveEvent(state, eventName, contextRolls)` — dispatches to 60+ event handlers
- Each event as a named method (ATTACK, AVALANCHE, BITE, BOGLAND, BOOTY, BRAWL, BURGLARY, CAMEL, CAPTURE, CHANGE, CIRCUS, CONFRONT_MOUNT_THIEF, CROSSWINDS, FARM, FAY, FLASH_FLOODS, FOG, FORAGE_FISH, GAMBLE, GUILD, HANGING, HUNTED, HYBRID, IDENTITY, IMPASSABLE, ISLAND, JAIL, JUNGLE_FEVER, JUNGLE_WORM, LANDSLIDE, LAW, LOST, LUCKY_FIND, MALARIA, MIRAGE, MISSING, MONSTER, MOON, MOUNTS, MOUNT_THEFT, MYSTIC, NOMADS, OASIS, OUTPOST, PIRATES, PLAGUE, POISONOUS, QUEST, QUICKSAND, RAFT, RELATIVE, REPORT, REVENGE, ROBBED, ROMANCE, RUMOURS, RUNAWAY, SAND_STORM, SEA_FOG, SEA_MONSTER, SEA_STORMS, SIDE_QUEST, SHIP_ATTACK, SHIPMATES, SHRINE, SLAVERY, SNOWFALL, SQUALL, STALKED, STEAL_MOUNT, STEALING, STOLEN_ITEMS, STORMS, STRANGER, SWAMP_GAS, SWARMS, SWIM, TAVERN, TREASURE, VAMPIRE, WANTED, WAVES, WEREWOLF, WILDFIRE, WITCH, WITCHERY)

---

### Phase 9: Routes  `[ ]`
`src/routes/world_builder.ts`

**Endpoints under `/api/v1/worldbuilder/:adventurerId/`:**

Setup:
- `POST /setup` — initializeWorld (race-based starting hex, calendar, 3 quests)
- `POST /setup/hex` — generateHex for blank adjacent hex

Map state:
- `GET /state` — current WB state (hex sheet, position, calendar, mounts)
- `GET /hexes` — all generated hexes on current sheet

Calendar:
- `POST /calendar/mark-day` — mark 1 day (rations, triggers)

Actions:
- `POST /action/rest` — 2 AP
- `POST /action/scout` — 2 AP, generates adjacent hex
- `POST /action/forage` — 1 AP, method + rolls
- `POST /action/fish` — 1 AP, fishing test
- `POST /action/move` — move to adjacent generated hex
- `POST /action/cart` — hitch a cart ride
- `POST /action/ride` — ride action
- `POST /action/lay-of-land` — scout distant hex
- `POST /action/news-of-quests` — discover quest in distant hex
- `POST /action/make-camp` — create camp ▲ in current hex
- `POST /action/settlement` — full settlement action flow

Quests:
- `POST /quests/generate` — generate new quest at location
- `POST /quests/generate-side` — generate side quest
- `POST /quests/:code/complete` — mark quest complete/failed
- `GET /quests` — list all WB quests on current sheet

Mounts:
- `POST /mounts/buy` — purchase mount at settlement
- `POST /mounts/:index/sell` — sell mount
- `POST /mounts/:index/feed` — feed mount (double for malnutrition recovery)
- `POST /mounts/:index/saddlebag` — buy saddlebag
- `POST /mounts/:index/stow` — stow item to saddlebag
- `POST /mounts/:index/unload` — retrieve item from saddlebag
- `GET /mounts` — list all mounts with saddlebag contents

Events:
- `POST /events/roll` — roll event for current terrain/settlement
- `POST /events/resolve/:eventName` — resolve specific event with context rolls

Travel:
- `POST /travel/deep-sea` — enter deep sea hex (pay fee)
- `POST /travel/new-land` — arrive in new land (generate first hex)

---

## Key Data Model Design

### HexData
```typescript
{
  id: string  // "s1:q0,r0" (sheet 1, axial col 0, row 0)
  sheetId: number
  terrain: TerrainType
  name: string
  rewardAdjustment: number  // ¢ from hex name (e.g. +1, -1)
  settlement?: { type: "camp"|"village"|"town"|"city", name: string }
  roads: number[]  // edges that have roads (1-6)
  rivers: number[]  // edges that have rivers (1-6)
  questCode?: string  // "Q1"-"Q25"
  completedSideQuest?: string
  atWar?: boolean  // AT WAR -10 modifier
  generated: true
}
```

### WBQuestRecord
```typescript
{
  code: string  // "Q1"-"Q25"
  hexId: string
  tableRoll: number  // #
  details: string
  qc: number  // Q¢
  pc: number  // P¢ (from NPC)
  hc: number  // H¢ (from hex)
  rv: number  // Reward Value
  success: string  // [S] text
  failure: string  // [F] text
  encMod: number
  status: "active"|"complete"|"failed"
  npc?: string
}
```

### CalendarState
```typescript
{
  year: number  // 1072 / 1074 / 1075
  month: number  // 1-12
  day: number   // 1-30 or 1-31
  rations: number  // 0-30 on calendar sheet
  fatigue: number  // 0-10 pips
  questTimePips: number  // &-pips from quest time track
  circledDates: CircledDate[]
  lawlessPoints: number
}
```

### Mount
```typescript
{
  slotNumber: number  // 1-6
  name: string
  type: "horse"|"camel"|"mule"|"dragon"|"unicorn"|"flying_carpet"|string
  rations: number  // 0-30
  malnutrition: number  // 0-10 pips
  saddlebags: SaddlebagSlot[]  // max 4
  notes: string
  value: number  // e.g. 1500 for horse
}
```

---

## Architecture Decisions

1. **Hex coordinates**: Axial (q, r) for adjacency math; stored as string `"q:0,r:0"`. Direction hex maps d6 to axial directions.
2. **Return pattern**: `{ adventurer, result }` matching most existing services.
3. **No hex image generation** in backend — that's the Discord bot's job.
4. **Hex sheets**: Array of `{ sheetId, hexes: Record<string, HexData> }`. Multiple sheets linked for travel.
5. **Calendar triggers**: Encode trigger day symbols in a lookup. Calendar runs Mon-Sun × 30/31 days per the WB calendar layout.
6. **Events**: Return structured `EventResult` not just strings, so bot/frontend can react to each piece.

---

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|

---

## Files Modified/Created
*(updated as work progresses)*
