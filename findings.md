# Research Findings — World Builder Implementation

## Source: books/world_builder.txt (5159 lines)

---

## Terrain Table (WB) T
10 terrain types, roll d100:

| Roll  | Terrain      | MOVE | FP         | RP  | Settlement% | Road% | River% | Pop% | Colour       |
|-------|-------------|------|------------|-----|-------------|-------|--------|------|--------------|
| 1-8   | Deserts      | 8 AP | -30 (5R)   | -10 | 15%         | 15%   | 15%    | 15%  | Yellow       |
| 9-16  | Tundras      | 4 AP | -10 (6R)   | -0  | 35%         | 30%   | 30%    | 40%  | Light Grey   |
| 17-31 | Grasslands   | 4 AP | -5 (9R)    | -0  | 40%         | 50%   | 30%    | 40%  | Green        |
| 32-43 | Forests      | 5 AP | -5 (9R)    | -15 | 25%         | 20%   | 45%    | 35%  | Light Green  |
| 44-52 | Jungles      | 6 AP | -5 (8R)    | -15 | 20%         | 15%   | 45%    | 25%  | Dark Green   |
| 53-60 | Marshlands   | 6 AP | -5 (8R)    | -10 | 35%         | 25%   | 60%    | 35%  | Purple       |
| 61-67 | Swamps       | 6 AP | -15 (8R)   | -10 | 20%         | 15%   | 60%    | 30%  | Light Purple |
| 68-80 | Hills        | 5 AP | -10 (7R)   | -5  | 30%         | 25%   | 35%    | 35%  | Brown        |
| 81-90 | Mountains    | 8 AP | -15 (7R)   | -20 | 25%         | 15%   | 40%    | 30%  | Grey         |
| 91-100| Seas         | 8 AP | -10 (6R)   | -   | -           | -     | -      | 15%  | Blue         |

FP format: "-X (YR)" where X=penalty to forage test, Y=rations gained on success
RP format: ride penalty to Dex test

Settlement/Road/River modifiers (cumulative where noted):
- +5% settlement if ♦ village, +10% if ● town, +20% if ■ city
- +10% road/river if 1+ roads flow to edge; +10% if 1+ rivers flow to edge

Population modifiers:
- +5% pop if ♦, +10% if ●, +20% if ■
- +10% pop if 1+ roads; +10% if 1+ rivers

---

## Events Table (WB) E — Key structure
12 columns: Settlement (▲♦●■), Deserts, Forests, Grasslands, Hills, Jungles, Marshlands, Mountains, Seas, Swamps, Tundras

Settlement column used when adventurer is at a settlement/camp. Terrain column used for exploration events.

| Roll  | Settlement | Desert       | Forest     | Grass      | Hills      | ...   | Seas         |
|-------|-----------|--------------|------------|------------|------------|-------|--------------|
| 1-5   | Lucky Find | Booty        | Booty      | Booty      | Booty      | ...   | Treasure     |
| 6-10  | Mounts    | Quest        | Quest      | Quest      | Quest      | ...   | Shipmates    |
| 11-20 | Guild     | Side Quest   | Side Quest | Side Quest | Side Quest | ...   | Side Quest   |
| 21-25 | Stranger  | Stranger     | Stranger   | Stranger   | Stranger   | ...   | Raft         |
| 26-30 | Wanted    | Wanted       | Wanted     | Wanted     | Wanted     | ...   | Island       |
| 31-35 | Shrine    | Shrine       | Shrine     | Shrine     | Shrine     | ...   | Shrine       |
| 36-40 | Tavern    | Oasis        | Forage/Fish| Farm       | Farm       | ...   | Forage/Fish  |
| 41-45 | Circus    | Camel        | Missing    | Rumours    | Rumours    | ...   | Missing      |
| 46-50 | Rumours   | Nomads       | Impassable | Flash Floods| Flash Floods|...  | Waves        |
| 51-55 | Burglary  | Outpost      | Outpost    | Outpost    | Outpost    | ...   | Pirates      |
| 56-60 | Relative  | Sand Storm   | Stalked    | Crosswinds | Crosswinds | ...   | Ship Attack  |
| 61-65 | Mystic    | Quicksand    | Swarms     | Wildfire   | Wildfire   | ...   | Pirates      |
| 66-70 | Robbed    | Mirage       | Fay        | Fog        | Landslide  | ...   | Sea Fog      |
| 71-75 | Romance   | Lost         | Lost       | Lost       | Lost       | ...   | Lost         |
| 76-80 | Identity  | Storms       | Storms     | Storms     | Storms     | ...   | Sea Storms   |
| 81-85 | Brawl     | Poisonous    | Poisonous  | Poisonous  | Poisonous  | ...   | Poisonous    |
| 86-90 | Attack    | Attack       | Attack     | Attack     | Attack     | ...   | Stealing     |
| 91-95 | Mount Theft| Monster     | Monster    | Monster    | Monster    | ...   | Sea Monster  |
| 96-99 | Plague    | Plague       | Plague     | Plague     | Plague     | ...   | Pirates      |
| 100   | Vampire   | Vampire      | Vampire    | Vampire    | Vampire    | ...   | Squall       |

