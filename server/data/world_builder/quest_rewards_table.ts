// (WB) QR – QUEST REWARD TABLE
// RV = Q¢ + P¢ + H¢. Roll d6 at the matching RV band → encounter mod, success reward, failure penalty.

export interface QRResult {
  /** Gold gained on success */
  successGold: number;
  /** REP points gained on success (0 if none) */
  successRep: number;
  /**
   * Failure penalty type:
   * - "halfGold"   = lose half the success gold reward
   * - "skill"      = lose N skill bonus points
   * - "stat"       = lose 1 point of named stat
   * - "statLarge"  = lose N points of named stat
   */
  failureType: "halfGold" | "skill" | "stat" | "statLarge";
  /** How many skill points lost (only when failureType = "skill") */
  failureSkillLoss: number;
  /** Stat affected on failure: "Str" | "Dex" | "Int" | null */
  failureStat: "Str" | "Dex" | "Int" | null;
  /** How many stat points lost (1, 2, 3, or 5; only when failureStat != null) */
  failureStatLoss: number;
  /** REP lost on failure (0 if none) */
  failureRep: number;
  /** Encounter table modifier applied when on this quest */
  encMod: number;
}

export interface QRBand {
  /** Minimum RV (inclusive). Use -999 for "0 or less". */
  minRv: number;
  /** Maximum RV (inclusive). Use 999 for "11 or more". */
  maxRv: number;
  /** Results indexed by d6 roll (index 0 = d6 result 1, index 5 = d6 result 6) */
  results: [QRResult, QRResult, QRResult, QRResult, QRResult, QRResult];
}

function halfGold(gold: number, rep: number, encMod: number): QRResult {
  return { successGold: gold, successRep: rep, failureType: "halfGold", failureSkillLoss: 0, failureStat: null, failureStatLoss: 0, failureRep: 0, encMod };
}

function skillLoss(gold: number, successRep: number, skillLoss: number, failRep: number, encMod: number): QRResult {
  return { successGold: gold, successRep, failureType: "skill", failureSkillLoss: skillLoss, failureStat: null, failureStatLoss: 0, failureRep: failRep, encMod };
}

function statLoss(gold: number, successRep: number, stat: "Str" | "Dex" | "Int", statLoss: number, failRep: number, encMod: number): QRResult {
  const type = statLoss > 1 ? "statLarge" : "stat";
  return { successGold: gold, successRep, failureType: type, failureSkillLoss: 0, failureStat: stat, failureStatLoss: statLoss, failureRep: failRep, encMod };
}

