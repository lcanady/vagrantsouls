import { Hono, Context } from "hono";
import { z } from "zod";
import { Adventurer } from "../models/adventurer.ts";
import { Book1TableService } from "../services/table_service.ts";
import { GameState } from "../models/gamestate.ts";
import { Repository } from "../repository.ts";
import { User } from "../models/user.ts";
import { RACE_B_TABLE } from "../data/curious_rules/race_b_table.ts";

const chargenRoutes = new Hono<{ Variables: { repository: Repository, user?: User } }>();
const tableService = new Book1TableService();

// ─── Hero Path definitions ──────────────────────────────────────────────────
// Core paths
const PATHS: Record<string, { strMod: number; dexMod: number; intMod: number; skills: Record<string, number> }> = {
  Warrior:        { strMod: +10, dexMod: -5,  intMod: -5,  skills: { Bravery: 5, Escape: 5 } },
  Rogue:          { strMod: -5,  dexMod: +10, intMod: -5,  skills: { Locks: 5, Traps: 5 } },
  Sorcerer:       { strMod: -5,  dexMod: -5,  intMod: +10, skills: { Spellcasting: 5, Warding: 5 } },
  // Extended paths
  Knight:         { strMod: +5,  dexMod: +5,  intMod: -10, skills: { Strong: 5, Dodge: 5 } },
  Paladin:        { strMod: +5,  dexMod: -10, intMod: +5,  skills: { Bravery: 5, Magic: 5 } },
  Assassin:       { strMod: +5,  dexMod: +5,  intMod: -10, skills: { Escape: 5, Aware: 5 } },
  Scoundrel:      { strMod: -10, dexMod: +5,  intMod: +5,  skills: { Agility: 5, Lucky: 5 } },
  Warlock:        { strMod: +5,  dexMod: -10, intMod: +5,  skills: { Magic: 5, Bravery: 5 } },
  Druid:          { strMod: -10, dexMod: +5,  intMod: +5,  skills: { Magic: 5, Aware: 5 } },
  Barbarian:      { strMod: +10, dexMod:  0,  intMod: -10, skills: { Strong: 10 } },
  Hunter:         { strMod: -10, dexMod: +10, intMod:  0,  skills: { Aware: 10 } },
  "Arcane Wizard":{ strMod: -10, dexMod:  0,  intMod: +10, skills: { Magic: 10 } },
};

// ─── Race definitions ───────────────────────────────────────────────────────
// Core races
const RACES: Record<string, { strMod: number; dexMod: number; intMod: number; skills: Record<string, number> }> = {
  Dwarf:         { strMod: +5,  dexMod:  0,  intMod: -5,  skills: { Strong: 5 } },
  Elf:           { strMod: -5,  dexMod: +5,  intMod:  0,  skills: { Dodge: 5 } },
  Human:         { strMod:  0,  dexMod: -5,  intMod: +5,  skills: { Aware: 5 } },
  // Extended races (Book 2)
  Halfling:      { strMod: -10, dexMod: +10, intMod:  0,  skills: { Agility: 5 } },
  "Half Elf":    { strMod: -5,  dexMod: -5,  intMod: +10, skills: { Escape: 5 } },
  "Half Giant":  { strMod: +10, dexMod:  0,  intMod: -10, skills: { Bravery: 5 } },
  "High Elf":    { strMod: -10, dexMod: +5,  intMod: +5,  skills: { Magic: 5 } },
  "Mountain Dwarf": { strMod: +10, dexMod: -5, intMod: -5, skills: { Traps: 5 } },
};

// Book 8 races — registered from RB table at module load
for (const rb of RACE_B_TABLE) {
  RACES[rb.name] = {
    strMod: rb.primaryMods.str,
    dexMod: rb.primaryMods.dex,
    intMod: rb.primaryMods.int,
    skills: Object.fromEntries(rb.skillBonuses.map((s) => [s.skill, s.bonus])),
  };
}

// Valid stat assignment sets: standard 50/40/30 + Book 8 race assignments
const VALID_STAT_SETS: number[][] = [
  [50, 40, 30], // standard
  ...RACE_B_TABLE.map((rb) => [...rb.statAssignment].sort((a, b) => b - a)),
];

