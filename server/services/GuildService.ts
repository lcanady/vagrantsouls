// src/services/GuildService.ts
import { Adventurer } from "../models/adventurer.ts";
import {
  GuildDefinition,
  GuildRank,
  getGuildById,
  rankForStanding,
  unlockedBenefits,
  GuildRankInfo,
} from "../data/guilds.ts";
import { GuildEvent } from "../repository.ts";

export interface GuildResult {
  success: boolean;
  message: string;
  rankChanged?: boolean;
  newRank?: GuildRank;
  previousRank?: GuildRank;
  standingGained?: number;
  goldSpent?: number;
  event?: GuildEvent;
  previousGuildId?: string;
}

export interface GuildStatus {
  guild: GuildDefinition;
  rank: GuildRank;
  standing: number;
  benefits: GuildRankInfo[];
}

export class GuildService {
  /**
   * Joins an adventurer to a guild.
   * Fails if the guild does not exist or the adventurer is already a member.
   */
  joinGuild(
    adventurer: Adventurer,
    guildId: string,
  ): { adventurer: Adventurer; result: GuildResult } {
    const guild = getGuildById(guildId);
    if (!guild) {
      return { adventurer, result: { success: false, message: `Guild '${guildId}' not found.` } };
    }
    if (adventurer.guildId) {
      return {
        adventurer,
        result: { success: false, message: `Already a member of '${adventurer.guildId}'. Leave first.` },
      };
    }

    const updated: Adventurer = { ...adventurer, guildId, guildStanding: 0 };
    const event: GuildEvent = {
      type: "joined",
      adventurerId: adventurer.id,
      adventurerName: adventurer.name,
      rank: rankForStanding(0),
      timestamp: new Date().toISOString(),
    };

    return {
      adventurer: updated,
      result: {
        success: true,
        message: `Welcome to the ${guild.name}, ${adventurer.name}! Your legend begins here.`,
        event,
      },
    };
  }

  /**
   * Removes an adventurer from their current guild, resetting standing to 0.
   */
  leaveGuild(
    adventurer: Adventurer,
  ): { adventurer: Adventurer; result: GuildResult } {
    if (!adventurer.guildId) {
      return { adventurer, result: { success: false, message: "Not a member of any guild." } };
    }

    const previousGuildId = adventurer.guildId;
    const currentRank = rankForStanding(adventurer.guildStanding);
    const updated: Adventurer = { ...adventurer, guildId: null, guildStanding: 0 };
    const event: GuildEvent = {
      type: "left",
      adventurerId: adventurer.id,
      adventurerName: adventurer.name,
      rank: currentRank,
      timestamp: new Date().toISOString(),
    };

    return {
      adventurer: updated,
      result: {
        success: true,
        message: `${adventurer.name} has left the guild. Standing and rank have been reset.`,
        previousGuildId,
        event,
      },
    };
  }

  /**
   * Spends gold to increase guild standing.
   * Rate: 10 gold = 1 standing. Floors non-multiples of 10 (e.g. 15 gold = 1 standing, spends 10).
   * Minimum contribution: 10 gold. Maximum standing: 100.
   * Only spends the gold needed to reach max standing (no waste).
   */
  contribute(
    adventurer: Adventurer,
    goldAmount: number,
  ): { adventurer: Adventurer; result: GuildResult } {
    if (!adventurer.guildId) {
      return { adventurer, result: { success: false, message: "Not a member of any guild." } };
    }
    if (goldAmount < 10) {
      return { adventurer, result: { success: false, message: "Minimum contribution is 10 gold." } };
    }
    if (adventurer.gold < goldAmount) {
      return { adventurer, result: { success: false, message: "Not enough gold." } };
    }
    if (adventurer.guildStanding >= 100) {
      return { adventurer, result: { success: false, message: "Already at maximum standing (Legend)." } };
    }

    const maxStandingGainable = 100 - adventurer.guildStanding;
    const requestedStanding = Math.floor(goldAmount / 10);
    const standingGained = Math.min(requestedStanding, maxStandingGainable);
    const goldSpent = standingGained * 10;

    const previousRank = rankForStanding(adventurer.guildStanding);
    const newStanding = adventurer.guildStanding + standingGained;
    const newRank = rankForStanding(newStanding);
    const rankChanged = newRank !== previousRank;

    const updated: Adventurer = {
      ...adventurer,
      gold: adventurer.gold - goldSpent,
      guildStanding: newStanding,
    };

    let event: GuildEvent | undefined;
    if (rankChanged) {
      event = {
        type: "rank_up",
        adventurerId: adventurer.id,
        adventurerName: adventurer.name,
        rank: newRank,
        timestamp: new Date().toISOString(),
      };
    }

    const message = rankChanged
      ? `${adventurer.name} has risen to ${newRank} of the guild! (${newStanding}/100 standing)`
      : `Contributed ${goldSpent} gold. Standing: ${newStanding}/100.`;

    return {
      adventurer: updated,
      result: {
        success: true,
        message,
        standingGained,
        goldSpent,
        rankChanged: rankChanged || undefined,
        newRank: rankChanged ? newRank : undefined,
        previousRank: rankChanged ? previousRank : undefined,
        event,
      },
    };
  }

  /**
   * Returns the adventurer's current guild status, or null if not in a guild.
   */
  getStatus(adventurer: Adventurer): GuildStatus | null {
    if (!adventurer.guildId) return null;
    const guild = getGuildById(adventurer.guildId);
    if (!guild) return null;

    const rank = rankForStanding(adventurer.guildStanding);
    const benefits = unlockedBenefits(guild, rank);

    return { guild, rank, standing: adventurer.guildStanding, benefits };
  }
}
