// QE – QUESTS E TABLE (Book 8: The Forgotten Tome of Curious Rules)
// Ten new quests for the quest tracker (slots QE–QI on the quest sheet).

export interface QuestMonster {
  name: string;
  av: number;
  def: number;
  /** Numeric damage modifier (e.g. +2 → 2) */
  dmg: number;
  /** HP string as written — may include pack notation e.g. "6/5/5/6/6/6" */
  hp: string;
  /** Kill reward string e.g. "A-30, I, W+30" */
  killReward: string;
  abilities: string[];
}

export interface QuestEObjective {
  type: "kill" | "collect" | "explore" | "escort";
  description: string;
  /** Number required, if applicable */
  count?: number;
}

export interface QuestEEntry {
  minRoll: number;
  maxRoll: number;
  title: string;
  encounterModifier: number;
  /** Success reward description */
  successReward: string;
  /** Fail penalty description */
  failPenalty: string;
  objectives: QuestEObjective[];
  /** Named boss monster(s) if applicable */
  bosses?: QuestMonster[];
  /** Monsters encountered during the quest (non-boss) */
  monsters?: QuestMonster[];
  /** Enhancement item awarded on success, if any */
  enhancementReward?: {
    name: string;
    description: string;
    dmg?: number;
    def?: number;
    hp?: number;
    dex?: number;
    valueBonus: number;
    fixBonus: number;
  };
  lore: string;
}