function applyPathToAdventurer(adv: Adventurer, path: string): Adventurer {
  const def = PATHS[path];
  if (!def) return adv;
  const updated = { ...adv, path: path as Adventurer["path"] };
  updated.str = adv.str + def.strMod;
  updated.dex = adv.dex + def.dexMod;
  updated.int = adv.int + def.intMod;
  updated.skills = { ...adv.skills };
  for (const [skill, bonus] of Object.entries(def.skills)) {
    updated.skills[skill] = (updated.skills[skill] || 0) + bonus;
  }
  return updated;
}

function applyRaceToAdventurer(adv: Adventurer, race: string): Adventurer {
  const def = RACES[race];
  if (!def) return adv;
  const updated = { ...adv, race: race as Adventurer["race"] };
  updated.str = adv.str + def.strMod;
  updated.dex = adv.dex + def.dexMod;
  updated.int = adv.int + def.intMod;
  updated.skills = { ...adv.skills };
  for (const [skill, bonus] of Object.entries(def.skills)) {
    updated.skills[skill] = (updated.skills[skill] || 0) + bonus;
  }
  return updated;
}

// ─── Step 1: Create Adventurer ──────────────────────────────────────────────
chargenRoutes.post("/create", async (c: Context) => {
  const repo = c.get("repository");
  const user = c.get("user");
  const { name, str, dex, int: intStat } = await c.req.json();

  const stats = [str, dex, intStat].sort((a: number, b: number) => b - a);
  const validSet = VALID_STAT_SETS.find(
    (set) => stats[0] === set[0] && stats[1] === set[1] && stats[2] === set[2],
  );
  if (!validSet) {
    return c.json({
      error: "Stats must be a permutation of 50/40/30 (standard) or a Book 8 race assignment: 50/35/25 (Gnome), 60/30/20 (Dragon Scar), 45/35/30 (Half Orc), or 40/30/30 (Wood Elf).",
    }, 400);
  }

  const id = crypto.randomUUID();
  const adventurer: Adventurer = {
    id,
    userId: user?.id,
    name,
    hp: 0,
    maxHp: 0,
    fate: 0,
    life: 0,
    str,
    dex,
    int: intStat,
    experiencePips: 0,
    backpack: [],
    skills: {},
    spells: {},
    investments: {},
    reputation: 0,
    gold: 0,
    oil: 0,
    food: 0,
    picks: 0,
    poison: 0,
    disease: 0,
    darkness: false,
    starvation: false,
    monsterParts: [],
    witcheryFormulas: {},
    witcheryEffects: [],
    witcheryMishaps: [],
    campaignQuests: {},
    sideQuests: {},
    questsCompleted: 0,
    questsFailed: 0,
    combatExperience: {},
    guildId: undefined,
    guildStanding: 0,
  };

  const newState: GameState = {
    adventurer,
    timeTrack: 0,
    startedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
  };

  await repo.saveAdventurer(id, newState);
  return c.json({ message: "Adventurer created. Proceed to select Path.", id, adventurer });
});

// ─── Step 2: Choose Hero Path ───────────────────────────────────────────────
chargenRoutes.post("/path", async (c: Context) => {
  const repo = c.get("repository");
  const { id, path } = await c.req.json();

  if (!PATHS[path]) {
    return c.json({ error: `Unknown path '${path}'. Valid paths: ${Object.keys(PATHS).join(", ")}` }, 400);
  }

  const gameState = await repo.loadAdventurer(id);
  if (!gameState) return c.json({ error: "Adventurer not found." }, 404);

  const adv = applyPathToAdventurer(gameState.adventurer, path);
  await repo.saveAdventurer(id, { ...gameState, adventurer: adv });
  return c.json({ message: `Hero Path '${path}' chosen. Proceed to select Race.`, adventurer: adv });
});

