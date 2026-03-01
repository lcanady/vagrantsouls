/**
 * Combat Experience Sheet data
 *
 * Each monster entry has two special abilities unlocked after 10 and 20 kills.
 * Ability names from the book's combat experience sheet categories.
 */

export interface CombatXpAbility {
  tier: 10 | 20;
  name: string;
  description: string;
}

export interface CombatXpEntry {
  monster: string;
  reactionModifier: number; // positive = monsters try to escape; negative = enrage
  abilities: CombatXpAbility[];
}

/**
 * Key combat experience entries.  In the physical game there is a printed sheet;
 * here we encode the most common encounter table monsters.
 *
 * Tier 10 = first special ability (10 kills)
 * Tier 20 = second special ability (20 kills)
 */
export const COMBAT_XP_TABLE: CombatXpEntry[] = [
  {
    monster: "Goblin",
    reactionModifier: +2,
    abilities: [
      { tier: 10, name: "Alert",    description: "Before a surprise test: +10 to adventurer's Aware." },
      { tier: 20, name: "Subterfuge", description: "Before attack rolls: treat the goblin as having -10 AV." },
    ],
  },
  {
    monster: "Orc",
    reactionModifier: -1,
    abilities: [
      { tier: 10, name: "Tactics",  description: "Before adventurer's attack roll: +10 Str." },
      { tier: 20, name: "Impact",   description: "Before damage roll: +2 Dmg." },
    ],
  },
  {
    monster: "Troll",
    reactionModifier: 0,
    abilities: [
      { tier: 10, name: "Weakness", description: "Before damage roll: monster loses -2 Def." },
      { tier: 20, name: "Troll Slayer", description: "Before damage roll: +4 Dmg." },
    ],
  },
  {
    monster: "Skeleton",
    reactionModifier: 0,
    abilities: [
      { tier: 10, name: "Disruption", description: "Before a combat round: skeleton's attack is disrupted (skip its attack this round)." },
      { tier: 20, name: "Holy Strength", description: "Before a combat round: adventurer gains +15 Str for the round." },
    ],
  },
  {
    monster: "Zombie",
    reactionModifier: 0,
    abilities: [
      { tier: 10, name: "Protection", description: "After zombie's ability: ignore 1 disease pip." },
      { tier: 20, name: "Courage",    description: "Before a combat round: adventurer is immune to Fear ability this round." },
    ],
  },
  {
    monster: "Dragon",
    reactionModifier: +3,
    abilities: [
      { tier: 10, name: "Dragon Slayer", description: "Before damage roll: +6 Dmg against dragons." },
      { tier: 20, name: "Evade Fire",    description: "After dragon's Fire ability: ignore the fire damage." },
    ],
  },
  {
    monster: "Imp",
    reactionModifier: +2,
    abilities: [
      { tier: 10, name: "Nimble",  description: "Before combat round: adventurer gains +10 Dex for the round." },
      { tier: 20, name: "Lure",    description: "Before attack rolls: adventurer ignores monster's Fly ability." },
    ],
  },
  {
    monster: "Demon",
    reactionModifier: -2,
    abilities: [
      { tier: 10, name: "Demon Slayer",  description: "Before damage roll: +4 Dmg against demons." },
      { tier: 20, name: "Gaze Block",    description: "After demon ability: ignore the next Dark Magic result." },
    ],
  },
  {
    monster: "Vampire",
    reactionModifier: +2,
    abilities: [
      { tier: 10, name: "Web Dodge",  description: "At end of combat round: ignore Webbing or life drain." },
      { tier: 20, name: "Dodge",      description: "Before damage roll: +2 Def." },
    ],
  },
  {
    monster: "Giant Spider",
    reactionModifier: 0,
    abilities: [
      { tier: 10, name: "Manoeuvre", description: "After spider ability: ignore the Webbing effect." },
      { tier: 20, name: "Advantage", description: "Before damage roll: +3 Dmg." },
    ],
  },
  {
    monster: "Werewolf",
    reactionModifier: -1,
    abilities: [
      { tier: 10, name: "Feint",    description: "Before adventurer's attack roll: roll twice, choose higher." },
      { tier: 20, name: "Counter",  description: "Before damage roll: +2 Dmg and monster suffers -1 Def." },
    ],
  },
  {
    monster: "Witch",
    reactionModifier: 0,
    abilities: [
      { tier: 10, name: "Resistant", description: "After a witch ability: the effect is halved." },
      { tier: 20, name: "Stay Dead", description: "When resurrection roll = 1: witch does not resurrect." },
    ],
  },
];

/** Look up entry by monster name (case-insensitive prefix match) */
export function getCombatXpEntry(monsterName: string): CombatXpEntry | undefined {
  const lower = monsterName.toLowerCase();
  return COMBAT_XP_TABLE.find(e =>
    lower.includes(e.monster.toLowerCase()) ||
    e.monster.toLowerCase().includes(lower)
  );
}

/** Get abilities unlocked for a given pip count */
export function getUnlockedAbilities(monsterName: string, pips: number): CombatXpAbility[] {
  const entry = getCombatXpEntry(monsterName);
  if (!entry) return [];
  return entry.abilities.filter(a => pips >= a.tier);
}
