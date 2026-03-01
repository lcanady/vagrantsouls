// src/data/guilds.ts

export type GuildRank = "newcomer" | "initiate" | "veteran" | "champion" | "legend";

export const GUILD_RANKS: GuildRank[] = [
  "newcomer",
  "initiate",
  "veteran",
  "champion",
  "legend",
];

export interface GuildRankInfo {
  description: string; // Shown to players
  effect: string;      // Machine-readable key for future mechanical integration
}

export interface GuildDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  compatiblePaths: string[];
  rankBenefits: Record<GuildRank, GuildRankInfo>;
}

export const GUILDS: GuildDefinition[] = [
  {
    id: "iron-vanguard",
    name: "Iron Vanguard",
    emoji: "⚔️",
    description: "A legendary order of Warriors sworn to protect the realm. Their hall rings with the clash of iron and the songs of heroes.",
    compatiblePaths: ["Warrior", "Knight", "Paladin", "Barbarian"],
    rankBenefits: {
      newcomer:  { description: "Access to the Iron Vanguard Guild Hall.", effect: "guild_hall_access" },
      initiate:  { description: "Weapon training costs 20% less gold during downtime.", effect: "training_weapon_discount_20" },
      veteran:   { description: "Heal 5 HP for free at the Guild Hall once per downtime.", effect: "guild_hall_heal_5" },
      champion:  { description: "Armor repair is free during downtime at the Guild Hall.", effect: "repair_free" },
      legend:    { description: "+10 to all Warrior-class skills.", effect: "warrior_skills_plus_10" },
    },
  },
  {
    id: "arcane-circle",
    name: "Arcane Circle",
    emoji: "🔮",
    description: "A circle of Sorcerers who gather beneath starlit towers to share forbidden knowledge and guard the balance of magic.",
    compatiblePaths: ["Sorcerer", "Warlock", "Druid", "Arcane Wizard"],
    rankBenefits: {
      newcomer:  { description: "Access to the Arcane Circle's library.", effect: "guild_hall_access" },
      initiate:  { description: "Magic tuition costs 20% less gold during downtime.", effect: "magic_tuition_discount_20" },
      veteran:   { description: "Gain 1 free spell pip once per downtime session.", effect: "free_spell_pip" },
      champion:  { description: "Spells learned during downtime cost 1 fewer pip (min 1).", effect: "spell_cost_minus_1" },
      legend:    { description: "+10 to all Sorcerer-class skills.", effect: "sorcerer_skills_plus_10" },
    },
  },
  {
    id: "shadow-step",
    name: "Shadow Step",
    emoji: "🗡️",
    description: "A guild of Rogues who move unseen through cities and dungeons alike. Membership is offered, never advertised.",
    compatiblePaths: ["Rogue", "Assassin", "Scoundrel", "Hunter"],
    rankBenefits: {
      newcomer:  { description: "Access to Shadow Step's underground contacts.", effect: "guild_hall_access" },
      initiate:  { description: "Sell loot for 10% more gold during downtime.", effect: "sell_bonus_10" },
      veteran:   { description: "Buy items for 10% less gold during downtime.", effect: "buy_discount_10" },
      champion:  { description: "Poison and disease treatment costs 50% less gold.", effect: "cure_discount_50" },
      legend:    { description: "+10 to all Rogue-class skills.", effect: "rogue_skills_plus_10" },
    },
  },
  {
    id: "silver-wanderers",
    name: "Silver Wanderers",
    emoji: "🌙",
    description: "Lone adventurers who answer to no banner and no order — bound only by the open road and their own code.",
    compatiblePaths: [], // Open to all paths (solo players, no allegiance)
    rankBenefits: {
      newcomer:  { description: "The road is yours. No hall, no obligations.", effect: "lone_wanderer" },
      initiate:  { description: "Downtime healing costs 10% less gold.", effect: "heal_discount_10" },
      veteran:   { description: "+5 to searching and scouting-related skills.", effect: "search_skills_plus_5" },
      champion:  { description: "Once per dungeon, you may reroll an encounter result.", effect: "encounter_reroll" },
      legend:    { description: "+5 to all base stats while adventuring solo.", effect: "solo_all_stats_plus_5" },
    },
  },
];

/** Returns a guild definition by its ID, or undefined if not found. */
export function getGuildById(id: string): GuildDefinition | undefined {
  return GUILDS.find((g) => g.id === id);
}

/**
 * Returns the rank an adventurer holds given their standing.
 * Standing 0–24 = newcomer, 25–49 = initiate, 50–74 = veteran, 75–99 = champion, 100 = legend.
 */
export function rankForStanding(standing: number): GuildRank {
  if (standing >= 100) return "legend";
  if (standing >= 75) return "champion";
  if (standing >= 50) return "veteran";
  if (standing >= 25) return "initiate";
  return "newcomer";
}

/** Returns all rank benefits unlocked at or below the given rank. */
export function unlockedBenefits(guild: GuildDefinition, rank: GuildRank): GuildRankInfo[] {
  const rankIndex = GUILD_RANKS.indexOf(rank);
  return GUILD_RANKS.slice(0, rankIndex + 1).map((r) => guild.rankBenefits[r]);
}