---

## Calendar Structure
- 12 months, 364 days total (30/31 days per month)
- Week: Mon-Thu × 7 days
- Year starts on Friday (1st of 1st month)
- Year ends on Thursday

**Trigger day symbols per month (fixed positions in the calendar grid):**
- `R` = Religious day (1st of month): event roll -10 + guild fee if applicable
- `o` = Guild day: pay 100gp or lose guild status
- `T` = 3rd of month: (no special rule stated beyond trigger)
- `*` = 11th of month: full moon — d100≤5 = WEREWOLF event
- `S` = Satanic day (16th): event roll +10
- `G` = 19th/20th: disease/poison test
- `@` = 26th: (growing old marker at year end)

**Season forage bonus ç:**
- January: ç-2, February: ç-1, March-April: ç0, May-June: ç+1
- July: ç+1, August: ç+2, September: ç+2, October: ç+1, November: ç0, December: ç-1

**Year-end aging:** -1 STR, -1 DEX, +2 INT

---

## Settlement Table (WB) S — All 11 Steps
*(camp ▲, village ♦, town ●, city ■)*

Step 1 REFRESH TRACKS: Never performed at WB settlements (n/a for all)
Step 2 HEAL:
  - HP: 40/30/25/20gp per HP
  - Poison: (35%¹)70 / (50%¹)60 / (75%¹)50 / 40gp per pip
  - Disease: (35%¹)110 / (50%¹)95 / (75%¹)80 / 65gp per pip
Step 3 REPAIR: +(30%¹+30) / +(50%¹+20) / +(75%¹+10) / +0 per pip
Step 4 SELL: (35%x) / (50%x) / (75%x) / always
Step 5 BUY NEEDED (price over base):
  - N 1-45: +3 / +2 / +1 / 0
  - N 46-70: (35%¹)+30 / (50%¹)+20 / +10 / 0
  - N 71-97: (35%¹)+60 / (50%¹)+40 / (75%¹)+20 / 0
  - N 98-100: not avail / (50%¹)+120 / (75%¹)+100 / 0
Step 6 SEARCH MARKETS:
  - A&W: (35%¹)+30 / +20 / +10 / 0
  - P (witchery): (35%¹)+20 / (50%¹)+10 / 0 / 0
  - TA/TB/TC: not avail / (50%¹)+40 / (75%¹)+20 / 0
Step 7 TRAINING:
  - Skill: (35%¹)350 / (50%¹)300 / 250 / 200gp
  - Stat: (35%¹)3500 / (50%¹)3000 / (75%¹)2500 / 2000gp
  - HP: not avail / (50%¹)30000 / (75%¹)25000 / 20000gp
