<p align="center">
  <img src="../d100-bot/assets/logo.png" alt="Vagrant Souls" width="420">
</p>

# Vagrant Souls — Player's Guide

> A guide to playing Vagrant Souls via the Discord bot.

This guide covers everything from creating your first adventurer to mastering the advanced systems of the overworld. You don't need the physical rulebooks to play — but having them makes the experience richer.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Character Creation](#2-character-creation)
3. [The Dungeon](#3-the-dungeon)
4. [Combat](#4-combat)
5. [Camp — Downtime Actions](#5-camp--downtime-actions)
6. [Quests](#6-quests)
7. [Character Progression](#7-character-progression)
8. [Advanced Systems](#8-advanced-systems)
   - [Witchery](#witchery)
   - [Beast Companions](#beast-companions)
   - [Arcanist Orders](#arcanist-orders)
   - [Artisan Crafting](#artisan-crafting)
   - [Guilds](#guilds)
9. [World Builder — The Overworld](#9-world-builder--the-overworld)
10. [Book 8 — Curious Rules](#10-book-8--curious-rules)
11. [Quick Reference](#11-quick-reference)

---

## 1. Getting Started

### Step 1 — Register

Use `/register` to create your D100 account. This links your Discord identity to a VagrantSoul account. You only need to do this once.

### Step 2 — Create a Character

Use `/create` to open the character creation wizard. It walks you through 5 steps (see [Character Creation](#2-character-creation)).

### Step 3 — Enter the Dungeon

Use `/enter` to start your first delve. The bot will show you a room and give you buttons to interact with it.

### Useful Commands At Any Time

| Command | What it shows |
|---|---|
| `/status` | HP, stats, gold, oil, food |
| `/charsheet` | Full character sheet |
| `/inventory` | Equipment + backpack |
| `/quests` | Active quest log |
| `/worldbuilder` | Overworld state (hex, calendar, mounts) |
| `/help` | Command reference |

---

## 2. Character Creation

The wizard has 5 steps. Each step appears as an embed with buttons or a form.

### Step 1 — Name & Attributes

A form appears asking for:

- **Name** — your adventurer's name (2–32 characters)
- **STR, DEX, INT** — your three primary stats

Stats must be assigned as **50, 40, 30** in any order (or a Book 8 race assignment — see [Book 8 Races](#book-8-races)). The total must always work out correctly — the bot will reject invalid distributions.

| Stat | Governs |
|---|---|
| **STR** | Melee combat, carrying capacity |
| **DEX** | Ranged combat, traps, escape |
| **INT** | Magic, spells, knowledge skills |

### Step 2 — Hero Path

Choose one of 12 hero paths. Each path modifies your stats and grants two starting skills.

| Path | Stat Focus | Starting Skills |
|---|---|---|
| Warrior | +STR | Bravery, Escape |
| Rogue | +DEX | Locks, Traps |
| Sorcerer | +INT | Spellcasting, Warding |
| Knight | +STR/DEX | Strong, Dodge |
| Paladin | +STR/INT | Bravery, Magic |
| Assassin | +STR/DEX | Escape, Aware |
| Scoundrel | +DEX/INT | Agility, Lucky |
| Warlock | +STR/INT | Magic, Bravery |
| Druid | +DEX/INT | Magic, Aware |
| Barbarian | +STR | Strong (×2 bonus) |
| Hunter | +DEX | Aware (×2 bonus) |
| Arcane Wizard | +INT | Magic (×2 bonus) |

> **Witchery Note:** Druids and Warlocks unlock the Witchery system automatically (see [Witchery](#witchery)).

### Step 3 — Race

Choose one of the available races. Each race applies additional stat and skill modifiers.

**Core Races (Books 1–2):**

| Race | Modifier | Bonus Skill |
|---|---|---|
| Human | +INT | Aware |
| Dwarf | +STR | Strong |
| Elf | +DEX | Dodge |
| Halfling | +DEX, −STR | Agility |
| Half Elf | +INT, −STR, −DEX | Escape |
| Half Giant | +STR, −INT | Bravery |
| High Elf | +DEX/INT, −STR | Magic |
| Mountain Dwarf | +STR, −DEX | Traps |

**Book 8 Races** use different stat assignments (not 50/40/30) — see [Book 8 Races](#book-8-races).

### Step 4 — Choose Skills

Pick **2 skills** from the full skill list. Each chosen skill gets +5 added to it.

Available skills: Strong, Bravery, Dodge, Escape, Locks, Lucky, Aware, Agility, Magic, Traps.

These stack with path and race bonuses — so e.g. a Warrior who picks Bravery gets +10 total.

### Step 5 — Finalize

Review your choices and confirm. The bot will:

- Set your starting HP (20, modified by race)
- Set your starting Fate (3), Life (3), Reputation (1)
- Give you starting supplies: 20 Oil, 10 Food, 15 Picks
- Roll a random starting weapon (Table W)
- Roll 3 random starting armour pieces (Table A)
- Give you 3 Lesser Healing Potions

You're ready to `/enter` the dungeon!

---

## 3. The Dungeon

Use `/enter` to start a session. A room will appear with buttons.

### Dungeon Buttons

| Button | Action |
|---|---|
| **Move Forward** | Advance to the next room (costs 1 time pip) |
| **Search Room** | Search for loot (costs 1 time pip; once per room) |
| **Make Camp** | Enter camp/downtime menu |

### Reading a Room

Each room has:

| Property | What it means |
|---|---|
| **Color** | Determines encounter type (Green=safe, Yellow=caution, Red=danger, Blue=special) |
| **Exits** | Number of exits you can take next move |
| **Features** | What the room contains (Chest, Trap, Monster, etc.) |
| **Roll** | The d100 result that generated this room (1–100) |
| **Narrative** | AI-generated description of the room |

### Time Track

Each action (Move, Search) advances the time track by 1 pip. At certain thresholds:

- **Upkeep:** Oil is consumed (lantern burns out → darkness → −10 to all rolls)
- **Food:** Rations consumed (run out → starvation → increasing penalties)
- **Picks:** Used for trap disarming

You can see the current time track in the room embed. Use **Make Camp** to rest and reset resources.

### Searching

Click **Search Room** to roll on Table S. You might find:

- Gold coins
- A potion or item
- Nothing

The search button is **disabled after use** — each room can only be searched once.

### Getting Hurt

When combat damages you or a trap fires:
- HP drops. If HP reaches 0, you may trigger a **death check** (Life points).
- Life points are your safety net — if you survive, you wake up outside the dungeon with 1 HP.

---

## 4. Combat

Combat occurs when the dungeon generates a monster encounter. The room embed switches to a combat display.

### Combat Buttons

| Button | Action |
|---|---|
| **⚔ Attack (Main Hand)** | Attack with your right-hand weapon |
| **⚔ Attack (Off Hand)** | Attack with your left-hand weapon |
| **🛡 Defend** | Hold position — take reduced damage |
| **💨 Flee** | Attempt to escape (success depends on DEX) |

### How a Round Works

1. **You choose an action** — attack, defend, or flee.
2. In **solo play**, your action resolves immediately.
3. In **party play**, the turn waits until all party members submit their action, then resolves together.
4. The bot shows the round logs: who hit, damage dealt, monster HP, and status.

### Winning and Losing

- **Monster reaches 0 HP** → You win! Monster parts may drop.
- **Your HP reaches 0** → You're down. If you have Life points, you survive with 1 HP. If Life is also 0, your adventurer dies.

### Monster Parts

Defeating certain monsters drops a monster part (e.g. Dragon Scale, Goblin Ear). Parts go into your inventory and can be used for:
- Witchery brewing (3 parts → potion)
- Artisan salvage (if you're an Artisan)

### Combat Rolls

The game uses a D100 roll-under system. Your attack roll vs. your weapon's bonus + STR (or DEX for ranged). The monster defends with its own rating. Details are shown in the combat log.

---

## 5. Camp — Downtime Actions

Click **Make Camp** from the dungeon view to access all downtime activities.

### Heal

Spend food to recover HP.
- Click **Heal** → enter the amount you want to heal.
- Food is consumed based on how much HP you restore.
- You cannot heal above your max HP.

### Repair

Fix a damaged item (damagePips > 0).
- Click **Repair** → enter the item ID and repair pips to spend.
- Each repair pip costs gold (the item's `fix` value).
- Items at 5 damagePips are broken and unusable until repaired.

> **Tip:** Use `/inventory` to see item IDs and their current damage pips.

### Trade

Three sub-options:

| Option | Description |
|---|---|
| **Sell Item** | Sell any backpack item for its gold value |
| **Buy Needed Item** | Buy a standard supply by name (oil, food, picks, etc.) |
| **Search Market** | Roll on Table A (armour) or Table W (weapons) to buy market gear |

### Train

Spend experience pips to improve a stat or skill.
- Enter the **target** (e.g. `str`, `Bravery`, `Magic`) and the **pips** to spend.
- 10 pips = +5 to a stat. Skill costs vary by skill.
- Use `/charsheet` to see current pips.

### Empire Building

Invest gold into long-term ventures (inns, farms, shops).
- Enter the **investment type** and **gold amount**.
- Roll a d100 — the result determines whether your investment grows, stays flat, or loses value.
- Investments pay dividends over time.

### Witchery

*(Available only to Druids, Warlocks, or adventurers who've learned formulas.)*

See [Witchery](#witchery) section.

### Beast, Arcanist, Artisan

Advanced systems — see [Advanced Systems](#8-advanced-systems).

### Back to Delving

Click **← Continue Delving** to return to your last room and resume exploration.

---

## 6. Quests

Vagrant Souls uses three quest types. Use `/quests` to view your log.

### Campaign Quests (CQ1–CQ20)

A sequential story that unfolds across 20 chapters. Complete them in order to follow the main narrative. Each campaign quest has:
- A specific **objective** (kill a named boss, find an artifact, etc.)
- A **success** and **failure** outcome
- The next quest unlocked on completion

### Side Quests (QAA–QAY)

25 optional quests you can take on between dungeons. Roll a d100 to see which side quest appears. Each has:
- An objective
- A success reward
- A failure penalty

### World Builder Quests (Q1–Q25)

If you're using the overworld (Book 6), each hex sheet has up to 25 procedurally generated quests. See [World Builder](#9-world-builder--the-overworld).

### Quest Maker

Generate a one-off custom quest procedurally using the Quest Maker table (via API — the bot's `/quests` command shows active quests). Objectives, modifiers, and rewards are all randomized.

---

## 7. Character Progression

### Experience Pips

You earn experience pips (XP) from:
- Completing quests
- Combat results (critical hits, boss kills)
- Certain dungeon events

**Spending XP:**
- 10 pips → +5 to any stat (STR, DEX, or INT)
- Variable pips → +5 to a skill (use `/downtime/train`)
- Variable pips → learn or improve a spell

### Reputation

Reputation (Rep) increases when you:
- Complete campaign quests
- Earn accolades
- Contribute to a guild

Higher Rep unlocks certain story events and NPC interactions.

### Stats Growing

Stats have no hard cap but practically plateau as you spend more pips on increasingly expensive upgrades. Path determines which stat grows fastest (Warriors gain STR most efficiently, etc.).

### Skills

Skills add a flat bonus to relevant d100 rolls. Common skills and what they affect:

| Skill | Used For |
|---|---|
| Strong | Forcing doors, carrying, power moves |
| Bravery | Fear checks, morale, pushing through |
| Dodge | Avoiding traps, physical hazards |
| Escape | Breaking free, running away |
| Locks | Opening locked chests/doors |
| Lucky | Treasure and fortunate events |
| Aware | Ambush detection, noticing hidden things |
| Agility | Acrobatics, narrow spaces |
| Magic | Casting spells, magic checks |
| Traps | Finding and disarming traps |

---

## 8. Advanced Systems

### Witchery

Witchery lets Druids and Warlocks (and any adventurer who learns formulas) brew potions and anointments by combining **3 monster parts**.

**How it works:**
1. Collect monster parts from defeated creatures.
2. At camp, click **Witchery → Brew Potion**.
3. Enter the 3 parts you want to combine and 2 dice rolls.
4. If the combination is a known formula, you brew the result with a bonus.
5. If it's a new combination, you discover (or fail to discover) the formula.

**Effects** last for the current quest only.

**Mishaps** occur on failed brews and apply penalties for the quest duration.

**Clearing effects:** Click **Witchery → Clear Effects** at the end of a quest to remove all witchery effects and mishaps.

---

### Beast Companions

Adventurers can acquire and train a single beast companion. Beasts fight alongside you in combat and can use special abilities.

**Acquiring a Beast:**

| Method | How |
|---|---|
| **Buy** | Click Beast → Buy Beast, roll d100 (Table Y lookup) |
| **Tame** | After a dungeon encounter, click Beast → Tame Monster, provide monster name + d100 roll |

**Beast Statistics:**

| Field | Meaning |
|---|---|
| Level | 1–10; improves with training |
| Bonus | Combat bonus (can be negative early on) |
| HP / currentHp | Beast health |
| Training Pips | 0–10; fills up toward level-up |
| Cooperative | If false, beast may not obey; click Train to improve |
| Abilities | Special powers you can trigger in combat |

**Training:**
- Click **Train Beast** at camp → roll d100
- On success: +training pips (10 pips → level up, +HP, +bonus, new ability)
- On failure: beast becomes uncooperative

**Beast Abilities** are triggered during combat via the API (not currently a bot button — use API directly or future update). Abilities include things like Guard (blocks hit for you), Guide (navigation), Attack, and more.

**Dragon Hatchlings** are special beasts with up to 2 **Dragon Hearts** — each heart allows resurrection when the dragon dies. Click **Resurrect Dragon** at camp.

---

### Arcanist Orders

The Arcanist system lets magic-focused adventurers join one of 7 mystical orders and learn order-specific spells.

**The 7 Orders:**

| Order | Focus |
|---|---|
| Alchemy | Potions, transmutation |
| Elements | Fire, ice, lightning magic |
| Illusion | Misdirection, stealth |
| Invocation | Summoning power |
| Psyche | Mind magic, enchantment |
| Summoning | Creature summoning |
| Esoteric | Forbidden knowledge |

**Joining an Order:**
1. Click **Arcanist → Become Arcanist**
2. Choose your order (irreversible)
3. You start as **Initiate** and progress through 10 ranks as you donate and learn

**The 10 Ranks:** Initiate → Neophyte → Apprentice → Magi → Adept → Tyro Magister → Magister → Tyro Magus → Magus → Master Magus

**Learning Spells:**
- Click **Learn Spell** → provide a spell table roll
- Spells go into your Arcanist Spell Book
- Higher ranks unlock more powerful spells

**Donations:**
- Each rank requires paying a gold donation to the order
- Failing to pay increases your **Arcane Law violations**
- Too many violations → the Arcane Prism (see below)

**Arcane Law & the Prism:**
- Breaking Arcane Law (missing donations, forbidden acts) adds violation points
- Click **Conceal** to roll and hide violations
- If sent to the **Arcane Prism**, click **Prism** and roll STR, DEX, and INT to survive the ordeal

---

### Artisan Crafting

The Artisan system lets you salvage materials from defeated monsters/items and craft equipment schematics.

**Unlocking Artisan:**
- Click **Artisan → Unlock Artisan** (costs 200 gold)
- Receive your Artisan Sheet with starting ART stat (40), Salvage Skill (0), Crafting Skill (0)

**The Three Skills:**

| Skill | What it does |
|---|---|
| ART | Overall artisan ability (0–80) |
| Salvage Skill | How well you recover materials (0–20) |
| Crafting Skill | How well you craft items (0–20) |

**Salvage:**
- Click **Salvage** → enter item name + roll
- Materials are added to your materials inventory (Leather Scraps, Iron Ingots, etc.)
- Higher Salvage Skill = better quality and more materials

**Craft:**
- Click **Craft** → enter schematic name + roll
- Consumes materials listed in the schematic
- Success crafts the item and adds it to your backpack

**Material Tiers:**
Materials come in tiers (Scraps → Standard → Quality → Superior → Masterwork). Click **Convert** to combine lower-tier materials into higher-tier.

**Guild Storage:**
- Pay a seasonal storage fee to keep materials safe between quests
- Click **Pay Storage** once per season

**Training:**
- Click **Train** → choose skill type (Salvage/Crafting/Art) + contacts to spend
- More contacts = bigger bonus to training roll

---

### Guilds

Guilds are factions you can join for ongoing bonuses and community. There are 4 guilds, each aligned with a set of hero paths.

**The 4 Guilds:**

| Guild | Aligned Paths | Focus |
|---|---|---|
| Iron Vanguard | Warrior, Knight, Paladin, Barbarian | Martial might |
| Arcane Circle | Sorcerer, Arcane Wizard, Warlock, Druid | Magical mastery |
| Shadow Step | Rogue, Assassin, Scoundrel, Hunter | Stealth and cunning |
| Silver Wanderers | All paths welcome | Exploration and trade |

**Joining a Guild:**
- Use the API or bot's guild command to join (you can only belong to one guild at a time)
- Guild standing starts at 10 on joining

**Guild Standing & Ranks (5 ranks per guild):**

| Standing | Rank |
|---|---|
| 0–19 | Rank 1 (Recruit / Initiate / Scout / Wanderer) |
| 20–39 | Rank 2 |
| 40–59 | Rank 3 |
| 60–79 | Rank 4 |
| 80–100 | Rank 5 (Champion) |

**Gaining Standing:**
- Contribute gold at camp (minimum 10 gp → 1 standing point; higher contributions give bonus points)
- Completing guild quests
- Special events

**Leaving:**
- You can leave a guild at any time, but your standing resets to 0
- You'll need to rebuild from scratch if you rejoin

---

## 9. World Builder — The Overworld

The World Builder (Book 6) lets you explore a procedurally generated world called **Valoria** on a hex grid.

### The World of Valoria

Valoria has 6 continents, each corresponding to one hex sheet:

| Sheet | Continent | Character |
|---|---|---|
| 1 | Caldoria | Starting land |
| 2 | Pyrethum | Volcanic deserts |
| 3 | Verdenmoor | Ancient forests |
| 4 | Thalassus | Island seas |
| 5 | Frosthold | Frozen tundra |
| 6 | Althenara | Sky realm |

Use `/worldbuilder` to see your current position, and the map endpoints to view SVG maps.

### Hexes

The world is divided into hexes. Each hex has:
- **Terrain type** (10 types: Deserts, Tundras, Grasslands, Forests, Jungles, Marshlands, Swamps, Hills, Mountains, Seas)
- **Name** (procedurally generated)
- **Settlement** (optional: camp, village, town, or city)
- **Roads and rivers**
- **Quest code** (if a quest is placed here)
- **War status** (−10 encounter modifier if At War)

### The Calendar

Time in the World Builder is tracked by day. The calendar starts in Year 1072, Month 1, Day 1.

Each day you must track:
- **Rations** — depleted by actions and mount feeding (0–30)
- **Fatigue** — builds up over time (0–10 pips; full = penalties)
- **Quest time** — tracks how long quests take

### Overworld Actions

Each action takes time on the calendar.

| Action | Time | Description |
|---|---|---|
| **Rest** | 1 day | Recover fatigue |
| **Scout** | 1 day | Reveal an adjacent hex |
| **Forage** | 1 day | Gather food from the terrain |
| **Fish** | 1 day | Fish for food (requires water hex) |
| **Move** | 1 day | Move to adjacent hex |
| **Cart** | 2 days | Travel by cart (carry more) |
| **Ride** | 1 day | Travel mounted (faster options) |
| **Lay of the Land** | 1 day | Learn about a distant hex |
| **News of Quests** | 1 day | Discover quests in a hex |
| **Make Camp** | — | Set a camp marker (▲) in current hex |

### Settlements

When your hex has a settlement, you can access services:

| Settlement | Services Available |
|---|---|
| Camp | Basic: heal, rest |
| Village | + sell, buy, train |
| Town | + magic tuition, artisan guild |
| City | All services at best prices |

Settlement services include: **Law check, Heal, Repair, Sell, Buy, Search Market, Train, Magic Tuition, Empire Building, Witchery, Artisan Guild, Quest Rumours, Settlement Events**.

### Mounts

You can own up to 6 mount slots. Mounts help you travel faster and carry more.

| Mount Type | Speed | Notes |
|---|---|---|
| Horse | +1 move | Standard mount |
| Mule | Normal | Carries more saddlebags |
| Camel | +1 desert | Better in desert terrain |
| Dragon | +2 all | All 6 slots; rare |
| Unicorn | +2 forest | Forest bonus |
| Flying Carpet | +3 | Can cross seas |

**Mount upkeep:** Mounts consume rations daily. If a mount reaches 10 malnutrition pips, it faces a death check.

**Saddlebags:** Add up to 4 saddlebags per mount. Each bag holds either one tracked item (with pips) or two stacks of stackable items.

### World Quests

Each hex sheet has up to 25 quest slots (Q1–Q25). Quests have:
- A **Reward Value** (Q¢ + P¢ + H¢)
- A **success** and **failure** outcome
- A **time limit** (quest time pips)
- Optional **unique** status (special, one-of-a-kind loot)

Complete all 25 quests on a sheet to finish that continent and unlock the next.

### World Events

As you explore, events trigger based on your actions and terrain. Events range from:
- Merchant encounters
- Ambushes
- Tavern revelry (with gambling sub-events)
- Witch suspicion (if you carry forbidden items)
- Bounty hunters (if Lawless Points are high)

Events can chain — one event leads to another (e.g. TAVERN → GAMBLE → DEBT).

---

## 10. Book 8 — Curious Rules

Book 8 adds optional advanced rules that deepen the dungeon experience.

### Butchery

After defeating a monster, you can butcher the body for parts. Uses the **Butchery Roll (BR)** stat — starts at 1, improves with experience pips.

Better BR = better quality and more parts from each kill.

### Dual Wield

Unlock dual-wielding to make an off-hand attack each round. The off-hand attack uses a separate damage roll.

### Weapon Proficiency

Spend pips to become proficient in a weapon type (Swords, Axes, Bows, etc.). Proficiency adds a bonus to attack rolls with that weapon type.

### Cheat Death

A special ability that triggers when your HP hits 0. Instead of going down, you roll to cheat death and survive with reduced HP. Once unlocked, it's always active.

### Pursuit

When fleeing from monsters outside the dungeon (World Builder), pursue/flee mechanics apply. Your DEX vs. the monster's speed determines if you escape.

### Secret Passageways

Search for hidden doors and passages in dungeon rooms. A successful roll reveals a secret exit or shortcut.

### Monster Variants

Monsters can appear as stronger/weaker variants. Roll on the variant table to see if a monster is, e.g., Ancient, Young, Cursed, or Blessed.

### Honour Points

Earn Honour Points for brave deeds. Spend them for advantages like rerolling attacks or gaining temporary bonuses.

### Accolades

Earn titles for specific achievements. Accolades are permanent and visible on your character sheet.

Examples:
- **Slayer** — Kill all 20 Table E monster types
- **Survivor** — Survive 10 quests
- **Wealthy** — Accumulate 1000+ gold

### Heroic Items

Legendary items that carry the deeds of your adventurer. Generated by rolling twice on the Legends A table and combining the results. Each heroic item has unique properties.

### Epic Dungeon

An advanced dungeon mode with harder monsters, better loot, and special rules. Unlock by meeting prerequisites (reputation, completed quests).

### Identify

Some found items are **Unidentified**. Use the Identify ability to reveal their true name and properties.

### Yellow Events

Yellow rooms can trigger special Yellow Events — puzzles, opportunities, and dangers that don't appear in the standard room table.

### Ammunition

Track bullets, arrows, and crossbow bolts in dedicated holders:

| Holder | Ammo Types |
|---|---|
| Pouch | Smooth Stones, Lead Shot |
| Quiver | Bodkin Arrows, Broadhead Arrows |
| Bandolier | Crossbow Bolts, Heavy Quarrels |

### Thrown Weapons

Make thrown weapon attacks (daggers, axes) using the Throw system. Thrown weapons have limited range and require recovery.

### Aimed Attacks

Target specific body locations for additional effects:
- **Head** — higher miss chance, massive damage on hit
- **Torso** — standard
- **Arms** — disarm on hit
- **Legs** — slow on hit

### Equipment Mods

Modify equipment with enhancements (sharpening, reinforcing, enchanting). Mods are applied at settlements with the right facilities.

### Spell Mana

An alternative magic system. Instead of Table C (spell failure), enable Mana to track a mana pool. Running out of mana is safer than Table C failures — but mana is limited.

**Mana Pool:**
- **Primary** — base mana from path/class
- **Adjusted** — bonus from equipment and effects
- **Total** — primary + adjusted
- **Current** — remaining mana this quest

With **Magic Power mode** enabled: spell failure costs 1d3 HP instead of rolling Table C.

### Book 8 Races

Four new races with non-standard stat distributions:

| Race | Stats | Unique |
|---|---|---|
| Gnome | 50/35/25 | Extra fate, Magic skill |
| Dragon Scar | 60/30/20 | +HP, fearsome appearance |
| Half Orc | 45/35/30 | Balanced, Bravery bonus |
| Wood Elf | 40/30/30 | Stealth, forest affinity |

### World Builder — Herbalism

In certain terrains (Forests, Marshlands, etc.), gather herbs and brew herbal remedies. Requires visiting a herb trainer at a settlement first.

### World Builder — Mining

In Hills and Mountains terrain, find mines and extract raw materials. Requires a Mining Pick in inventory. Materials go to your Artisan Sheet.

### World Builder — Skinning

After hunting creatures in the World Builder, skin them for materials (requires a Skinning Blade). Materials go to your Artisan Sheet.

---

## 11. Quick Reference

### Stat Checks

All rolls are **d100 roll-under**: roll equal to or under your stat + modifiers to succeed.

| Situation | Stat Used |
|---|---|
| Melee attack | STR |
| Ranged attack | DEX |
| Magic / spells | INT |
| Skill checks | Relevant skill bonus stacks with stat |

### Resources at a Glance

| Resource | Use | Replenish |
|---|---|---|
| **HP** | Combat damage absorbed | Heal at camp (costs food) |
| **Oil** | Lantern fuel (1 per time pip) | Buy at camp |
| **Food** | Rations for healing + mounted travel | Buy/forage/fish |
| **Picks** | Disarming traps and locks | Buy at camp |
| **Gold** | Everything | Loot, sell items |
| **Fate** | Reroll dice once each | Cannot be restored |
| **Life** | Survive death (1 HP instead of dying) | Very rare ways to restore |

### Status Effects

| Effect | Cause | Effect |
|---|---|---|
| **Poison** | Monster venoms, traps | HP loss per time pip |
| **Disease** | Dungeon hazards | Stat penalties |
| **Darkness** | Oil runs out | −10 to all rolls |
| **Starvation** | Food runs out | Increasing damage per time pip |

### Dungeon Room Colors

| Color | Typical Contents |
|---|---|
| Green | Empty, safe, occasional treasure |
| Yellow | Mixed — loot, traps, minor encounters |
| Red | Dangerous — monsters, deadly traps |
| Blue | Special — puzzles, unique events, boss rooms |

### Equipment Slots

| Slot | What goes here |
|---|---|
| Head | Helmets, hoods |
| Torso | Armour |
| Back | Cloaks, quivers |
| Main Hand | Primary weapon |
| Off Hand | Shield, secondary weapon, torch |
| Belt 1 & 2 | Potions, quick-access items |
| Backpack | Everything else (unlimited) |

### Item Damage Track

Items take damage pips (0–5) from combat and use. At 5 pips, an item is **broken** and cannot be used until repaired. Check your item's `fix` value — that's the gold cost per pip to repair.

### Party Play

Multiple players can explore together using the party system. In party combat:
- All members must submit their action before the round resolves
- Ganging up: +5 to attack per extra attacker (Book 2 rule)
- Pass Item: one player can pass an item to another during combat

---

*Vagrant Souls is a fan-made digital adaptation inspired by D100 Dungeon by Martin Knight. The physical rulebooks are available at [d100dungeon.co.uk](https://www.d100dungeon.co.uk/).*
