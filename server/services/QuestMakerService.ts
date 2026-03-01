/**
 * QuestMakerService
 *
 * Procedurally generates new quests with objectives, an encounter modifier,
 * a description prompt, and a reward/penalty based on the Quest Reward (QR) total.
 */

// ── Quest Maker Table ────────────────────────────────────────────────────────
interface QuestObjectiveEntry {
  minRoll: number;
  maxRoll: number;
  description: string;
  qr: number;  // Quest Reward value contributed by this objective
}

const QUEST_OBJECTIVES: QuestObjectiveEntry[] = [
  { minRoll:  1, maxRoll:  2, description: "Loot 3 Items.", qr: 1 },
  { minRoll:  3, maxRoll:  5, description: "Loot 3 Parts.", qr: 1 },
  { minRoll:  6, maxRoll:  6, description: "Loot 1 Uncommon Part.", qr: 2 },
  { minRoll:  7, maxRoll:  7, description: "Loot 1 Scarce Part.", qr: 3 },
  { minRoll:  8, maxRoll:  8, description: "Loot 1 Rare Part.", qr: 3 },
  { minRoll:  9, maxRoll:  9, description: "Loot 1 Part, 1 Weapon and 1 Armour.", qr: 1 },
  { minRoll: 10, maxRoll: 10, description: "Loot 3 Parts from monsters 43 or higher on any encounter table.", qr: 1 },
  { minRoll: 11, maxRoll: 11, description: "Loot 3 Parts from monsters 58 or higher on any encounter table.", qr: 2 },
  { minRoll: 12, maxRoll: 12, description: "Loot 2 Parts from monsters 66 or higher on any encounter table.", qr: 2 },
  { minRoll: 13, maxRoll: 13, description: "Loot 1 Part from a monster 83 or higher on any encounter table.", qr: 3 },
  { minRoll: 14, maxRoll: 15, description: "Loot 3 Weapons.", qr: 1 },
  { minRoll: 16, maxRoll: 17, description: "Loot 3 Armour.", qr: 1 },
  { minRoll: 18, maxRoll: 18, description: "Loot 1 Treasure from table TA.", qr: 1 },
  { minRoll: 19, maxRoll: 19, description: "Loot 1 Treasure from table TB.", qr: 2 },
  { minRoll: 20, maxRoll: 20, description: "Loot 1 Treasure from table TC.", qr: 3 },
  { minRoll: 21, maxRoll: 21, description: "Loot 1 Objective Item.", qr: 1 },
  { minRoll: 22, maxRoll: 22, description: "Loot 2 Objective Items.", qr: 1 },
  { minRoll: 23, maxRoll: 24, description: "Collect 1 Objective Item.", qr: 1 },
  { minRoll: 25, maxRoll: 25, description: "Collect 2 Objective Items.", qr: 2 },
  { minRoll: 26, maxRoll: 26, description: "Collect 3 Objective Items.", qr: 3 },
  { minRoll: 27, maxRoll: 28, description: "Collect 1 Treasure from table TA.", qr: 1 },
  { minRoll: 29, maxRoll: 30, description: "Collect 1 Treasure from table TB.", qr: 1 },
  { minRoll: 31, maxRoll: 32, description: "Collect 1 Treasure from table TC.", qr: 1 },
  { minRoll: 33, maxRoll: 34, description: "Collect 2 Treasures from table TA.", qr: 1 },
  { minRoll: 35, maxRoll: 35, description: "Collect 2 Treasures from table TB.", qr: 2 },
  { minRoll: 36, maxRoll: 36, description: "Collect 2 Treasures from table TC.", qr: 2 },
  { minRoll: 37, maxRoll: 38, description: "Collect 1 Objective Item from table TA.", qr: 1 },
  { minRoll: 39, maxRoll: 40, description: "Collect 1 Objective Item from table TB.", qr: 1 },
  { minRoll: 41, maxRoll: 41, description: "Collect 1 Objective Item from table TC.", qr: 1 },
  { minRoll: 42, maxRoll: 42, description: "Collect 1 Treasure 86 or higher from table TA.", qr: 2 },
  { minRoll: 43, maxRoll: 43, description: "Collect 1 Treasure 89 or higher from table TB.", qr: 2 },
  { minRoll: 44, maxRoll: 44, description: "Collect 1 Treasure 83 or higher from table TC.", qr: 2 },
  { minRoll: 45, maxRoll: 45, description: "Collect 1 Legendary Item (Any).", qr: 3 },
  { minRoll: 46, maxRoll: 46, description: "Collect 1 Legendary Ring.", qr: 3 },
  { minRoll: 47, maxRoll: 47, description: "Collect 1 Legendary Necklace.", qr: 3 },
  { minRoll: 48, maxRoll: 48, description: "Collect 1 Legendary Weapon.", qr: 3 },
  { minRoll: 49, maxRoll: 49, description: "Collect 1 Legendary Armour.", qr: 3 },
  { minRoll: 50, maxRoll: 52, description: "Collect 1 Brew/Armour/Weapon/Potion/Elixir of Finer, or 1 Objective Item.", qr: 1 },
  { minRoll: 53, maxRoll: 54, description: "Collect 1 Brew/Armour/Weapon/Potion/Elixir of Greater, or 2 Objective Items.", qr: 2 },
  { minRoll: 55, maxRoll: 55, description: "Collect 1 Brew/Armour/Weapon/Potion/Elixir of Superior, or 3 Objective Items.", qr: 3 },
  { minRoll: 56, maxRoll: 56, description: "Collect 3 Brews.", qr: 2 },
  { minRoll: 57, maxRoll: 57, description: "Collect 3 Potions.", qr: 2 },
  { minRoll: 58, maxRoll: 58, description: "Collect 3 Elixirs.", qr: 3 },
  { minRoll: 59, maxRoll: 59, description: "Collect 3 Keys.", qr: 1 },
  { minRoll: 60, maxRoll: 61, description: "Explore 2 Yellow, 2 Green, 2 Red and 1 Blue areas.", qr: 1 },
  { minRoll: 62, maxRoll: 63, description: "Explore 5 Yellow and 5 Green areas.", qr: 1 },
  { minRoll: 64, maxRoll: 65, description: "Explore 5 Yellow and 5 Red areas.", qr: 1 },
  { minRoll: 66, maxRoll: 67, description: "Explore 5 Yellow and 2 Blue areas.", qr: 1 },
  { minRoll: 68, maxRoll: 69, description: "Explore 5 Green and 5 Red areas.", qr: 1 },
  { minRoll: 70, maxRoll: 71, description: "Explore 5 Green and 2 Blue areas.", qr: 1 },
  { minRoll: 72, maxRoll: 73, description: "Explore 5 Red and 2 Blue areas.", qr: 1 },
  { minRoll: 74, maxRoll: 75, description: "Explore any 15 areas.", qr: 1 },
  { minRoll: 76, maxRoll: 77, description: "Explore any 20 areas.", qr: 2 },
  { minRoll: 78, maxRoll: 78, description: "Explore any 25 areas.", qr: 2 },
  { minRoll: 79, maxRoll: 79, description: "Explore and open 3 Chests.", qr: 2 },
  { minRoll: 80, maxRoll: 80, description: "Explore and activate 3 Levers.", qr: 2 },
  { minRoll: 81, maxRoll: 81, description: "Explore 10 Areas after descending a Stairs.", qr: 2 },
  { minRoll: 82, maxRoll: 82, description: "Explore until 4 door codes have been changed to (O) Opened.", qr: 1 },
  { minRoll: 83, maxRoll: 84, description: "Kill any 5 monsters on any encounter table.", qr: 1 },
  { minRoll: 85, maxRoll: 86, description: "Kill any 10 monsters on any encounter table.", qr: 1 },
  { minRoll: 87, maxRoll: 87, description: "Kill 5 monsters 34 or higher on any encounter table.", qr: 1 },
  { minRoll: 88, maxRoll: 88, description: "Kill 3 monsters 45 or higher on any encounter table.", qr: 1 },
  { minRoll: 89, maxRoll: 89, description: "Kill 10 monsters 34 or higher on any encounter table.", qr: 2 },
  { minRoll: 90, maxRoll: 90, description: "Kill 5 monsters 50 or higher on any encounter table.", qr: 2 },
  { minRoll: 91, maxRoll: 91, description: "Kill 5 monsters marked with C on any encounter table.", qr: 2 },
  { minRoll: 92, maxRoll: 92, description: "Kill 5 monsters marked with d on any encounter table.", qr: 2 },
  { minRoll: 93, maxRoll: 93, description: "Kill 1 monster 85 or higher on any encounter table.", qr: 3 },
  { minRoll: 94, maxRoll: 94, description: "Kill 1 monster 94 or higher on any encounter table.", qr: 3 },
  { minRoll: 95, maxRoll: 95, description: "Kill 1 random monster (roll on any encounter table).", qr: 1 },
  { minRoll: 96, maxRoll: 96, description: "BOSS: Kill 1 random monster — roll 1d10+50 on any encounter table.", qr: 2 },
  { minRoll: 97, maxRoll: 97, description: "BOSS: Kill 1 random monster — roll 1d10+60 on any encounter table.", qr: 2 },
  { minRoll: 98, maxRoll: 98, description: "BOSS: Kill 1 random monster — roll 1d10+70 on any encounter table.", qr: 2 },
  { minRoll: 99, maxRoll: 99, description: "BOSS: Kill 1 random monster — roll 1d10+80 on any encounter table.", qr: 3 },
  { minRoll:100, maxRoll:100, description: "BOSS: Kill 1 random monster — roll 1d10+90 on any encounter table.", qr: 3 },
];