Step 8 MAGIC TUITION: (35%¹)1750 / (50%¹)1500 / 1250 / 1000gp
Step 9 EMPIRE BUILDING: (35%¹) / (50%¹) / (75%¹) / always
Step 10 WITCHERY: witch event %: (10%¹) / (50%¹) / (75%¹) / (80%)
Step 11 ARTISAN: (35%¹)steps 1&2 / (50%¹)1-3 / (75%¹)1-4 / all
QUESTS: 20% / 30% / 40% / 50%
LAW modifier: +2 / +1 / +0 / -1
EVENT: 35% / 50% / 75% / 80%

---

## New Items Table (WB) NI
| d6 | Item          | Camp    | Village | Town  | City  | Sell  |
|----|--------------|---------|---------|-------|-------|-------|
| 1  | LINE         | (35%)7  | 6       | 5     | 4gp   |       |
| 2  | BAIT         | (35%)7  | 6       | 5     | 4gp   |       |
| 3  | RATION       | 14      | 12      | 10    | 8gp   |       |
| 4  | FISHING ROD* | (35%)35 | 30      | 25    | 20gp  | 5gp   |
| 5  | SADDLEBAGS   | N/A     | (50%)70 | 60    | 50gp  |       |
| 6  | HORSE        | N/A     | (50%x)1800 | (65%x)1650 | 1500gp | |
| - | SCROLL TELEPORT| N/A   | (50%x)600 | (65%x)500 | 400gp |    |

---

## Side Quests (WB) SQ — 10 templates (d10)
1. Hollow — 4 areas, monster in last, 1 treasure, ENC -25
2. Pit — 6 areas, monster in last, 1 treasure, ENC -20
3. Stash — 6 areas, trapped, HIDDEN TRAP at end, 2 treasures, ENC -15
4. Burrow (demon) — 8 areas, fire damage each area, demon each area, ENC -10
5. Crypt (undead) — 8 areas, undead each area, 3 treasures, ENC -5
6. Den — 8 areas, monster each area, 3 treasures, ENC +0
7. Labyrinth — 10 areas, trapped, monster in last, 4 treasures, ENC +5
8. Sanctuary (demon) — 10 areas, fire+demon each area, 4 treasures, ENC +10
9. Tomb (undead) — 12 areas, undead each area, 5 treasures, ENC +15
10. Lair — 12 areas, monster each area, 5 treasures, ENC +20

---

## Quest Rewards (WB) QR
RV is Q¢+P¢+H¢. Roll d6 per RV band for S/F text.
RV bands observed: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 (100 quests, Q¢ ranges 0-9)
ENC modifier also determined from the QR table.

---

## Random Treasure (WB) RT
d10:
1. Roll table P1 +10gp
2. Roll table P2 +10gp
3. Roll table N +20gp
4. Roll table A +20gp
5. Roll table W +20gp
6. Roll table I
7. Roll table I
8. Roll table TB
9. Roll table TC
10. Roll table TA/TB/TC/TD (choice)

---

## Mount Rules — Key Facts
- Max 6 mounts (recommended 1-2)
- Horses: 1500gp base, can be ridden
- Mules: 600gp, cannot be ridden
- Dragon mount: uses all 6 slots, ignores RP, doesn't eat, immune to theft/eaten events
- Unicorn: doesn't use slot, +10 spell bonus, can't be sold/fitted
- Flying Carpet: backpack item, uses Int not Dex for riding, ignores RP
- Saddlebags: max 4 per mount, 50gp each; each bag = 1 damage-track slot + 2 qty-10 slots
- Malnutrition track: shade 1 pip if not fed; full track = d6 death check on 6; recover with double rations
- Rations per mount: up to 30
- Stolen mount check: if <100 days since theft, roll d100; if roll ≥ days elapsed = spotted thief

---