export const QUEST_REWARDS_TABLE: QRBand[] = [
  {
    minRv: -999, maxRv: 0,
    results: [
      halfGold(30, 0, -40),
      halfGold(40, 0, -40),
      halfGold(50, 0, -40),
      halfGold(60, 0, -40),
      halfGold(70, 0, -40),
      halfGold(80, 0, -40),
    ],
  },
  {
    minRv: 1, maxRv: 1,
    results: [
      halfGold(70, 0, -30),
      halfGold(80, 0, -30),
      halfGold(90, 0, -30),
      halfGold(100, 0, -30),
      halfGold(110, 0, -30),
      halfGold(120, 0, -30),
    ],
  },
  {
    minRv: 2, maxRv: 2,
    results: [
      halfGold(110, 0, -20),
      halfGold(120, 0, -20),
      halfGold(150, 0, -20),
      halfGold(200, 0, -20),
      halfGold(250, 0, -20),
      halfGold(300, 0, -20),
    ],
  },
  {
    minRv: 3, maxRv: 3,
    results: [
      halfGold(250, 0, -15),
      halfGold(300, 0, -15),
      halfGold(350, 0, -15),
      halfGold(400, 0, -15),
      halfGold(450, 0, -15),
      halfGold(500, 0, -15),
    ],
  },
  {
    minRv: 4, maxRv: 4,
    results: [
      halfGold(300, 0, -10),
      halfGold(350, 0, -10),
      halfGold(400, 0, -10),
      halfGold(450, 0, -10),
      halfGold(500, 0, -10),
      halfGold(550, 0, -10),
    ],
  },
  {
    minRv: 5, maxRv: 5,
    results: [
      halfGold(450, 0, -5),
      halfGold(500, 0, -5),
      halfGold(550, 0, -5),
      halfGold(600, 0, -5),
      halfGold(650, 0, -5),
      halfGold(700, 0, -5),
    ],
  },
  {
    minRv: 6, maxRv: 6,
    results: [
      skillLoss(400,  0, 5, 0, 0),
      skillLoss(600,  0, 5, 0, 0),
      skillLoss(800,  0, 5, 0, 0),
      skillLoss(1000, 1, 5, 1, 0),
      skillLoss(1200, 1, 5, 1, 0),
      skillLoss(1400, 1, 5, 1, 0),
    ],
  },
  {
    minRv: 7, maxRv: 7,
    results: [
      skillLoss(800,  0,  10, 0, 5),
      skillLoss(1000, 1,  10, 1, 5),
      skillLoss(1200, 1,  10, 1, 5),
      skillLoss(1400, 1,  10, 1, 5),
      skillLoss(1600, 1,  10, 1, 5),
      skillLoss(1800, 1,  10, 1, 5),
    ],
  },
  {
    minRv: 8, maxRv: 8,
    results: [
      statLoss(1600, 0, "Str", 1, 0, 10),
      statLoss(1800, 0, "Dex", 1, 0, 10),
      statLoss(2000, 0, "Int", 1, 0, 10),
      statLoss(2500, 1, "Str", 1, 1, 10),
      statLoss(3000, 1, "Dex", 1, 1, 10),
      statLoss(3500, 1, "Int", 1, 1, 10),
    ],
  },
  {
    minRv: 9, maxRv: 9,
    results: [
      statLoss(2000, 1, "Str", 1, 1, 15),
      statLoss(2500, 1, "Dex", 1, 1, 15),
      statLoss(3000, 1, "Int", 1, 1, 15),
      statLoss(3500, 1, "Str", 2, 1, 15),
      statLoss(4000, 1, "Dex", 2, 1, 15),
      statLoss(4500, 1, "Int", 2, 1, 15),
    ],
  },
  {
    minRv: 10, maxRv: 10,
    results: [
      statLoss(3500, 1, "Str", 2, 1, 20),
      statLoss(4000, 1, "Dex", 2, 1, 20),
      statLoss(4500, 1, "Int", 2, 1, 20),
      statLoss(5000, 1, "Str", 3, 1, 20),
      statLoss(5500, 1, "Dex", 3, 1, 20),
      statLoss(6000, 1, "Int", 3, 1, 20),
    ],
  },
  {
    minRv: 11, maxRv: 999,
    results: [
      statLoss(5000,  1, "Str", 3, 1, 25),
      statLoss(5500,  1, "Dex", 3, 1, 25),
      statLoss(6000,  1, "Int", 3, 1, 25),
      statLoss(8000,  2, "Str", 5, 2, 25),
      statLoss(10000, 2, "Dex", 5, 2, 25),
      statLoss(12000, 2, "Int", 5, 2, 25),
    ],
  },
];

/**
 * Look up a quest reward entry.
 * @param rv Total Reward Value (Q¢ + P¢ + H¢)
 * @param d6 Roll result 1-6
 */
export function getQuestReward(rv: number, d6: number): QRResult {
  if (d6 < 1 || d6 > 6) throw new Error(`Invalid d6 roll for quest reward: ${d6}`);
  const band = QUEST_REWARDS_TABLE.find((b) => rv >= b.minRv && rv <= b.maxRv);
  if (!band) throw new Error(`No quest reward band found for RV: ${rv}`);
  return band.results[d6 - 1];
}
