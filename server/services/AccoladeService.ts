// AccoladeService — Book 8: Curious Rules
// Accolades are permanent titles granted when the adventurer meets criteria.
// Once granted they provide an ongoing passive perk.
//
// The six accolades:
//   Archmage      — primary stat Int ≥ 80 and is an active Arcanist
//   Expert        — holds weapon proficiency pips in 3+ different weapons
//   Philanthropist— has donated ≥ 1000g total (tracked via arcanist.arcaneLawBroken proxy
//                   or a separate field; we use skills["DonationTotal"] as a convention)
//   Prodigious    — has max (20) combat experience pips for 5+ monster types
//   Slayer        — has at least 1 kill pip for every standard Table E monster
//   Toxophilite   — holds weapon proficiency pips in at least one bow or crossbow

import type { Adventurer } from "../models/adventurer.ts";

export type AccoladeName =
  | "Archmage"
  | "Expert"
  | "Philanthropist"
  | "Prodigious"
  | "Slayer"
  | "Toxophilite";

export interface AccoladeCheckResult {
  newlyGranted: AccoladeName[];
  current: Record<string, boolean>;
  perks: Partial<Record<AccoladeName, string>>;
  message: string;
}

/** Passive perk descriptions */
const ACCOLADE_PERKS: Record<AccoladeName, string> = {
  Archmage:       "Treat all Int-based test as Int +10 whilst wearing mage robes.",
  Expert:         "Reduce weapon penalty by 5 for all weapon types you have pips in.",
  Philanthropist: "All settlement purchases cost 10% less gold (round down).",
  Prodigious:     "Gain 1 extra combat experience pip per quest.",
  Slayer:         "+1 Dmg against all standard dungeon monsters.",
  Toxophilite:    "+5 bonus to ranged attack rolls.",
};

/** Ranged weapon names that count for Toxophilite */
const RANGED_WEAPONS = [
  "Short Bow", "Long Bow", "Composite Bow", "Crossbow",
  "Heavy Crossbow", "Shortbow", "Longbow",
];

/** Table E standard monsters (first-edition canonical list) */
const TABLE_E_MONSTERS = [
  "Skeleton", "Zombie", "Giant Rat", "Goblin", "Orc",
  "Dark Elf", "Dwarf", "Lizard Man", "Ghoul", "Hobgoblin",
  "Bandit", "Giant Spider", "Troll", "Ogre", "Minotaur",
  "Werewolf", "Vampire", "Demon", "Dragon", "Lich",
];

function isArchmage(adv: Adventurer): boolean {
  return adv.int >= 80 && adv.arcanist != null;
}

function isExpert(adv: Adventurer): boolean {
  const prof = adv.weaponProficiency ?? {};
  return Object.values(prof).filter((p) => p > 0).length >= 3;
}

function isPhilanthropist(adv: Adventurer): boolean {
  // Convention: total donations tracked as skills["DonationTotal"]
  const donated = adv.skills?.["DonationTotal"] ?? 0;
  return donated >= 1000;
}

function isProdigious(adv: Adventurer): boolean {
  const xp = adv.combatExperience ?? {};
  return Object.values(xp).filter((p) => p >= 20).length >= 5;
}

function isSlayer(adv: Adventurer): boolean {
  const xp = adv.combatExperience ?? {};
  return TABLE_E_MONSTERS.every((m) => (xp[m] ?? 0) >= 1);
}

function isToxophilite(adv: Adventurer): boolean {
  const prof = adv.weaponProficiency ?? {};
  return RANGED_WEAPONS.some((w) => (prof[w] ?? 0) > 0);
}

const CRITERIA: Record<AccoladeName, (adv: Adventurer) => boolean> = {
  Archmage:       isArchmage,
  Expert:         isExpert,
  Philanthropist: isPhilanthropist,
  Prodigious:     isProdigious,
  Slayer:         isSlayer,
  Toxophilite:    isToxophilite,
};

export class AccoladeService {
  /**
   * Evaluate all six accolade criteria and grant any newly earned accolades.
   * Returns the updated adventurer and details of what was granted.
   */
  checkAccolades(adv: Adventurer): { adventurer: Adventurer; result: AccoladeCheckResult } {
    const current: Record<string, boolean> = { ...(adv.accolades ?? {}) };
    const newlyGranted: AccoladeName[] = [];

    for (const name of Object.keys(CRITERIA) as AccoladeName[]) {
      if (!current[name] && CRITERIA[name](adv)) {
        current[name] = true;
        newlyGranted.push(name);
      }
    }

    const adventurer: Adventurer = { ...adv, accolades: current };

    const perks: Partial<Record<AccoladeName, string>> = {};
    for (const name of newlyGranted) {
      perks[name] = ACCOLADE_PERKS[name];
    }

    const msg = newlyGranted.length > 0
      ? `Accolades earned: ${newlyGranted.join(", ")}!`
      : "No new accolades earned.";

    return {
      adventurer,
      result: { newlyGranted, current, perks, message: msg },
    };
  }

  /** Return the perk text for each currently active accolade. */
  getActivePerks(adv: Adventurer): Partial<Record<AccoladeName, string>> {
    const perks: Partial<Record<AccoladeName, string>> = {};
    for (const [name, active] of Object.entries(adv.accolades ?? {})) {
      if (active) perks[name as AccoladeName] = ACCOLADE_PERKS[name as AccoladeName];
    }
    return perks;
  }
}