export const QUESTS_E: QuestEEntry[] = [
  {
    minRoll: 1,
    maxRoll: 10,
    title: "MIGHTY RECRUITS",
    encounterModifier: 0,
    successReward: "Crystal of Mighty Power (enhancement)",
    failPenalty: "-10 Skill",
    objectives: [
      { type: "collect", description: "Collect 2 Objective Items (Green Arcane Shard 8gp, Blue Arcane Shard 8gp)", count: 2 },
      { type: "explore", description: "Find an Objective Area (the Approbation Stone)" },
    ],
    enhancementReward: {
      name: "Crystal of Mighty Power",
      description: "Enhancement: +2 Dmg",
      dmg: 2,
      valueBonus: 1800,
      fixBonus: 360,
    },
    lore:
      "The wizards over at the Arcane Tower have been sending new recruits into a dungeon to practice their " +
      "skills. Unfortunately, two have become lost and it's feared they are most probably dead. Each were " +
      "carrying a shard of crystal that when placed upon the Approbation Stone will merge and become one. " +
      "You must enter the dungeon and Collect 2 Objective Items, then find the Objective Area to combine " +
      "them into the Crystal of Mighty Power.",
  },
  {
    minRoll: 11,
    maxRoll: 20,
    title: "THE ASSASSIN'S HIDEOUT",
    encounterModifier: 0,
    successReward: "2000gp, +1 Rep",
    failPenalty: "-5 Skill, -1 Rep",
    objectives: [
      { type: "explore", description: "Find the assassin's personal quarters (roll 1d10 in searched areas, 10 = found)" },
      { type: "explore", description: "Find Objective Area (Darkstalker's hideout)" },
      { type: "kill", description: "Kill Darkstalker", count: 1 },
    ],
    bosses: [
      {
        name: "Darkstalker",
        av: 50, def: 2, dmg: 2, hp: "22",
        killReward: "A-30, I, W+30",
        abilities: ["Attacks 2", "Poison", "Phase", "Web (Net)"],
      },
    ],
    lore:
      "Commander Grey, the 'Keeper Of The Town' of Drud has placed a sizable bounty on the head of " +
      "Darkstalker, an assassin who recently took out one of the city's captains. You must enter the " +
      "assassin's hideout and hunt down Darkstalker. He ignores all escape reaction results.",
  },
  {
    minRoll: 21,
    maxRoll: 30,
    title: "THE EYE OF THE SERPENT GOD",
    encounterModifier: 0,
    successReward: "The Eye Of Manasaka (enhancement)",
    failPenalty: "-5 Skill",
    objectives: [
      { type: "explore", description: "Find Manasaka's lair (second Objective Area)" },
      { type: "kill", description: "Kill Manasaka", count: 1 },
    ],
    bosses: [
      {
        name: "Manasaka",
        av: 55, def: 4, dmg: 2, hp: "28",
        killReward: "TA, TB",
        abilities: ["Fear", "Large", "Phase", "Poison"],
      },
    ],
    enhancementReward: {
      name: "The Eye Of Manasaka",
      description: "Enhancement: +3 Def",
      def: 3,
      valueBonus: 2000,
      fixBonus: 400,
    },
    lore:
      "Deep in The Elven Trees is the Lair Of The Serpent God. You have tracked down the location of " +
      "Manasaka's lair and plan to slay the creature and dig out his eye. The second Objective Area is " +
      "Manasaka's lair. He ignores all escape reaction results. Note: Manasaka is a demon (d).",
  },
  {
    minRoll: 31,
    maxRoll: 40,
    title: "ARIMANIN THE RAT LORD",
    encounterModifier: 0,
    successReward: "2000gp, +1 Rep",
    failPenalty: "-5 Skill, -1 Rep",
    objectives: [
      { type: "kill", description: "Kill 20 Wererats (replace red area encounters with Wererats)", count: 20 },
    ],
    monsters: [
      {
        name: "Wererats",
        av: 40, def: 1, dmg: 2, hp: "6/5/5/6/6/6",
        killReward: "P2",
        abilities: ["Disease", "Fear", "Pack", "Regenerate", "Resurrection"],
      },
    ],
    lore:
      "Located not far from the city of Bladesworn is Rattingham Palace, home to Arimanin The Rat Lord " +
      "and his legions of rattus. Locals have put up a reward for their cull. Do not roll for encounters in " +
      "red areas — instead you always encounter Wererats. Kill 20 to complete the quest.",
  },
  {
    minRoll: 41,
    maxRoll: 50,
    title: "THE HEART OF DOOMTAR",
    encounterModifier: 0,
    successReward: "The Heart Of Doomtar (enhancement)",
    failPenalty: "-1 Int",
    objectives: [
      { type: "explore", description: "Find Doomtar's lair (second Objective Area)" },
      { type: "kill", description: "Kill Doomtar", count: 1 },
    ],
    bosses: [
      {
        name: "Doomtar",
        av: 55, def: 4, dmg: 2, hp: "39",
        killReward: "P2, I, W+20, TB",
        abilities: ["Fear", "Fire", "Fly", "Large"],
      },
    ],
    enhancementReward: {
      name: "The Heart Of Doomtar",
      description: "Enhancement: +5 HP",
      hp: 5,
      valueBonus: 2000,
      fixBonus: 400,
    },
    lore:
      "You have tracked down the location of Doomtar's lair and plan to slay the creature and dig out " +
      "the green crystal heart embedded in his chest. The second Objective Area is Doomtar's lair. He " +
      "ignores all escape reaction results. Note: Doomtar is a demon (d).",
  },
  {
    minRoll: 51,
    maxRoll: 60,
    title: "FOREST OF LESHIA",
    encounterModifier: 0,
    successReward: "Branch Of Leshia, 500gp",
    failPenalty: "-10 Skill",
    objectives: [
      { type: "collect", description: "Collect 3 Objective Items (Militia's Badge 5gp each)", count: 3 },
      { type: "explore", description: "Find 2 Objective Areas (second = Leshia's resting place)", count: 2 },
    ],
    lore:
      "On the forest island of Sorrowfall, a demigoddess and dryad named Leshia lives amongst the trees. " +
      "You must find the remains of the militia and Leshia's resting place. At the second Objective Area " +
      "you find Leshia's body; all that remains is a solid oak branch. Add '(II)(H) Branch Of Leshia " +
      "(Quarterstaff) (+10 Int) (+1 Dmg) (2100gp/420gp)' to the adventure sheet. Arcanists gain +3 Dmg.",
  },
  {
    minRoll: 61,
    maxRoll: 70,
    title: "NORAUS THE INIQUITOUS",
    encounterModifier: 0,
    successReward: "The Cerebral Stone (enhancement), +1 Rep",
    failPenalty: "-5 Skill, -1 Rep",
    objectives: [
      { type: "explore", description: "Find Noraus's location (second Objective Area)" },
      { type: "kill", description: "Kill Noraus The Iniquitous", count: 1 },
    ],
    bosses: [
      {
        name: "Noraus The Iniquitous",
        av: 60, def: 5, dmg: 2, hp: "35",
        killReward: "I, W+20, TB",
        abilities: ["Allies 6", "Dark Magic", "Pack", "Regenerate", "Resurrection"],
      },
    ],
    enhancementReward: {
      name: "The Cerebral Stone",
      description: "Enhancement: +10 Int",
      valueBonus: 2000,
      fixBonus: 400,
    },
    lore:
      "In Spiderspot Forest stands the black tower of Noraus The Iniquitous — a dark elf necromancer. " +
      "All monsters encountered in his tower are undead (gain C after name) with Fear, Regeneration, and " +
      "Resurrection abilities. Noraus ignores all escape reaction results. Allies ability: at start of each " +
      "round roll 1d6 — on a 1 add /6 to his current HP.",
  },
  {
    minRoll: 71,
    maxRoll: 80,
    title: "THE WARLOCK'S WAND",
    encounterModifier: 0,
    successReward: "Wumanok's Wand of Lightning",
    failPenalty: "-10 Skill",
    objectives: [
      { type: "explore", description: "Find Wumanok (third Objective Area)" },
      { type: "kill", description: "Kill Wumanok The Inexorable", count: 1 },
    ],
    bosses: [
      {
        name: "Wumanok The Inexorable",
        av: 60, def: 3, dmg: 3, hp: "30",
        killReward: "I, TB",
        abilities: ["Dark Magic", "Fire", "Lightning", "Phase", "Resurrection"],
      },
    ],
    lore:
      "A powerful warlock named Wumanok The Inexorable resides in the Valgor Mountains. When he is " +
      "defeated he resurrects, opens a portal, and escapes — leaving behind his wand. Add '(II)(H) " +
      "Wumanok's Wand of Lightning x2 (+3 Dmg) (2800gp/560gp)' — the lightning spell may be cast " +
      "twice per combat. Wumanok ignores all escape reaction results.",
  },
  {
    minRoll: 81,
    maxRoll: 90,
    title: "DOTTIE SWIFT MADDER",
    encounterModifier: 0,
    successReward: "3000gp, +1 Rep",
    failPenalty: "-5 Skill, -1 Rep",
    objectives: [
      { type: "kill", description: "Kill 20 Pirates (in yellow areas of the cave)", count: 20 },
      { type: "escort", description: "Escort Dottie to the dungeon entrance (roll 1d10 per area; 1-3 = she attacks)" },
    ],
    monsters: [
      {
        name: "Pirate",
        av: 50, def: 1, dmg: 1, hp: "12",
        killReward: "I/W",
        abilities: ["Surprise"],
      },
    ],
    lore:
      "The pirate Dottie Swift Madder has been shipwrecked. Kill 20 pirates, then escort her to the " +
      "entrance. In each area during the escort, roll 1d10: on 1, 2, or 3 Dottie attacks and you lose " +
      "HP equal to the number rolled. Reach the entrance to claim the reward.",
  },
  {
    minRoll: 91,
    maxRoll: 100,
    title: "THE CROWN OF HARGVEL",
    encounterModifier: 0,
    successReward: "The Lightning Stone (enhancement), +1 Rep",
    failPenalty: "-10 Skill, -1 Rep",
    objectives: [
      { type: "explore", description: "Find Hargvel's lair (second Objective Area)" },
      { type: "kill", description: "Kill Hargvel", count: 1 },
    ],
    bosses: [
      {
        name: "Hargvel",
        av: 65, def: 5, dmg: 3, hp: "9/9/40",
        killReward: "TC+10",
        abilities: ["Allies 9", "Dark Magic", "Fly", "Large", "Lightning", "Pack"],
      },
    ],
    monsters: [
      {
        name: "Valkyrja",
        av: 50, def: 2, dmg: 1, hp: "12",
        killReward: "A-15/I/W+15",
        abilities: ["Dark Magic", "Fly", "Lightning"],
      },
    ],
    enhancementReward: {
      name: "The Lightning Stone",
      description: "Enhancement: +10 Dex, +1 Def, +2 Dmg",
      dex: 10,
      def: 1,
      dmg: 2,
      valueBonus: 3000,
      fixBonus: 600,
    },
    lore:
      "Hargvel's Cavern is found north of The Ice Road. He is a demon god, half giant and half eagle, " +
      "worshipped by the Valkyrie. All first red-area encounters are Valkyrja. Hargvel ignores all escape " +
      "reaction results. Note: Hargvel is a demon (d). Slay him to claim the Lightning Stone from his crown.",
  },
];

/** Lookup a quest entry by d100 roll */
export function getQuestE(roll: number): QuestEEntry {
  const entry = QUESTS_E.find((q) => roll >= q.minRoll && roll <= q.maxRoll);
  if (!entry) throw new Error(`QE roll must be 1-100, got ${roll}`);
  return entry;
}
