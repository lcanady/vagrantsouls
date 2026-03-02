# Book 8: The Forgotten Tome of Curious Rules

## Goal
Implement all rules from Book 8 into the D100 Dungeon API as opt-in systems layered onto existing dungeon, World Builder, and combat services.

---

## Scope Summary

Book 8 adds **34 distinct rule systems** across 3 domains:
- **Core Dungeon**: Butchery, Dual Wield, Weapon Proficiency, Cheating Death, Secret Passageways, Pursuit, More Monsters, Unidentified Items, Yellow Events, Epic Dungeons, Heroic Items, Accolades, Honour Points, Monsters Aren't What They Seem, Easy/Hard Mode, Mapping Complex, Movement Rules
- **Combat Extensions**: Ammunition, Thrown Weapons, Aimed Attacks, Reinforced Belts, Spiked Shields, Spell Mana, Magic Power, Summon Spell
- **World Builder Extensions**: Herbalism, Mining, Skinning, Property (WB), Death (WB), Party Play (WB), New Races (RB)

Tables added: `IB`, `LA`, `MC`, `QE`, `RB`, `YE`, `(WB) H`, `(WB) M`

---

## Phase 1: Data Tables
*Files in `server/data/curious_rules/`*

- [ ] **`herbalism_table.ts`** — terrain × herb matrix (10 terrains × 10 herbs), 18 recipes with ingredient lists and effects → Verify: all 10 results per terrain present, all 18 recipes parseable
- [ ] **`mining_table.ts`** — terrain × material matrix (10 terrains × 10 results: 5 ingot types + 5 shard/crystal types), GM modifiers → Verify: all 100 cells populated
- [ ] **`identify_table.ts`** — Table IB: cursed items (97 entries), Brew Lesser/Finer/Greater/Superior/Exceptional, Potion Lesser→Exceptional, Elixir Finer→Exceptional, Legendary (rollable by type) → Verify: all tiers and types present, cursed roll offsets correct
- [ ] **`legends_a_table.ts`** — Table LA: 100 entries (d100 1-100), adjustment/value/fix/mana-name per entry → Verify: 100 rows, no duplicates, all fields present
- [ ] **`quests_e_table.ts`** — Table QE: 10 quests (1-10, 11-20 … 91-100), each with enc mod, success/fail rewards, boss monsters if applicable → Verify: 10 quest objects with valid monster stats
- [ ] **`race_b_table.ts`** — Table RB: 4 new races (Gnome, Dragon Scar, Half Orc, Wood Elf) with stat mods, skill bonuses, starting values → Verify: 4 races, all bonuses match book
- [ ] **`yellow_events_table.ts`** — Table YE: events 1-88+ (d100 roll to event), each event as structured object (tests, damage, monster references) → Verify: spot-check 10 events, tests have correct format `{stat, modifier, skills[]}`
- [ ] **`mapping_complex_table.ts`** — Table MC: 100 results mapped to Yellow/Red/Green/Blue → Verify: 100 entries, correct colour distribution

---

## Phase 2: Adventurer Model Updates
*`server/models/adventurer.ts`*

Add new nullable/optional fields:

```ts
butchery?: { br: number; pips: number }          // Butchery Roll + experience track
dualWield?: boolean                               // trained or not
weaponProficiency?: Record<string, number>        // weapon name → pip count
cheatDeath?: 'active' | null                      // CD marker on life point box
spellMana?: { primary: number; adjusted: number; total: number; current: number }
ammunition?: {                                    // holders + ammo counts
  pouch?: { smoothStones: number; leadShot: number }
  quiver?: { bodkinArrows: number; broadheadArrows: number }
  bandolier?: { crossbowBolts: number; heavyQuarrels: number }
}
herbBags?: Array<{ label: string; herbs: Record<string, number> }>
artisanSheet?: Record<string, number>            // already exists? extend for mining
accolades?: Record<string, boolean>              // archmage/expert/philanthropist/prodigious/slayer/toxophilite
honourPoints?: number
heroicItemTracker?: { pips: number }
yellowEventTracker?: { pips: number }
weaponProficiencyTracker?: Record<string, number>
```

→ Verify: `deno task test` still passes (255 tests), new fields default correctly

---

## Phase 3: Core Dungeon Services
*`server/services/curious_rules/`*

