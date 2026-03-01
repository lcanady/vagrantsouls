// tests/guild_test.ts
import { assertEquals } from "@std/assert";
import { GuildService } from "../server/services/GuildService.ts";
import { rankForStanding, getGuildById } from "../server/data/guilds.ts";
import { createInitialState } from "../server/state.ts";

const svc = new GuildService();

// --- rankForStanding helper ---

Deno.test("rankForStanding - 0 is newcomer", () => {
  assertEquals(rankForStanding(0), "newcomer");
});

Deno.test("rankForStanding - 24 is newcomer", () => {
  assertEquals(rankForStanding(24), "newcomer");
});

Deno.test("rankForStanding - 25 is initiate", () => {
  assertEquals(rankForStanding(25), "initiate");
});

Deno.test("rankForStanding - 49 is initiate", () => {
  assertEquals(rankForStanding(49), "initiate");
});

Deno.test("rankForStanding - 50 is veteran", () => {
  assertEquals(rankForStanding(50), "veteran");
});

Deno.test("rankForStanding - 75 is champion", () => {
  assertEquals(rankForStanding(75), "champion");
});

Deno.test("rankForStanding - 100 is legend", () => {
  assertEquals(rankForStanding(100), "legend");
});

// --- getGuildById helper ---

Deno.test("getGuildById - known id returns guild", () => {
  const guild = getGuildById("iron-vanguard");
  assertEquals(guild?.name, "Iron Vanguard");
});

Deno.test("getGuildById - unknown id returns undefined", () => {
  assertEquals(getGuildById("made-up-guild"), undefined);
});

// --- GuildService.joinGuild ---

Deno.test("joinGuild - valid guild sets guildId and resets standing to 0", () => {
  const state = createInitialState();
  const { adventurer, result } = svc.joinGuild(state.adventurer, "iron-vanguard");
  assertEquals(result.success, true);
  assertEquals(adventurer.guildId, "iron-vanguard");
  assertEquals(adventurer.guildStanding, 0);
});

Deno.test("joinGuild - emits a join event", () => {
  const state = createInitialState();
  const { result } = svc.joinGuild(state.adventurer, "iron-vanguard");
  assertEquals(result.event?.type, "joined");
});

Deno.test("joinGuild - invalid guildId returns failure", () => {
  const state = createInitialState();
  const { adventurer, result } = svc.joinGuild(state.adventurer, "bad-guild");
  assertEquals(result.success, false);
  assertEquals(adventurer.guildId, undefined);
});

Deno.test("joinGuild - already in a guild returns failure", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  const { result } = svc.joinGuild(state.adventurer, "arcane-circle");
  assertEquals(result.success, false);
});

// --- GuildService.leaveGuild ---

Deno.test("leaveGuild - clears guildId and resets standing", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.guildStanding = 40;
  const { adventurer, result } = svc.leaveGuild(state.adventurer);
  assertEquals(result.success, true);
  assertEquals(adventurer.guildId, null);
  assertEquals(adventurer.guildStanding, 0);
});

Deno.test("leaveGuild - emits a left event with correct previous guild", () => {
  const state = createInitialState();
  state.adventurer.guildId = "shadow-step";
  state.adventurer.guildStanding = 30;
  const { result } = svc.leaveGuild(state.adventurer);
  assertEquals(result.event?.type, "left");
  assertEquals(result.previousGuildId, "shadow-step");
});

Deno.test("leaveGuild - not in guild returns failure", () => {
  const state = createInitialState();
  const { result } = svc.leaveGuild(state.adventurer);
  assertEquals(result.success, false);
});

// --- GuildService.contribute ---

Deno.test("contribute - 10 gold gives 1 standing", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.guildStanding = 0;
  state.adventurer.gold = 100;
  const { adventurer, result } = svc.contribute(state.adventurer, 10);
  assertEquals(result.success, true);
  assertEquals(adventurer.guildStanding, 1);
  assertEquals(adventurer.gold, 90);
  assertEquals(result.standingGained, 1);
  assertEquals(result.goldSpent, 10);
});

Deno.test("contribute - 50 gold gives 5 standing", () => {
  const state = createInitialState();
  state.adventurer.guildId = "arcane-circle";
  state.adventurer.guildStanding = 0;
  state.adventurer.gold = 200;
  const { adventurer, result } = svc.contribute(state.adventurer, 50);
  assertEquals(adventurer.guildStanding, 5);
  assertEquals(result.goldSpent, 50);
});