// ── Encounter modifier table ─────────────────────────────────────────────────
interface ModifierEntry {
  minRoll: number;
  maxRoll: number;
  range: string;
  modifier: number;
  qr: number;
}

const ENCOUNTER_MODIFIER_TABLE: ModifierEntry[] = [
  { minRoll:  1, maxRoll: 10, range: "1-60",  modifier: -40, qr: 1 },
  { minRoll: 11, maxRoll: 20, range: "1-70",  modifier: -30, qr: 1 },
  { minRoll: 21, maxRoll: 30, range: "1-80",  modifier: -20, qr: 2 },
  { minRoll: 31, maxRoll: 40, range: "1-90",  modifier: -10, qr: 2 },
  { minRoll: 41, maxRoll: 50, range: "1-95",  modifier:  -5, qr: 2 },
  { minRoll: 51, maxRoll: 60, range: "1-100", modifier:   0, qr: 2 },
  { minRoll: 61, maxRoll: 70, range: "6-100", modifier:  +5, qr: 2 },
  { minRoll: 71, maxRoll: 80, range: "11-100",modifier: +10, qr: 3 },
  { minRoll: 81, maxRoll: 90, range: "16-100",modifier: +15, qr: 3 },
  { minRoll: 91, maxRoll:100, range: "21-100",modifier: +20, qr: 3 },
];