- [ ] **`ButcheryService.ts`** — `shadePip(adv)`, `rollLoot(adv, tableId)` (rolls BR times, returns options to choose from) → Verify: BR=2 returns 2 rolls, pip-10 increments BR
- [ ] **`DualWieldService.ts`** — `trainDualWield(adv)` (costs 1000g, adds flag), `rollDualWieldDamage(adv)` (2d damage dice, returns both) → Verify: training deducts gold, damage returns 2 values
- [ ] **`WeaponProficiencyService.ts`** — `shadeProficiencyPip(adv, weaponName)`, `getProficiencyModifiers(adv, weaponName)` → `{attackMod, monsterMod}` → Verify: 5 pips = -5 attack, +5 monster
- [ ] **`CheatDeathService.ts`** — `activate(adv, settlementType)` (find shrine %, pay 1500g), `useCheatDeath(adv)` (restore life, apply -1d6 STR/DEX/INT -1d3 HP penalties) → Verify: only one CD active at a time
- [ ] **`PursuitService.ts`** — `pursue(adv, monster)` → Int -10 test, returns `{success, combat?}` → Verify: uses Aware/Hunting skills, removes monster on failure
- [ ] **`SecretPassagewayService.ts`** — `search(adv, areasSearched)` → d10 table result (curse/encounter/passage/boost) → Verify: area marked (P), all 4 outcomes handled
- [ ] **`MonsterVariantService.ts`** — `rollVariant(monster)` → 1 in 10 chance, returns modified monster + honourPoints → Verify: all 10 variants (Cursed/Undead/Demon/Lair/Feasting/Treasure/Chewed/Bitten/CombatSkills/Enhanced)
- [ ] **`HonourPointsService.ts`** — `spend(adv, cost, action)` → re-roll attack/damage/location/test/table → Verify: 5 costs respected, balance tracked
- [ ] **`AccoladeService.ts`** — `checkAccolades(adv)` → checks all 6 criteria, grants active perks → Verify: Archmage requires primary Int 80, Slayer requires killing every table E monster
- [ ] **`HeroicItemService.ts`** — `checkHeroicDrop()` (d6=6 → shade pip → 2d10 ≤ pips = found), `generateHeroicItem(adv)` → rolls type + 2× LA, validates different adjustments → Verify: two different adjustment types enforced
- [ ] **`EpicDungeonService.ts`** — `beginEpicDungeon(adv, questId)`, applies +10AV/+1Def/+1Dmg/+10HP to all monsters, handles epic items on [K] results → Verify: epic modifiers applied, quest shaded on completion
- [ ] **`IdentifyService.ts`** — `identifyItem(adv, itemId)` → rolls table IB by item type, `removeItemCurse(adv, itemId)`, `addCursedEffect(adv, curse)` → Verify: Brew Lesser rolls correct sub-table, cursed items apply modifiers
- [ ] **`YellowEventService.ts`** — `rollYellowEvent(adv)` → shade pip on tracker, 2d10 ≤ pips = event triggered, resets tracker, returns event result → Verify: tracker resets on trigger, all events return typed result

---

## Phase 4: Combat Extensions
*Update `server/services/CombatService.ts` and add helpers*

- [ ] **Ammunition system** — `AmmunitionService.ts`: `equipHolder`, `loadAmmo`, `useAmmo(type)` → returns combat bonuses per ammo type; update combat attack flow to check equipped ammo → Verify: Bodkin Arrow applies -3 Def to monster, Broadhead +2 Dmg
- [ ] **Thrown weapons** — in combat, Dex-based attack = thrown; `ThrowService.ts`: `throwWeapon(adv, weapon)`, `retrieveWeapon(adv, weapon)` (REMOVE/RETRIEVE test) → Verify: chakram auto-returns on <3 damage, others require retrieval test
- [ ] **Aimed attacks** — `AimedAttackService.ts`: `aim(adv, location)` → applies modifier table (-5 to -15 by location), on hit applies location effect → Verify: Head = -15 AV, +3 Dmg; Feet = -10 AV, -1 Dmg, reaction -2
- [ ] **Reinforced Belts + Spiked Shields** — `EquipmentModService.ts`: `reinforceBelt(adv, armorId)`, `spikeShield(adv, shieldId)` → updates value/fix/RV/Dmg; in combat: roll 1d10 ≤ RV = belt check ignored; spiked shield adds Dmg on deflect → Verify: Kite Shield spiked = +2 Dmg on deflect
- [ ] **Spell Mana** — `SpellManaService.ts`: `enableMana(adv)`, `spendMana(adv, cost)` (falls back to HP/STR), `recoverMana(adv)` (+1d3 on clock shade), armour restriction (mail → no recovery) → Verify: metal armour disables clock recovery
- [ ] **Magic Power option** — In CAST SPELL/CAST SCROLL failure: if Magic Power mode enabled, apply -1d3 HP instead of table C → Verify: mode flag checked before curse roll

---

## Phase 5: World Builder Extensions
*Update existing WB services + add new*

- [ ] **`WorldBuilderHerbalismService.ts`** — `collectHerbs(adv, terrain)` → HERB COLLECTING test (Int -HM), returns 1d3+2+ç herbs from terrain column; `learnRecipe(adv, recipeName, settlementType)` (availability %); `makeItem(adv, recipeName)` → HERBALISM test → Verify: Desert HM=-20, City always has trainer
- [ ] **`WorldBuilderMiningService.ts`** — `findMine(adv, terrain)` → GEOLOGY test (Art -GM); `mine(adv, terrain)` → MINING test → 1d3 materials from terrain column; Mining Pick required, damages on fail → Verify: Seas HM=-15, pick damage on roll 5-6
- [ ] **`WorldBuilderSkinningService.ts`** — `salvage(adv)` → only after successful HUNTING, SALVAGING test (Art) → 1d3 materials (bone splinters/leather scraps); Skinning Blade required → Verify: only available post-hunt, blade damages on fail
- [ ] **Update `WorldBuilderSettlementService.ts`** — add: herb trainer availability, wizard (identify), witch (remove curse), armourer (reinforce/spike at ■ city only), dual wield trainer availability; property in WB pricing table → Verify: identify wizard availability matches book table
- [ ] **Update `WorldBuilderActionService.ts`** — add `herbalism`, `mining`, `salvage` as new action types with correct AP costs (herbalism 1AP×3, mining 1AP×3, salvage 1AP) → Verify: actions consume correct AP from calendar