Deno.test("contribute - crossing rank threshold sets rankChanged and emits event", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.guildStanding = 20;
  state.adventurer.gold = 500;
  const { adventurer, result } = svc.contribute(state.adventurer, 50);
  assertEquals(adventurer.guildStanding, 25);
  assertEquals(result.rankChanged, true);
  assertEquals(result.newRank, "initiate");
  assertEquals(result.previousRank, "newcomer");
  assertEquals(result.event?.type, "rank_up");
});

Deno.test("contribute - contribution capped at max standing (100)", () => {
  const state = createInitialState();
  state.adventurer.guildId = "shadow-step";
  state.adventurer.guildStanding = 98;
  state.adventurer.gold = 1000;
  const { adventurer, result } = svc.contribute(state.adventurer, 100);
  assertEquals(adventurer.guildStanding, 100);
  assertEquals(result.standingGained, 2);
  assertEquals(result.goldSpent, 20);
});

Deno.test("contribute - fails when not in a guild", () => {
  const state = createInitialState();
  state.adventurer.gold = 100;
  const { result } = svc.contribute(state.adventurer, 10);
  assertEquals(result.success, false);
});

Deno.test("contribute - fails when not enough gold", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.gold = 5;
  const { result } = svc.contribute(state.adventurer, 10);
  assertEquals(result.success, false);
});

Deno.test("contribute - fails with less than 10 gold contribution", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.gold = 100;
  const { result } = svc.contribute(state.adventurer, 9);
  assertEquals(result.success, false);
});

Deno.test("contribute - fails when already at max standing", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.guildStanding = 100;
  state.adventurer.gold = 100;
  const { result } = svc.contribute(state.adventurer, 10);
  assertEquals(result.success, false);
});

// --- GuildService.getStatus ---

Deno.test("getStatus - returns null when not in a guild", () => {
  const state = createInitialState();
  assertEquals(svc.getStatus(state.adventurer), null);
});

Deno.test("getStatus - returns rank and unlocked benefits for current standing", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.guildStanding = 30;
  const status = svc.getStatus(state.adventurer);
  assertEquals(status?.rank, "initiate");
  assertEquals(status?.guild.name, "Iron Vanguard");
  assertEquals(status?.benefits.length, 2);
});

Deno.test("getStatus - legend rank unlocks all 5 benefits", () => {
  const state = createInitialState();
  state.adventurer.guildId = "shadow-step";
  state.adventurer.guildStanding = 100;
  const status = svc.getStatus(state.adventurer);
  assertEquals(status?.rank, "legend");
  assertEquals(status?.benefits.length, 5);
});

// --- Additional boundary and edge case tests ---

Deno.test("rankForStanding - 74 is veteran", () => {
  assertEquals(rankForStanding(74), "veteran");
});

Deno.test("rankForStanding - 99 is champion", () => {
  assertEquals(rankForStanding(99), "champion");
});

Deno.test("contribute - non-multiple-of-10 floors to nearest 10 (15 gold → 1 standing, 10 gold spent)", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.guildStanding = 0;
  state.adventurer.gold = 100;
  const { adventurer, result } = svc.contribute(state.adventurer, 15);
  assertEquals(result.success, true);
  assertEquals(adventurer.guildStanding, 1);
  assertEquals(result.goldSpent, 10);
  assertEquals(adventurer.gold, 90);
});

Deno.test("joinGuild - standing resets to 0 after leave-then-rejoin", () => {
  const state = createInitialState();
  state.adventurer.guildId = "iron-vanguard";
  state.adventurer.guildStanding = 50;
  const { adventurer: leftAdv } = svc.leaveGuild(state.adventurer);
  const { adventurer: rejoinedAdv, result } = svc.joinGuild(leftAdv, "arcane-circle");
  assertEquals(result.success, true);
  assertEquals(rejoinedAdv.guildStanding, 0);
  assertEquals(rejoinedAdv.guildId, "arcane-circle");
});

Deno.test("leaveGuild - resets standing even at max (100)", () => {
  const state = createInitialState();
  state.adventurer.guildId = "shadow-step";
  state.adventurer.guildStanding = 100;
  const { adventurer, result } = svc.leaveGuild(state.adventurer);
  assertEquals(result.success, true);
  assertEquals(adventurer.guildStanding, 0);
  assertEquals(adventurer.guildId, null);
});