// ── Reward/Penalty tables ────────────────────────────────────────────────────
interface RewardEntry {
  d10: number;
  success: string;
  failure: string;
}

const QR2_REWARDS: RewardEntry[] = [
  { d10: 1, success: "+50gp",  failure: "-½gp" },
  { d10: 2, success: "+80gp",  failure: "-½gp" },
  { d10: 3, success: "+100gp", failure: "-½gp" },
  { d10: 4, success: "+150gp", failure: "-½gp" },
  { d10: 5, success: "+180gp", failure: "-½gp" },
  { d10: 6, success: "+200gp", failure: "-½gp" },
  { d10: 7, success: "+300gp", failure: "-½gp" },
  { d10: 8, success: "+350gp", failure: "-½gp" },
  { d10: 9, success: "+400gp", failure: "-½gp" },
  { d10:10, success: "+500gp", failure: "-½gp" },
];

const QR3_REWARDS: RewardEntry[] = [
  { d10: 1, success: "+600gp",  failure: "-5 Skill" },
  { d10: 2, success: "+700gp",  failure: "-5 Skill" },
  { d10: 3, success: "+850gp",  failure: "-5 Skill" },
  { d10: 4, success: "+900gp",  failure: "-5 Skill" },
  { d10: 5, success: "+950gp",  failure: "-5 Skill" },
  { d10: 6, success: "+1000gp", failure: "-10 Skill" },
  { d10: 7, success: "+1200gp", failure: "-10 Skill" },
  { d10: 8, success: "+1400gp", failure: "-10 Skill" },
  { d10: 9, success: "+1500gp", failure: "-10 Skill" },
  { d10:10, success: "+1800gp", failure: "-10 Skill" },
];