// ─── Step 3: Choose Race ────────────────────────────────────────────────────
chargenRoutes.post("/race", async (c: Context) => {
  const repo = c.get("repository");
  const { id, race } = await c.req.json();

  if (!RACES[race]) {
    return c.json({ error: `Unknown race '${race}'. Valid races: ${Object.keys(RACES).join(", ")}` }, 400);
  }

  const gameState = await repo.loadAdventurer(id);
  if (!gameState) return c.json({ error: "Adventurer not found." }, 404);

  const adv = applyRaceToAdventurer(gameState.adventurer, race);
  await repo.saveAdventurer(id, { ...gameState, adventurer: adv });
  return c.json({ message: `Race '${race}' chosen. Proceed to select Skill Bonus.`, adventurer: adv });
});

// ─── Step 4: Choose Skill Bonus ─────────────────────────────────────────────
chargenRoutes.post("/skills", async (c: Context) => {
  const repo = c.get("repository");
  const { id, skills } = await c.req.json();

  const gameState = await repo.loadAdventurer(id);
  if (!gameState) return c.json({ error: "Adventurer not found." }, 404);

  if (!Array.isArray(skills) || skills.length !== 2) {
    return c.json({ error: "Choose exactly 2 skills." }, 400);
  }

  const adv = { ...gameState.adventurer };
  adv.skills = { ...adv.skills };
  skills.forEach((s: string) => {
    adv.skills[s] = (adv.skills[s] || 0) + 5;
  });

  await repo.saveAdventurer(id, { ...gameState, adventurer: adv });
  return c.json({ message: "Skills applied. Proceed to finalize.", adventurer: adv });
});

// ─── Step 5: Finalize ───────────────────────────────────────────────────────
chargenRoutes.post("/finalize", async (c: Context) => {
  const repo = c.get("repository");
  const { id } = await c.req.json();

  const gameState = await repo.loadAdventurer(id);
  if (!gameState) return c.json({ error: "Adventurer not found." }, 404);

  const adv = { ...gameState.adventurer };

  // Look up Book 8 race-specific starting values
  const rbRace = RACE_B_TABLE.find((r) => r.name === adv.race);
  adv.hp = rbRace?.startingHp || 20;
  adv.maxHp = adv.hp;
  adv.reputation = 1 + (rbRace?.startingRep ?? 0);
  adv.fate = 3 + (rbRace?.extraFate ?? 0);
  adv.life = 3 + (rbRace?.startingLifePoints ?? 0);
  adv.oil = 20;
  adv.food = 10;
  adv.picks = 15;

  const weaponRoll = Math.floor(Math.random() * 100) + 1;
  const weapon = tableService.getTableW(weaponRoll);
  adv.backpack = [...adv.backpack, {
    id: crypto.randomUUID(),
    name: weapon.name,
    value: weapon.value || 0,
    fix: weapon.fix || 0,
    damagePips: 0,
    bonus: weapon.bonus || 0,
    damage: weapon.damage,
    twoHanded: weapon.name.includes("Great") || weapon.name.includes("Maul") || weapon.name.includes("Bow"),
    usable: false
  }];

  for (let i = 0; i < 3; i++) {
    const armorRoll = Math.floor(Math.random() * 100) + 1;
    const armor = tableService.getTableA(armorRoll);
    adv.backpack = [...adv.backpack, {
      id: crypto.randomUUID(),
      name: armor.name,
      value: armor.value || 0,
      fix: armor.fix || 0,
      damagePips: 0,
      bonus: armor.bonus || 0,
      twoHanded: false,
      usable: false
    }];
  }

  for (let i = 0; i < 3; i++) {
    adv.backpack = [...adv.backpack, {
      id: crypto.randomUUID(),
      name: "Lesser Healing Potion",
      description: "Restores 4 HP",
      value: 50,
      fix: 5,
      damagePips: 0,
      twoHanded: false,
      bonus: 0,
      usable: true,
      effect: "HEAL:4"
    }];
  }

  await repo.saveAdventurer(id, { ...gameState, adventurer: adv });
  return c.json({ message: "Adventurer finalized. Ready for quest!", adventurer: adv });
});