## Hex Generation Algorithm
Steps:
1. Roll d100 on terrain table → terrain type
2. Roll d100 on names table → hex name (must be unique on sheet)
3. Roll d100 vs settlement% (with settlement modifiers) → ∅ or village/town/city (d6: 1-3=♦, 4-5=●, 6=■)
4. If settlement: 2×d100 on names table → prefix+suffix (must be unique on sheet)
5. Roads: roll d100 vs road% → if yes: d6 direction, d6 split (5=1 extra, 6=2 extra), re-roll for split directions; check adjacent hexes for joining roads (joining rules pp.24-25)
6. Rivers: same as roads but rivers join other rivers only (max 4 edges)

Joining logic for roads/rivers:
- 1 adjacent: start from that edge, flow to opposite, roll splits normally
- 2 adjacent: join the two rivers, roll splits normally
- 3 adjacent: join all three, only roll of 6 causes split
- 4+ adjacent: join 4 (random if >4), no splits

Sea hex rules:
- Must reach nearest edge or another sea hex (shortest path)
- Must be named

---

## Quest Generation — Full Flow
1. Find next Q slot on quest sheet (Q1–Q25)
2. Roll d6 for direction + d3 for distance (skip occupied hexes)
3. Write quest code in hex space; generate hex if blank
4. Roll REP times on (WB) Q table, player picks preferred quest; record # and Q¢
5. Read bold details; generate [PERSON] if needed via names table; roll any variable quantities; record P¢
6. Check hex for H¢ (reward adjustment from hex name)
7. RV = Q¢ + P¢ + H¢
8. Roll d6 on (WB) QR at RV band → ENC, [S], [F]

---

## Key Action Point Costs
- Rest: 2 AP
- Scout: 2 AP
- Forage: 1 AP (up to 3x)
- Fish: 1 AP (up to 3x)
- Cart: 1 AP (then move at reduced cost)
- Ride: 1 AP (then move action)
- Move: terrain base - road bonus ± modifiers (min 1 AP)
  - Desert/Mountain/Sea: 8 AP base
  - Forest/Jungle/Marsh/Swamp: 5-6 AP base
  - Grassland/Tundra/Hill: 4-5 AP base
  - Road: -2 AP; River crossing (no road): +2 AP; Sea exit: pay 60gp
- Lay of Land: 1 AP
- News of Quests: 1 AP
- Make Camp: 2 AP
- Camp/Settlement: 1 AP
- Quest/Side Quest: variable (based on quest time track resets × AP)
- Deep Sea crossing: 8 AP per hex + 100gp (+ 50gp/mount)
- Travel to Adventure/Campaign: 8 AP + 200gp (+ 100gp/mount)

---

## Forage Mechanics
Three methods:
- HARVESTING: Test Int -FP [S: gain rations+ç] [F: Poisoned, +1d3 poison pips] (Aware, Survival)
- TRAPPING: Test Dex -FP [S: gain rations+ç] [F: attacked by PREY MONSTER] (Traps, Hunting)
- HUNTING: Test Str -FP [S: gain rations+ç] [F: attacked by PREY MONSTER] (Agility, Hunting)

PREY MONSTER: AV 30, Def 0, Dmg -1, HP 10
Kill = gain half rations+ç; Surprise ability

---

## Existing Codebase Patterns
- Services return `{ adventurer, result }` (most) or `{ result }` (ArcanistService)
- Routes use `loadAdventurer` middleware, save with `repo.saveAdventurer()`
- Data tables as TS arrays/objects in `src/data/`
- Zod models in `src/models/`
- Routes in `src/routes/`, registered in `src/main.ts`
- KV key for adventurer: `["adventurers", id]` → GameState
- GameState = `{ adventurer, timeTrack, currentArea, currentRoom, startedAt, lastSavedAt }`

## Important: Model Return Difference
WorldBuilderState lives INSIDE adventurer (like `arcanist`, `beast`, `artisan`).
The GameState wraps adventurer. WorldBuilder services should return `{ adventurer, result }`.