---

## Phase 6: New Races & Quests
- [ ] **New races in chargen** — add Gnome/Dragon Scar/Half Orc/Wood Elf to character creation using `race_b_table.ts`; apply stat caps (Gnome: 50/35/25; Dragon Scar: 60/30/20; Half Orc: 45/35/30; Wood Elf: 40/30/30) + bonus starting values (Gnome: 7 Fate; Dragon Scar: 2 Rep; Half Orc: 24 HP; Wood Elf: 5 Life points) → Verify: chargen returns correct starting values per race
- [ ] **Table QE quests** — add 10 quests to quest generation pool; quest objects include boss monsters (Darkstalker, Manasaka, Doomtar, Noraus, Wumanok, Hargvel) with stats; enhancement rewards (Crystal of Mighty Power, Eye of Manasaka, etc.) → Verify: quest 1-10 returns Mighty Recruits, boss stat block correct

---

## Phase 7: Routes
*`server/routes/curious_rules.ts`*

All under `/api/v1/curious/:adventurerId/`:

```
POST  /butchery/shade                  ← shade butchery pip
POST  /butchery/loot                   ← roll loot BR times
POST  /dual-wield/train                ← learn dual wield (1000g)
POST  /weapon-proficiency/:weapon/pip  ← shade proficiency pip
POST  /cheat-death/activate            ← pay 1500g before quest
POST  /cheat-death/use                 ← apply resurrection penalties
POST  /pursuit                         ← pursue escaped monster
POST  /secret-passage/search           ← search for secret passage
POST  /monster-variant                 ← roll monster variant
POST  /honour/spend                    ← spend honour points
GET   /accolades                       ← get accolade status
POST  /accolades/check                 ← evaluate criteria
POST  /heroic-item/check               ← check heroic drop
POST  /heroic-item/generate            ← create heroic item
POST  /epic-dungeon/begin              ← start epic dungeon mode
POST  /identify/:itemId                ← identify item (table IB)
POST  /remove-curse/:itemId            ← remove curse
POST  /yellow-event/shade              ← shade yellow tracker pip
POST  /ammunition/:holder/load         ← load ammo into holder
POST  /ammunition/:type/use            ← use 1 ammo in combat
POST  /throw/:weaponId                 ← throw weapon
POST  /throw/:weaponId/retrieve        ← retrieve thrown weapon
POST  /aim/:location                   ← aimed attack at location
POST  /reinforce-belt/:armorId         ← reinforce waist armor
POST  /spike-shield/:shieldId          ← spike a shield
POST  /spell-mana/enable               ← enable mana system
POST  /herbalism/collect               ← collect herbs
POST  /herbalism/learn/:recipe         ← learn herbalism recipe
POST  /herbalism/make/:recipe          ← craft herb item
POST  /mining/find                     ← geology test
POST  /mining/mine                     ← mining test
POST  /skinning/salvage                ← salvage after hunt
```

→ Verify: each route returns `{ adventurer, result }`, all 255 existing tests still pass

---

## Phase 8: Tests
*`tests/curious_rules_test.ts`*

Write ~60 tests covering:
- Butchery pip/BR progression
- Dual wield damage roll
- Weapon proficiency modifiers
- Cheat death activation + penalties
- Pursuit test
- Ammo combat bonuses (each of 6 types)
- Aimed attacks (each location)
- Spell mana recovery + armour restriction
- Yellow event tracker reset
- Heroic item 2-adjustment validation
- Accolade criteria (spot-check 3)
- All 10 QE quest objects parseable
- All 4 new races: stat caps, starting bonuses
- Herbalism: collect herbs from terrain, make item
- Mining: geology test, materials returned

→ Verify: `deno task test` → all tests pass

---

## Done When
- [ ] All 8 phases complete
- [ ] `deno task test` passes (target: 315+ tests)
- [ ] Every route in Phase 7 returns correct `{ adventurer, result }` shape
- [ ] Memory updated with Book 8 status

## Notes
- All Book 8 rules are **opt-in** — no existing gameplay changes unless features are explicitly activated
- `MappingComplexService`, `MovementRulesService`, and `EnhancementService` (for QE crystal drops) are deferred to a follow-up if scope is too large
- `PartyPlayWorldBuilder` rules are documentation/client-side only — the API already supports the underlying mechanics (calendars, actions, property, etc.)
- `TreasuredItems` (value inflation for Finer/Greater/Superior/Exceptional) is a config flag, not a service
- `EasyMode`/`HardMode` are experience track multipliers — add as quest config flags