// ─── Fast Track ──────────────────────────────────────────
// Creates a quest-ready adventurer equivalent to one that completed
// the first 5 training quests.
const FastTrackSchema = z.object({
  id: z.string(),
  // Caller provides the dice rolls so the server stays deterministic/testable
  rolls: z.object({
    questOutcome: z.number().int().min(1).max(100),     // table: completed/failed
    pathExperience: z.number().int().min(1).max(100),   // path XP table
    skillExperience: z.number().int().min(1).max(100),  // random skill XP table
    consequences: z.number().int().min(1).max(100),     // consequence table
    // weapon/armour/treasure rolls (4W, 4A, 2TA)
    weaponRolls: z.array(z.number().int().min(1).max(100)).length(4),
    armourRolls: z.array(z.number().int().min(1).max(100)).length(4),
    taRolls:     z.array(z.number().int().min(1).max(100)).length(2),
    // random skill for bonus (1d10)
    randomSkill: z.number().int().min(1).max(10),
  }),
});

const RANDOM_SKILLS = [
  "Strong", "Bravery", "Dodge", "Escape", "Locks",
  "Lucky", "Aware", "Agility", "Magic", "Traps"
];

chargenRoutes.post("/fast-track", async (c: Context) => {
  const repo = c.get("repository");
  const body = await c.req.json();
  const result = FastTrackSchema.safeParse(body);
  if (!result.success) return c.json({ error: result.error }, 400);

  const { id, rolls } = result.data;
  const gameState = await repo.loadAdventurer(id);
  if (!gameState) return c.json({ error: "Adventurer not found." }, 404);

  if (!gameState.adventurer.path) {
    return c.json({ error: "Adventurer must have a path before fast-tracking." }, 400);
  }

  let adv = { ...gameState.adventurer };

  // Step 2: base bonuses
  adv.str  += 1; adv.dex  += 1; adv.int  += 1;
  adv.maxHp = (adv.maxHp || 20) + 1; adv.hp = adv.maxHp;
  adv.reputation = (adv.reputation || 1) + 1;
  adv.fate = (adv.fate || 3) + 1;
  adv.life = (adv.life || 3) + 1;
  adv.gold = (adv.gold || 0) + 100;
  const randomSkillName = RANDOM_SKILLS[(rolls.randomSkill - 1) % RANDOM_SKILLS.length];
  adv.skills = { ...adv.skills, [randomSkillName]: (adv.skills[randomSkillName] || 0) + 5 };

  // Step 3: quest outcome (tick first 5 quests)
  adv.questsCompleted = 5;
  adv.questsFailed = 0;
  let completed = 5; let failed = 0;
  if (rolls.questOutcome <= 25)      { completed = 5; failed = 3; }
  else if (rolls.questOutcome <= 50) { completed = 5; failed = 2; }
  else if (rolls.questOutcome <= 75) { completed = 5; failed = 1; }
  else                               { completed = 5; failed = 0; }
  adv.questsCompleted = completed;
  adv.questsFailed    = failed;

  // Step 4: gear rolls
  adv.backpack = [...(adv.backpack || [])];
  for (const r of rolls.weaponRolls) {
    const w = tableService.getTableW(r);
    adv.backpack.push({ id: crypto.randomUUID(), name: w.name, value: w.value||0, fix: w.fix||0, damagePips: 0, bonus: w.bonus||0, damage: w.damage, twoHanded: false, usable: false });
  }
  for (const r of rolls.armourRolls) {
    const a = tableService.getTableA(r);
    adv.backpack.push({ id: crypto.randomUUID(), name: a.name, value: a.value||0, fix: a.fix||0, damagePips: 0, bonus: a.bonus||0, twoHanded: false, usable: false });
  }
  for (const r of rolls.taRolls) {
    const t = tableService.getTableL(r); // TA uses loot table
    adv.backpack.push({ id: crypto.randomUUID(), name: t.name, value: t.value||0, fix: t.fix||0, damagePips: 0, bonus: 0, twoHanded: false, usable: false });
  }

  // Step 5: path-based experience
  const pathGroup = adv.path === "Warrior" || adv.path === "Knight" || adv.path === "Paladin" || adv.path === "Barbarian"
    ? "str"
    : adv.path === "Rogue" || adv.path === "Assassin" || adv.path === "Scoundrel" || adv.path === "Hunter"
      ? "dex" : "int";

  if (rolls.pathExperience <= 25) {
    adv.experiencePips = (adv.experiencePips || 0) + 5;
  } else if (rolls.pathExperience <= 50) {
    if (pathGroup === "str") adv.str += 5;
    else if (pathGroup === "dex") adv.dex += 5;
    else adv.int += 5;
  } else if (rolls.pathExperience <= 75) {
    if (pathGroup === "str") adv.str += 5;
    else if (pathGroup === "dex") adv.dex += 5;
    else adv.int += 5;
    adv.experiencePips = (adv.experiencePips || 0) + 5;
  } else {
    if (pathGroup === "str") adv.str += 10;
    else if (pathGroup === "dex") adv.dex += 10;
    else adv.int += 10;
  }

  // random skill experience (table 2)
  const rSkillIdx = (Math.floor(Math.random() * 10));
  const rSkill = RANDOM_SKILLS[rSkillIdx];
  if (rolls.skillExperience <= 25) {
    adv.experiencePips = (adv.experiencePips || 0) + 5;
  } else if (rolls.skillExperience <= 50) {
    adv.skills[rSkill] = (adv.skills[rSkill] || 0) + 5;
  } else if (rolls.skillExperience <= 75) {
    adv.experiencePips = (adv.experiencePips || 0) + 10;
  } else {
    adv.skills[rSkill] = (adv.skills[rSkill] || 0) + 5;
    const rSkill2 = RANDOM_SKILLS[(rSkillIdx + 1) % 10];
    adv.skills[rSkill2] = (adv.skills[rSkill2] || 0) + 5;
  }

  // Step 6: consequences based on failed quests
  const f = failed;
  let fateLoss = 0, lifeLoss = 0;
  if (rolls.consequences <= 25) {
    fateLoss = [3,3,4,4][f]; lifeLoss = [0,2,3,4][f];
  } else if (rolls.consequences <= 50) {
    fateLoss = [2,3,4,4][f]; lifeLoss = [2,2,3,3][f];
  } else if (rolls.consequences <= 75) {
    fateLoss = [2,2,2,3][f]; lifeLoss = [1,2,2,2][f];
  } else {
    fateLoss = [1,2,2,3][f]; lifeLoss = [1,1,2,2][f];
  }
  adv.fate = Math.max(0, adv.fate - fateLoss);
  adv.life = Math.max(0, adv.life - lifeLoss);

  await repo.saveAdventurer(id, { ...gameState, adventurer: adv });
  return c.json({
    message: "Fast track complete. Adventurer is quest-ready!",
    questsCompleted: completed, questsFailed: failed,
    adventurer: adv
  });
});