const QR4_REWARDS: RewardEntry[] = [
  { d10: 1, success: "+1000gp, +1 Rep", failure: "-5 Skill, -1 Rep" },
  { d10: 2, success: "+1200gp, +1 Rep", failure: "-5 Skill, -1 Rep" },
  { d10: 3, success: "+1400gp, +1 Rep", failure: "-5 Skill, -1 Rep" },
  { d10: 4, success: "+1600gp, +1 Rep", failure: "-10 Skill, -1 Rep" },
  { d10: 5, success: "+2000gp, +1 Rep", failure: "-10 Skill, -1 Rep" },
  { d10: 6, success: "+2000gp",         failure: "-1 Characteristic" },
  { d10: 7, success: "+2200gp",         failure: "-1 Characteristic" },
  { d10: 8, success: "+2400gp",         failure: "-1 Characteristic" },
  { d10: 9, success: "+2600gp",         failure: "-1 Characteristic" },
  { d10:10, success: "+2800gp",         failure: "-1 Characteristic" },
];

const QR5_PLUS_REWARDS: RewardEntry[] = [
  { d10: 1, success: "+2500gp, +1 Rep", failure: "-1 Rep, -1 Characteristic" },
  { d10: 2, success: "+2800gp, +1 Rep", failure: "-1 Rep, -1 Characteristic" },
  { d10: 3, success: "+2900gp, +1 Rep", failure: "-1 Rep, -1 Characteristic" },
  { d10: 4, success: "+3000gp, +1 Rep", failure: "-1 Rep, -1 Characteristic" },
  { d10: 5, success: "+3000gp",         failure: "-2 Characteristics" },
  { d10: 6, success: "+3200gp",         failure: "-2 Characteristics" },
  { d10: 7, success: "+3400gp, +1 Rep", failure: "-1 Rep, -2 Characteristics" },
  { d10: 8, success: "+3800gp",         failure: "-3 Characteristics" },
  { d10: 9, success: "+4500gp, +1 Rep", failure: "-1 Rep, -3 Characteristics" },
  { d10:10, success: "+5000gp, +1 Rep", failure: "-1 Rep, -3 Characteristics" },
];

function lookupObjective(roll: number): QuestObjectiveEntry {
  return QUEST_OBJECTIVES.find(e => roll >= e.minRoll && roll <= e.maxRoll) ?? QUEST_OBJECTIVES[0];
}

function lookupModifier(roll: number): ModifierEntry {
  return ENCOUNTER_MODIFIER_TABLE.find(e => roll >= e.minRoll && roll <= e.maxRoll) ?? ENCOUNTER_MODIFIER_TABLE[5];
}

function lookupReward(qrTotal: number, d10: number): RewardEntry {
  if (qrTotal <= 2) return QR2_REWARDS.find(r => r.d10 === d10) ?? QR2_REWARDS[0];
  if (qrTotal === 3) return QR3_REWARDS.find(r => r.d10 === d10) ?? QR3_REWARDS[0];
  if (qrTotal === 4) return QR4_REWARDS.find(r => r.d10 === d10) ?? QR4_REWARDS[0];
  return QR5_PLUS_REWARDS.find(r => r.d10 === d10) ?? QR5_PLUS_REWARDS[0];
}

// ── Public interface ─────────────────────────────────────────────────────────
export interface GeneratedQuest {
  objectives: { description: string; qr: number }[];
  encounterModifier: number;
  encounterRange: string;
  qrTotal: number;
  reward: { success: string; failure: string };
}

export interface QuestGenerationRolls {
  objectiveRolls: number[];   // one or more 1-100 rolls
  modifierRoll: number;       // 1-100
  rewardRoll: number;         // 1-10
}

export class QuestMakerService {
  generate(rolls: QuestGenerationRolls): GeneratedQuest {
    const objectives = rolls.objectiveRolls.map(r => {
      const entry = lookupObjective(r);
      return { description: entry.description, qr: entry.qr };
    });

    const modEntry = lookupModifier(rolls.modifierRoll);
    const objectiveQR = objectives.reduce((s, o) => s + o.qr, 0);
    const qrTotal = objectiveQR + modEntry.qr;

    const d10 = Math.min(10, Math.max(1, rolls.rewardRoll));
    const reward = lookupReward(qrTotal, d10);

    return {
      objectives,
      encounterModifier: modEntry.modifier,
      encounterRange: modEntry.range,
      qrTotal,
      reward,
    };
  }
}