// ─── List user's adventurers ─────────────────────────────────────────────────
chargenRoutes.get("/list", async (c: Context) => {
  const repo = c.get("repository");
  const user = c.get("user");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const ids = await repo.listAdventurersForUser(user.id);
  const adventurersList = [];

  for (const id of ids) {
    const state = await repo.loadAdventurer(id);
    if (state) adventurersList.push(state.adventurer);
  }

  return c.json(adventurersList);
});

// ─── List available paths and races ─────────────────────────────────────────
chargenRoutes.get("/options", (_c: Context) => {
  return _c.json({
    paths: Object.entries(PATHS).map(([name, def]) => ({ name, ...def })),
    races: Object.entries(RACES).map(([name, def]) => {
      const rbEntry = RACE_B_TABLE.find((r) => r.name === name);
      return {
        name,
        ...def,
        ...(rbEntry ? {
          statAssignment: rbEntry.statAssignment,
          extraFate: rbEntry.extraFate,
          startingHp: rbEntry.startingHp || 20,
          startingLifePoints: rbEntry.startingLifePoints ? 3 + rbEntry.startingLifePoints : 3,
          startingRep: 1 + rbEntry.startingRep,
          description: rbEntry.description,
          book: 8,
        } : {}),
      };
    }),
  });
});

export default chargenRoutes;
