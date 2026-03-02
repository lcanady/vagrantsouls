/**
 * WorldBuilderEventService
 *
 * Handles:
 * - rollEvent: look up event name from table (WB) E
 * - resolveEvent: apply event effects to adventurer and state
 *
 * Events that require additional rolls return `pendingEvents[]` for the caller to chain.
 * Events that trigger calendar entries call through to WorldBuilderCalendarService.
 * Events that require combat return a COMBAT pending event with monster details.
 *
 * Design decisions:
 * - All dice are passed in as parameters (deterministic, testable).
 * - Complex chained events (TAVERN→GAMBLE, STRANGER→CHANGE) add to pendingEvents[].
 * - Calendar-dated events (VAMPIRE, BITE, SLAVERY) add circled dates to state.
 */

import { Adventurer, WorldBuilderState } from "../models/adventurer.ts";
import { lookupEvent, WBEventName, EventContext } from "../data/world_builder/events_table.ts";
import { getRandomTreasureEntry } from "../data/world_builder/random_treasure_table.ts";
import { WorldBuilderCalendarService } from "./WorldBuilderCalendarService.ts";

const calendarService = new WorldBuilderCalendarService();

// ---------------------------------------------------------------------------
// Input / Output types
// ---------------------------------------------------------------------------

export interface EventRolls {
  /** Primary d100 event roll */
  d100?: number;
  /** d10 for treasure, side quests, etc. */
  d10?: number;
  /** d6 for various checks */
  d6?: number;
  /** d3 for HP loss */
  d3?: number;
  /** Secondary d100 (for two-roll events) */
  d100b?: number;
  /** d100 for test resolution (vs Str/Dex/Int modifier) */
  testRoll?: number;
  /** Additional testRoll (second test in sequence) */
  testRoll2?: number;
  /** Gold amount wagered (GAMBLE) */
  goldWagered?: number;
  /** LP delta (LAW event) */
  lpDelta?: number;
}

export interface PendingEvent {
  eventName: string;
  modifier: number;
  /** Extra data (monster name, circled date entry, etc.) */
  data?: Record<string, unknown>;
}

export interface EventResult {
  description: string;
  /** HP change (negative = loss) */
  hpDelta?: number;
  /** Gold change (negative = loss) */
  goldDelta?: number;
  /** REP change */
  repDelta?: number;
  /** Stat changes */
  strDelta?: number;
  dexDelta?: number;
  intDelta?: number;
  /** Poison pips added */
  poisonDelta?: number;
  /** Disease pips added */
  diseaseDelta?: number;
  /** Fatigue pips added */
  fatigueDelta?: number;
  /** LP change */
  lpDelta?: number;
  /** Rations change */
  rationsDelta?: number;
  /** Additional pending events to chain */
  pendingEvents: PendingEvent[];
  /** Whether adventurer is dead */
  dead?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class WorldBuilderEventService {

  /**
   * Look up which event fires for the given roll + terrain context.
   */
  rollEvent(roll: number, context: EventContext, modifier = 0): WBEventName {
    const adjustedRoll = Math.max(1, Math.min(100, roll + modifier));
    return lookupEvent(adjustedRoll, context);
  }

  /**
   * Resolve a named event. Applies all effects and returns updated state.
   */
  resolveEvent(
    adventurer: Adventurer,
    state: WorldBuilderState,
    eventName: WBEventName,
    rolls: EventRolls,
  ): { adventurer: Adventurer; state: WorldBuilderState; result: EventResult } {
    const handler = this._getHandler(eventName);
    return handler(adventurer, state, rolls);
  }

  // ---------------------------------------------------------------------------
  // Event handlers (one private method per event)
  // ---------------------------------------------------------------------------

  private _getHandler(
    eventName: WBEventName,
  ): (adv: Adventurer, state: WorldBuilderState, rolls: EventRolls) => {
    adventurer: Adventurer; state: WorldBuilderState; result: EventResult;
  } {
    const handlers: Partial<Record<WBEventName, typeof this._getHandler extends (n: WBEventName) => infer R ? R : never>> = {
      ATTACK: (adv, st, r) => this._attack(adv, st, r),
      AVALANCHE: (adv, st, r) => this._avalanche(adv, st, r),
      BITE: (adv, st, r) => this._bite(adv, st, r),
      BOGLAND: (adv, st, r) => this._hazardEvent(adv, st, r, "BOGLAND: test Dex-15 or lose 1d3 HP", "Dex", -15),
      BOOTY: (adv, st, r) => this._booty(adv, st, r),
      BORROWED: (adv, st, r) => this._borrowed(adv, st, r),
      BRAWL: (adv, st, r) => this._brawl(adv, st, r),
      BURGLARY: (adv, st, r) => this._burglary(adv, st, r),
      CAMEL: (adv, st, r) => this._camel(adv, st, r),
      CAPTURE: (adv, st, r) => this._capture(adv, st, r),
      CHANGE: (adv, st, r) => this._change(adv, st, r),
      CIRCUS: (adv, st, r) => this._circus(adv, st, r),
      CONFRONT_MOUNT_THIEF: (adv, st, r) => this._confrontMountThief(adv, st, r),
      CROSSWINDS: (adv, st, r) => this._crosswinds(adv, st, r),
      FARM: (adv, st, r) => this._farm(adv, st, r),
      FAY: (adv, st, r) => this._fay(adv, st, r),
      FLASH_FLOODS: (adv, st, r) => this._hazardEvent(adv, st, r, "FLASH FLOODS: test Dex-10 or lose 1d3 HP and 1 fatigue", "Dex", -10),
      FOG: (adv, st, r) => this._fog(adv, st, r),
      FORAGE_FISH: (adv, st, r) => this._forageFish(adv, st, r),
      GAMBLE: (adv, st, r) => this._gamble(adv, st, r),
      GUILD: (adv, st, r) => this._guild(adv, st, r),
      HANGING: (adv, st, r) => this._hanging(adv, st, r),
      HUNTED: (adv, st, r) => this._hunted(adv, st, r),
      HYBRID: (adv, st, r) => this._hybrid(adv, st, r),
      IDENTITY: (adv, st, r) => this._identity(adv, st, r),
      IMPASSABLE: (adv, st, r) => this._impassable(adv, st, r),
      ISLAND: (adv, st, r) => this._island(adv, st, r),
      JAIL: (adv, st, r) => this._jail(adv, st, r),
      JUNGLE_FEVER: (adv, st, r) => this._jungleFever(adv, st, r),
      JUNGLE_WORM: (adv, st, r) => this._jungleWorm(adv, st, r),
      LANDSLIDE: (adv, st, r) => this._hazardEvent(adv, st, r, "LANDSLIDE: test Str-10 or lose 1d3 HP", "Str", -10),
      LAW: (adv, st, r) => this._law(adv, st, r),
      LOST: (adv, st, r) => this._lost(adv, st, r),
      LUCKY_FIND: (adv, st, r) => this._luckyFind(adv, st, r),
      MALARIA: (adv, st, r) => this._malaria(adv, st, r),
      MIRAGE: (adv, st, r) => this._mirage(adv, st, r),
      MISSING: (adv, st, r) => this._missing(adv, st, r),
      MONSTER: (adv, st, r) => this._monster(adv, st, r),
      MOON: (adv, st, r) => this._moon(adv, st, r),
      MOUNTS: (adv, st, r) => this._mounts(adv, st, r),
      MOUNT_THEFT: (adv, st, r) => this._mountTheft(adv, st, r),
      MYSTIC: (adv, st, r) => this._mystic(adv, st, r),
      NOMADS: (adv, st, r) => this._nomads(adv, st, r),
      OASIS: (adv, st, r) => this._oasis(adv, st, r),
      OUTPOST: (adv, st, r) => this._outpost(adv, st, r),
      PIRATES: (adv, st, r) => this._pirates(adv, st, r),
      PLAGUE: (adv, st, r) => this._plague(adv, st, r),
      POISONOUS: (adv, st, r) => this._poisonous(adv, st, r),
      QUEST: (adv, st, r) => this._quest(adv, st, r),
      QUICKSAND: (adv, st, r) => this._hazardEvent(adv, st, r, "QUICKSAND: test Str-5 or be stuck — lose 1d3 HP and 1 ration", "Str", -5),
      RAFT: (adv, st, r) => this._raft(adv, st, r),
      RELATIVE: (adv, st, r) => this._relative(adv, st, r),
      REPORT: (adv, st, r) => this._report(adv, st, r),
      REPORT_MOUNT_THEFT: (adv, st, r) => this._reportMountTheft(adv, st, r),
      REVENGE: (adv, st, r) => this._revenge(adv, st, r),
      ROBBED: (adv, st, r) => this._robbed(adv, st, r),
      ROMANCE: (adv, st, r) => this._romance(adv, st, r),
      RUMOURS: (adv, st, r) => this._rumours(adv, st, r),
      RUNAWAY: (adv, st, r) => this._runaway(adv, st, r),
      SAND_STORM: (adv, st, r) => this._hazardEvent(adv, st, r, "SAND STORM: test Dex-20 or lose 1d3 HP and 2 fatigue", "Dex", -20),
      SEA_FOG: (adv, st, r) => this._seaFog(adv, st, r),
      SEA_MONSTER: (adv, st, r) => this._seaMonster(adv, st, r),
      SEA_STORMS: (adv, st, r) => this._seaStorms(adv, st, r),
      SIDE_QUEST: (adv, st, r) => this._sideQuest(adv, st, r),
      SHIP_ATTACK: (adv, st, r) => this._shipAttack(adv, st, r),
      SHIPMATES: (adv, st, r) => this._shipmates(adv, st, r),
      SHRINE: (adv, st, r) => this._shrine(adv, st, r),
      SLAVERY: (adv, st, r) => this._slavery(adv, st, r),
      SNOWFALL: (adv, st, r) => this._hazardEvent(adv, st, r, "SNOWFALL: test Str-5 or lose 1 fatigue", "Str", -5),
      SQUALL: (adv, st, r) => this._squall(adv, st, r),
      STALKED: (adv, st, r) => this._stalked(adv, st, r),
      STEAL_MOUNT: (adv, st, r) => this._stealMount(adv, st, r),
      STEALING: (adv, st, r) => this._stealing(adv, st, r),
      STOLEN_ITEMS: (adv, st, r) => this._stolenItems(adv, st, r),
      STORMS: (adv, st, r) => this._hazardEvent(adv, st, r, "STORMS: test Str-10 or lose 1d3 HP and 1 fatigue", "Str", -10),
      STRANGER: (adv, st, r) => this._stranger(adv, st, r),
      SWAMP_GAS: (adv, st, r) => this._hazardEvent(adv, st, r, "SWAMP GAS: test Int-5 or lose 1d3 HP and 1 fatigue", "Int", -5),
      SWARMS: (adv, st, r) => this._swarms(adv, st, r),
      SWIM: (adv, st, r) => this._swim(adv, st, r),
      TAVERN: (adv, st, r) => this._tavern(adv, st, r),
      TREASURE: (adv, st, r) => this._treasure(adv, st, r),
      VAMPIRE: (adv, st, r) => this._vampire(adv, st, r),
      WANTED: (adv, st, r) => this._wanted(adv, st, r),
      WAVES: (adv, st, r) => this._hazardEvent(adv, st, r, "WAVES: test Str-10 or lose 1d3 HP", "Str", -10),
      WEREWOLF: (adv, st, r) => this._werewolf(adv, st, r),
      WILDFIRE: (adv, st, r) => this._hazardEvent(adv, st, r, "WILDFIRE: test Dex-10 or lose 1d3 HP", "Dex", -10),
      WITCH: (adv, st, r) => this._witch(adv, st, r),
      WITCHERY: (adv, st, r) => this._witchery(adv, st, r),
    };

    return handlers[eventName] ?? ((adv, st, _r) => ({
      adventurer: adv, state: st,
      result: { description: `Event ${eventName} acknowledged`, pendingEvents: [] },
    }));
  }

  // ---------------------------------------------------------------------------
  // Individual event implementations
  // ---------------------------------------------------------------------------

  /** ATTACK: d100 on encounters table — triggers COMBAT */
  private _attack(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "ATTACK! A monster ambushes you.",
      pendingEvents: [{ eventName: "COMBAT", modifier: 0, data: { source: "ATTACK" } }],
    });
  }

  /** AVALANCHE: test Dex-20 or -1d3 HP + lose all rations */
  private _avalanche(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const threshold = (adv.dex ?? 40) - 20;
    const roll = r.testRoll ?? 50;
    if (roll <= threshold) {
      return this._ok(adv, st, { description: "AVALANCHE: You dodge safely!", pendingEvents: [] });
    }
    const hpLoss = r.d3 ?? 2;
    const newRations = 0;
    const newAdv = { ...adv, hp: Math.max(0, adv.hp - hpLoss) };
    const newSt = { ...st, calendar: { ...st.calendar, rations: newRations } };
    return {
      adventurer: newAdv, state: newSt,
      result: {
        description: `AVALANCHE: Failed Dex test — lost ${hpLoss} HP and all rations!`,
        hpDelta: -hpLoss, rationsDelta: -st.calendar.rations, pendingEvents: [],
      },
    };
  }

  /** BITE: Werewolf bite — circle next full moon (11th) for WEREWOLF check */
  private _bite(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    const nextFullMoon = calendarService.nextOccurrenceOf(st.calendar, 11);
    const updatedSt = calendarService.addCircledDate(st, nextFullMoon, "WEREWOLF_CHECK", false);
    return this._ok(adv, updatedSt, {
      description: `BITE: A creature bites you! Circle ${nextFullMoon.month}/${nextFullMoon.day}/${nextFullMoon.year} for WEREWOLF check.`,
      pendingEvents: [],
    });
  }

  /** Generic HAZARD event handler for terrain-based environmental hazards */
  private _hazardEvent(
    adv: Adventurer,
    st: WorldBuilderState,
    r: EventRolls,
    description: string,
    stat: "Str" | "Dex" | "Int",
    modifier: number,
  ) {
    const statVal = stat === "Str" ? (adv.str ?? 50) : stat === "Dex" ? (adv.dex ?? 40) : (adv.int ?? 30);
    const threshold = statVal + modifier;
    const roll = r.testRoll ?? 50;

    if (roll <= threshold) {
      return this._ok(adv, st, { description: `${description} — SUCCESS! No harm done.`, pendingEvents: [] });
    }

    const hpLoss = r.d3 ?? 1;
    const fatigueDelta = description.includes("fatigue") ? 1 : 0;
    const newHp = Math.max(0, adv.hp - hpLoss);
    const newFatigue = Math.min(10, st.calendar.fatigue + fatigueDelta);

    return {
      adventurer: { ...adv, hp: newHp },
      state: { ...st, calendar: { ...st.calendar, fatigue: newFatigue } },
      result: {
        description: `${description} — FAILED! Lost ${hpLoss} HP${fatigueDelta > 0 ? " and gained 1 fatigue" : ""}.`,
        hpDelta: -hpLoss,
        fatigueDelta: fatigueDelta > 0 ? fatigueDelta : undefined,
        pendingEvents: [],
      },
    };
  }

  /** BOOTY: Roll on random treasure table (1d10) */
  private _booty(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.d10 ?? 5;
    const entry = getRandomTreasureEntry(roll);
    return this._ok(adv, st, {
      description: `BOOTY: You find loot! ${entry.description}`,
      goldDelta: entry.goldBonus,
      pendingEvents: [{ eventName: "ROLL_TREASURE_TABLE", modifier: 0, data: { table: entry.table, goldBonus: entry.goldBonus } }],
    });
  }

  /** BORROWED: A traveller borrows an item and leaves collateral */
  private _borrowed(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    const nextMonth = calendarService.nextOccurrenceOf(st.calendar, st.calendar.day);
    const updatedSt = calendarService.addCircledDate(st, nextMonth, "BORROWED_RETURN", true);
    return this._ok(adv, updatedSt, {
      description: "BORROWED: A traveller borrows one item from your backpack (leaving 1d6×10gp as collateral). Circle next month to see if they return it.",
      pendingEvents: [],
    });
  }

  /** BRAWL: Fist fight — test Str or lose 1d3 HP */
  private _brawl(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const threshold = adv.str ?? 50;
    const roll = r.testRoll ?? 50;
    if (roll <= threshold) {
      const goldGain = (r.d6 ?? 3) * 10;
      return {
        adventurer: { ...adv, gold: adv.gold + goldGain },
        state: st,
        result: { description: `BRAWL: You win! Gained ${goldGain}gp.`, goldDelta: goldGain, pendingEvents: [] },
      };
    }
    const hpLoss = r.d3 ?? 1;
    return {
      adventurer: { ...adv, hp: Math.max(0, adv.hp - hpLoss) },
      state: st,
      result: { description: `BRAWL: You lose! Lost ${hpLoss} HP.`, hpDelta: -hpLoss, pendingEvents: [] },
    };
  }

  /** BURGLARY: Your property is burgled (d100 vs security %) */
  private _burglary(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    if (!adv.property) {
      return this._ok(adv, st, { description: "BURGLARY: No property to burgle!", pendingEvents: [] });
    }
    const security = adv.property.security ?? 0;
    const roll = r.testRoll ?? 50;
    if (roll <= security) {
      return this._ok(adv, st, { description: "BURGLARY: Your property's security held!", pendingEvents: [] });
    }
    const goldLoss = Math.floor(adv.gold * 0.1);
    return {
      adventurer: { ...adv, gold: Math.max(0, adv.gold - goldLoss) },
      state: st,
      result: { description: `BURGLARY: Property broken into! Lost ~${goldLoss}gp worth of stored items.`, goldDelta: -goldLoss, pendingEvents: [] },
    };
  }

  /** CAMEL: A camel is encountered — can be bought at discount */
  private _camel(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "CAMEL: A merchant offers a camel at a discount. Pay 500gp to add it as a mount.",
      pendingEvents: [{ eventName: "OFFER_CAMEL_PURCHASE", modifier: 0, data: { cost: 500 } }],
    });
  }

  /** CAPTURE: Adventurer is captured — lose items, imprisoned */
  private _capture(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const goldLoss = Math.floor(adv.gold * 0.5);
    const newLp = st.lawlessPoints + 1;
    return {
      adventurer: { ...adv, gold: Math.max(0, adv.gold - goldLoss) },
      state: { ...st, lawlessPoints: newLp },
      result: {
        description: `CAPTURE: You are captured! Lose ${goldLoss}gp, +1 LP. Circle ${r.d6 ?? 3} days in jail.`,
        goldDelta: -goldLoss, lpDelta: 1,
        pendingEvents: [{ eventName: "JAIL", modifier: 0, data: { days: r.d6 ?? 3 } }],
      },
    };
  }

  /** CHANGE: Randomly transform an attribute or item */
  private _change(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.d6 ?? 3;
    const changes = [
      "Path changes to a random path",
      "Race changes to a random race",
      "Gain +10 to a random skill",
      "Lose -10 from a random skill",
      "Gain +5 HP permanently",
      "Lose -5 HP permanently",
    ];
    return this._ok(adv, st, {
      description: `CHANGE: Magical transformation! (d6=${roll}) ${changes[roll - 1] ?? "Unknown change"}`,
      pendingEvents: [{ eventName: "APPLY_CHANGE", modifier: 0, data: { changeRoll: roll } }],
    });
  }

  /** CIRCUS: Pay to attend, gain REP */
  private _circus(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const cost = 50;
    if (adv.gold < cost) {
      return this._ok(adv, st, { description: "CIRCUS: No gold to attend.", pendingEvents: [] });
    }
    const rep = r.d6 ?? 2;
    return {
      adventurer: { ...adv, gold: adv.gold - cost, reputation: adv.reputation + rep },
      state: st,
      result: { description: `CIRCUS: Great show! Paid ${cost}gp, gained +${rep} REP.`, goldDelta: -cost, repDelta: rep, pendingEvents: [] },
    };
  }

  /** CONFRONT_MOUNT_THIEF: Encounter the thief of your mount */
  private _confrontMountThief(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "CONFRONT MOUNT THIEF: You encounter someone who may have stolen your mount!",
      pendingEvents: [{ eventName: "COMBAT", modifier: 0, data: { source: "CONFRONT_MOUNT_THIEF", monsterName: "Mount Thief" } }],
    });
  }

  /** CROSSWINDS: Test Dex or lose 1 AP next move */
  private _crosswinds(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const threshold = (adv.dex ?? 40) - 10;
    const roll = r.testRoll ?? 50;
    if (roll <= threshold) {
      return this._ok(adv, st, { description: "CROSSWINDS: You navigate the winds safely!", pendingEvents: [] });
    }
    return this._ok(adv, st, {
      description: "CROSSWINDS: Buffeted by winds — next move costs +1 AP.",
      pendingEvents: [{ eventName: "MOVE_PENALTY", modifier: 1 }],
    });
  }

  /** FARM: Encounter a farm — buy rations at discount */
  private _farm(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "FARM: A farmstead sells rations at 5gp each (max 5).",
      pendingEvents: [{ eventName: "OFFER_RATIONS", modifier: 0, data: { priceEach: 5, maxQty: 5 } }],
    });
  }

  /** FAY: Encounter a fey creature — gain a boon or bane */
  private _fay(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.d6 ?? 3;
    if (roll <= 3) {
      return this._ok(adv, st, { description: `FAY: A fey grants you a boon! (d6=${roll}) Gain +5 to any skill.`, pendingEvents: [{ eventName: "FAY_BOON", modifier: 0 }] });
    }
    return this._ok(adv, st, { description: `FAY: A fey curses you! (d6=${roll}) Lose -5 from a random skill.`, pendingEvents: [{ eventName: "FAY_CURSE", modifier: 0 }] });
  }

  /** FOG: Navigation hazard — test Int or get lost */
  private _fog(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const threshold = (adv.int ?? 30) - 5;
    const roll = r.testRoll ?? 50;
    if (roll <= threshold) {
      return this._ok(adv, st, { description: "FOG: You navigate through the fog successfully!", pendingEvents: [] });
    }
    return this._ok(adv, st, {
      description: "FOG: Lost in the fog — move ends in a random adjacent hex.",
      pendingEvents: [{ eventName: "GET_LOST", modifier: 0 }],
    });
  }

  /** FORAGE_FISH: Gain 1d3 extra rations */
  private _forageFish(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const rations = r.d3 ?? 2;
    const newRations = Math.min(30, st.calendar.rations + rations);
    return {
      adventurer: adv,
      state: { ...st, calendar: { ...st.calendar, rations: newRations } },
      result: { description: `FORAGE/FISH: Found ${rations} rations!`, rationsDelta: rations, pendingEvents: [] },
    };
  }

  /** GAMBLE: Wager gold, test Dex or Luck to win/lose */
  private _gamble(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const wager = Math.min(r.goldWagered ?? 50, adv.gold);
    const roll = r.testRoll ?? 50;
    const threshold = adv.dex ?? 40;
    if (roll <= threshold) {
      return {
        adventurer: { ...adv, gold: adv.gold + wager },
        state: st,
        result: { description: `GAMBLE: You win ${wager}gp!`, goldDelta: wager, pendingEvents: [] },
      };
    }
    return {
      adventurer: { ...adv, gold: Math.max(0, adv.gold - wager) },
      state: st,
      result: { description: `GAMBLE: You lose ${wager}gp.`, goldDelta: -wager, pendingEvents: [] },
    };
  }

  /** GUILD: Guild-related event — pay dues or lose standing */
  private _guild(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    if (!adv.guildId) {
      return this._ok(adv, st, { description: "GUILD: A guild recruiter approaches — no current guild obligations.", pendingEvents: [] });
    }
    return this._ok(adv, st, {
      description: "GUILD: Guild event! Pay 100gp or risk losing guild status.",
      pendingEvents: [{ eventName: "GUILD_FEE", modifier: 0 }],
    });
  }

  /** HANGING: Public hanging — gain/lose REP based on reaction */
  private _hanging(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.d6 ?? 3;
    if (roll <= 3) {
      return {
        adventurer: { ...adv, reputation: adv.reputation + 1 },
        state: st,
        result: { description: "HANGING: You intervene to save the innocent — +1 REP.", repDelta: 1, pendingEvents: [] },
      };
    }
    return this._ok(adv, st, { description: "HANGING: You watch and move on.", pendingEvents: [] });
  }

  /** HUNTED: Being pursued by enemies */
  private _hunted(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    const newLp = st.lawlessPoints + 1;
    return {
      adventurer: adv,
      state: { ...st, lawlessPoints: newLp },
      result: { description: "HUNTED: Enemies are tracking you! +1 LP.", lpDelta: 1, pendingEvents: [{ eventName: "COMBAT", modifier: 10, data: { source: "HUNTED" } }] },
    };
  }

  /** HYBRID: Encounter a hybrid monster */
  private _hybrid(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "HYBRID: A fearsome hybrid creature attacks!",
      pendingEvents: [{ eventName: "COMBAT", modifier: 15, data: { source: "HYBRID" } }],
    });
  }

  /** IDENTITY: Someone mistakes you for another person */
  private _identity(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.d6 ?? 3;
    if (roll <= 3) {
      return {
        adventurer: { ...adv, gold: adv.gold + 100 },
        state: st,
        result: { description: "IDENTITY: Mistaken for a noble — paid 100gp for services rendered!", goldDelta: 100, pendingEvents: [] },
      };
    }
    const newLp = st.lawlessPoints + 1;
    return {
      adventurer: adv,
      state: { ...st, lawlessPoints: newLp },
      result: { description: "IDENTITY: Mistaken for a wanted criminal! +1 LP.", lpDelta: 1, pendingEvents: [] },
    };
  }

  /** IMPASSABLE: Terrain is impassable — must find another route */
  private _impassable(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "IMPASSABLE: The terrain is blocked! Move costs +2 AP to navigate around.",
      pendingEvents: [{ eventName: "MOVE_PENALTY", modifier: 2 }],
    });
  }

  /** ISLAND: Discover an island — generates a new hex */
  private _island(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "ISLAND: You spot an island! Generate a new hex to explore.",
      pendingEvents: [{ eventName: "GENERATE_HEX", modifier: 0, data: { context: "ISLAND" } }],
    });
  }

  /** JAIL: Imprisoned for d6 days — lose LP */
  private _jail(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const days = r.d6 ?? 3;
    const newLp = Math.max(0, st.lawlessPoints - 1);
    return {
      adventurer: adv,
      state: { ...st, lawlessPoints: newLp },
      result: {
        description: `JAIL: Imprisoned for ${days} days. -1 LP.`,
        lpDelta: -1,
        pendingEvents: [{ eventName: "MARK_DAYS", modifier: 0, data: { days } }],
      },
    };
  }

  /** JUNGLE_FEVER: Disease check */
  private _jungleFever(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    const threshold = (adv.str ?? 50) - 10;
    if (roll <= threshold) {
      return this._ok(adv, st, { description: "JUNGLE FEVER: Your constitution holds!", pendingEvents: [] });
    }
    return {
      adventurer: { ...adv, disease: (adv.disease ?? 0) + 1 },
      state: st,
      result: { description: "JUNGLE FEVER: You contract jungle fever! +1 disease pip.", diseaseDelta: 1, pendingEvents: [] },
    };
  }

  /** JUNGLE_WORM: Poison attack */
  private _jungleWorm(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    const threshold = (adv.dex ?? 40) - 5;
    if (roll <= threshold) {
      return this._ok(adv, st, { description: "JUNGLE WORM: You dodge the worm!", pendingEvents: [] });
    }
    const hpLoss = r.d3 ?? 1;
    return {
      adventurer: { ...adv, hp: Math.max(0, adv.hp - hpLoss), poison: (adv.poison ?? 0) + 1 },
      state: st,
      result: { description: `JUNGLE WORM: Bitten! Lost ${hpLoss} HP and +1 poison pip.`, hpDelta: -hpLoss, poisonDelta: 1, pendingEvents: [] },
    };
  }

  /** LAW: Law enforcement encounter — based on lawless points */
  private _law(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const lp = st.lawlessPoints;
    if (lp === 0) {
      return this._ok(adv, st, { description: "LAW: Guards check your papers — all is in order.", pendingEvents: [] });
    }
    return this._ok(adv, st, {
      description: `LAW: You have ${lp} LP — the law is after you! Test Dex or be captured.`,
      pendingEvents: [{ eventName: "JAIL", modifier: 0, data: { lp, testRoll: r.testRoll } }],
    });
  }

  /** LOST: Adventurer gets lost — mark 1d3 extra days */
  private _lost(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const days = r.d3 ?? 1;
    return {
      adventurer: adv,
      state: st,
      result: {
        description: `LOST: You lose your way! Mark ${days} extra days.`,
        pendingEvents: [{ eventName: "MARK_DAYS", modifier: 0, data: { days } }],
      },
    };
  }

  /** LUCKY_FIND: Find gold or small item */
  private _luckyFind(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const goldFound = (r.d6 ?? 3) * 10;
    return {
      adventurer: { ...adv, gold: adv.gold + goldFound },
      state: st,
      result: { description: `LUCKY FIND: Found ${goldFound}gp!`, goldDelta: goldFound, pendingEvents: [] },
    };
  }

  /** MALARIA: Disease contracted in swamp/jungle */
  private _malaria(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return {
      adventurer: { ...adv, disease: (adv.disease ?? 0) + 2 },
      state: st,
      result: { description: "MALARIA: You contract malaria! +2 disease pips.", diseaseDelta: 2, pendingEvents: [] },
    };
  }

  /** MIRAGE: Disorientation in desert */
  private _mirage(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    const threshold = (adv.int ?? 30) - 10;
    if (roll <= threshold) {
      return this._ok(adv, st, { description: "MIRAGE: You see through the illusion!", pendingEvents: [] });
    }
    const hpLoss = r.d3 ?? 1;
    return {
      adventurer: { ...adv, hp: Math.max(0, adv.hp - hpLoss) },
      state: st,
      result: { description: `MIRAGE: Lost in the desert chasing mirages! Lost ${hpLoss} HP.`, hpDelta: -hpLoss, pendingEvents: [] },
    };
  }

  /** MISSING: A person is missing — quest hook */
  private _missing(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "MISSING: Someone asks for help finding a missing person — generate a quest.",
      pendingEvents: [{ eventName: "GENERATE_QUEST", modifier: 0 }],
    });
  }

  /** MONSTER: Encounter a monster — triggers COMBAT */
  private _monster(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "MONSTER: A fearsome creature appears!",
      pendingEvents: [{ eventName: "COMBAT", modifier: 0, data: { source: "MONSTER" } }],
    });
  }

  /** MOON: Full moon — mystical effects */
  private _moon(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.d6 ?? 3;
    if (roll <= 3) {
      return {
        adventurer: { ...adv, hp: Math.min(adv.maxHp, adv.hp + 2) },
        state: st,
        result: { description: "MOON: The full moon restores +2 HP.", hpDelta: 2, pendingEvents: [] },
      };
    }
    return this._ok(adv, st, {
      description: "MOON: The full moon howls — WEREWOLF check!",
      pendingEvents: [{ eventName: "WEREWOLF", modifier: 0 }],
    });
  }

  /** MOUNTS: Mount-related event — buy/find a mount at discount */
  private _mounts(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "MOUNTS: A horse trader passes by — buy a mount at a 20% discount.",
      pendingEvents: [{ eventName: "OFFER_MOUNT_DISCOUNT", modifier: 0 }],
    });
  }

  /** MOUNT_THEFT: Someone has stolen a mount */
  private _mountTheft(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    const stolenMounts = st.mounts.filter((m) => !m.isStolen);
    if (stolenMounts.length === 0) {
      return this._ok(adv, st, { description: "MOUNT THEFT: No mounts to steal!", pendingEvents: [] });
    }
    const targetMount = stolenMounts[0];
    const updatedMounts = st.mounts.map((m) =>
      m.slotNumber === targetMount.slotNumber ? { ...m, isStolen: true, stolenDaysAgo: 0 } : m
    );
    return {
      adventurer: adv,
      state: { ...st, mounts: updatedMounts },
      result: {
        description: `MOUNT THEFT: ${targetMount.name} has been stolen!`,
        pendingEvents: [{ eventName: "REPORT_MOUNT_THEFT", modifier: 0, data: { mountName: targetMount.name } }],
      },
    };
  }

  /** MYSTIC: Encounter a mystic — receive prophecy or boost */
  private _mystic(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.d6 ?? 3;
    if (roll <= 3) {
      return {
        adventurer: { ...adv, fate: adv.fate + 1 },
        state: st,
        result: { description: "MYSTIC: The mystic grants you a point of FATE!", pendingEvents: [] },
      };
    }
    return this._ok(adv, st, { description: "MYSTIC: The mystic offers a cryptic prophecy — fate is in your hands.", pendingEvents: [] });
  }

  /** NOMADS: Encounter nomadic tribe */
  private _nomads(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    if (roll <= 50) {
      return {
        adventurer: { ...adv, gold: adv.gold + 30 },
        state: st,
        result: { description: "NOMADS: Friendly nomads trade with you — gained 30gp.", goldDelta: 30, pendingEvents: [] },
      };
    }
    return this._ok(adv, st, {
      description: "NOMADS: Hostile nomads! Fight or flee.",
      pendingEvents: [{ eventName: "COMBAT", modifier: -5, data: { source: "NOMADS" } }],
    });
  }

  /** OASIS: Rest and replenish at an oasis */
  private _oasis(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    const hpRestored = Math.min(adv.maxHp - adv.hp, 3);
    const newRations = Math.min(30, st.calendar.rations + 3);
    return {
      adventurer: { ...adv, hp: adv.hp + hpRestored },
      state: { ...st, calendar: { ...st.calendar, rations: newRations } },
      result: { description: `OASIS: Refreshing oasis! Restored ${hpRestored} HP and gained 3 rations.`, hpDelta: hpRestored, rationsDelta: 3, pendingEvents: [] },
    };
  }

  /** OUTPOST: Military or trading outpost */
  private _outpost(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "OUTPOST: You find an outpost — acts as a camp for healing and basic supplies.",
      pendingEvents: [{ eventName: "SETTLEMENT_CAMP", modifier: 0 }],
    });
  }

  /** PIRATES: Attack by sea pirates */
  private _pirates(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "PIRATES: Pirates attack!",
      pendingEvents: [{ eventName: "COMBAT", modifier: 5, data: { source: "PIRATES" } }],
    });
  }

  /** PLAGUE: Disease outbreak — risk infection */
  private _plague(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    const threshold = (adv.str ?? 50) - 20;
    if (roll <= threshold) {
      return this._ok(adv, st, { description: "PLAGUE: Your constitution resists the plague!", pendingEvents: [] });
    }
    return {
      adventurer: { ...adv, disease: (adv.disease ?? 0) + 3 },
      state: st,
      result: { description: "PLAGUE: You contract the plague! +3 disease pips.", diseaseDelta: 3, pendingEvents: [] },
    };
  }

  /** POISONOUS: Poisonous environment */
  private _poisonous(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    const threshold = (adv.str ?? 50) - 10;
    if (roll <= threshold) {
      return this._ok(adv, st, { description: "POISONOUS: You avoid the toxins!", pendingEvents: [] });
    }
    return {
      adventurer: { ...adv, poison: (adv.poison ?? 0) + 1 },
      state: st,
      result: { description: "POISONOUS: Exposed to poison! +1 poison pip.", poisonDelta: 1, pendingEvents: [] },
    };
  }

  /** QUEST: A new quest becomes available */
  private _quest(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "QUEST: A new quest opportunity! Generate a quest.",
      pendingEvents: [{ eventName: "GENERATE_QUEST", modifier: 0 }],
    });
  }

  /** RAFT: Must cross water by raft */
  private _raft(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    const threshold = (adv.str ?? 50) - 10;
    if (roll <= threshold) {
      return this._ok(adv, st, { description: "RAFT: You cross safely!", pendingEvents: [] });
    }
    const hpLoss = r.d3 ?? 1;
    return {
      adventurer: { ...adv, hp: Math.max(0, adv.hp - hpLoss) },
      state: st,
      result: { description: `RAFT: The raft tips! Lost ${hpLoss} HP.`, hpDelta: -hpLoss, pendingEvents: [] },
    };
  }

  /** RELATIVE: Encounter a relative — get gold or a boon */
  private _relative(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const gold = (r.d6 ?? 3) * 50;
    return {
      adventurer: { ...adv, gold: adv.gold + gold },
      state: st,
      result: { description: `RELATIVE: A relative gives you ${gold}gp!`, goldDelta: gold, pendingEvents: [] },
    };
  }

  /** REPORT: Report a crime for a reward */
  private _report(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    const newLp = Math.max(0, st.lawlessPoints - 1);
    return {
      adventurer: { ...adv, gold: adv.gold + 50 },
      state: { ...st, lawlessPoints: newLp },
      result: { description: "REPORT: You report suspicious activity — gain 50gp and -1 LP.", goldDelta: 50, lpDelta: -1, pendingEvents: [] },
    };
  }

  /** REPORT_MOUNT_THEFT: Report the stolen mount to authorities */
  private _reportMountTheft(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "REPORT MOUNT THEFT: Report the stolen mount — circle next month for investigation.",
      pendingEvents: [],
    });
  }

  /** REVENGE: An old enemy seeks revenge */
  private _revenge(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "REVENGE: An old enemy has tracked you down!",
      pendingEvents: [{ eventName: "COMBAT", modifier: 10, data: { source: "REVENGE" } }],
    });
  }

  /** ROBBED: Mugged — lose gold */
  private _robbed(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    if (roll <= (adv.dex ?? 40)) {
      return this._ok(adv, st, { description: "ROBBED: You spot the thief and escape!", pendingEvents: [] });
    }
    const goldLoss = Math.floor(adv.gold * 0.25);
    return {
      adventurer: { ...adv, gold: Math.max(0, adv.gold - goldLoss) },
      state: st,
      result: { description: `ROBBED: Mugged! Lost ${goldLoss}gp.`, goldDelta: -goldLoss, pendingEvents: [] },
    };
  }

  /** ROMANCE: Romantic encounter — optional adventure hook */
  private _romance(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return {
      adventurer: { ...adv, reputation: adv.reputation + 1 },
      state: st,
      result: { description: "ROMANCE: A romantic encounter boosts your spirits! +1 REP.", repDelta: 1, pendingEvents: [] },
    };
  }

  /** RUMOURS: Hear useful rumours about a quest or treasure */
  private _rumours(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "RUMOURS: You hear rumours of a nearby treasure or quest.",
      pendingEvents: [{ eventName: "GENERATE_QUEST", modifier: 0 }],
    });
  }

  /** RUNAWAY: A scared runaway needs help */
  private _runaway(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.d6 ?? 3;
    if (roll <= 3) {
      return {
        adventurer: { ...adv, reputation: adv.reputation + 1 },
        state: st,
        result: { description: "RUNAWAY: You help the runaway — +1 REP.", repDelta: 1, pendingEvents: [] },
      };
    }
    return this._ok(adv, st, { description: "RUNAWAY: The runaway leads enemies to you!", pendingEvents: [{ eventName: "COMBAT", modifier: 0, data: { source: "RUNAWAY" } }] });
  }

  /** SEA_FOG: Disorientation at sea */
  private _seaFog(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    const threshold = (adv.int ?? 30) - 5;
    if (roll <= threshold) {
      return this._ok(adv, st, { description: "SEA FOG: You navigate the fog safely!", pendingEvents: [] });
    }
    return this._ok(adv, st, {
      description: "SEA FOG: Lost at sea — end up in adjacent random hex!",
      pendingEvents: [{ eventName: "GET_LOST", modifier: 0 }],
    });
  }

  /** SEA_MONSTER: Monster encounter at sea */
  private _seaMonster(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "SEA MONSTER: A leviathan surfaces!",
      pendingEvents: [{ eventName: "COMBAT", modifier: 20, data: { source: "SEA_MONSTER" } }],
    });
  }

  /** SEA_STORMS: Severe sea storm */
  private _seaStorms(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    const threshold = (adv.str ?? 50) - 15;
    if (roll <= threshold) {
      return this._ok(adv, st, { description: "SEA STORMS: You ride out the storm!", pendingEvents: [] });
    }
    const hpLoss = r.d3 ?? 2;
    const fatigue = 2;
    return {
      adventurer: { ...adv, hp: Math.max(0, adv.hp - hpLoss) },
      state: { ...st, calendar: { ...st.calendar, fatigue: Math.min(10, st.calendar.fatigue + fatigue) } },
      result: { description: `SEA STORMS: Battered! Lost ${hpLoss} HP and +${fatigue} fatigue.`, hpDelta: -hpLoss, fatigueDelta: fatigue, pendingEvents: [] },
    };
  }

  /** SIDE_QUEST: A side quest opportunity appears */
  private _sideQuest(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "SIDE QUEST: A dungeon nearby holds a special challenge! Generate a side quest.",
      pendingEvents: [{ eventName: "GENERATE_SIDE_QUEST", modifier: 0 }],
    });
  }

  /** SHIP_ATTACK: Attack by enemy ship */
  private _shipAttack(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "SHIP ATTACK: Enemy vessel opens fire!",
      pendingEvents: [{ eventName: "COMBAT", modifier: 10, data: { source: "SHIP_ATTACK" } }],
    });
  }

  /** SHIPMATES: Encounter friendly sailors */
  private _shipmates(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return {
      adventurer: { ...adv, reputation: adv.reputation + 1 },
      state: st,
      result: { description: "SHIPMATES: Friendly sailors share a meal and stories. +1 REP.", repDelta: 1, pendingEvents: [] },
    };
  }

  /** SHRINE: Encounter a religious shrine */
  private _shrine(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.d6 ?? 3;
    if (roll <= 4) {
      return {
        adventurer: { ...adv, hp: Math.min(adv.maxHp, adv.hp + 2), fate: adv.fate + 1 },
        state: st,
        result: { description: "SHRINE: Blessed at the shrine! +2 HP and +1 FATE.", hpDelta: 2, pendingEvents: [] },
      };
    }
    return this._ok(adv, st, { description: "SHRINE: The shrine is desecrated — nothing here.", pendingEvents: [] });
  }

  /** SLAVERY: Captured and enslaved — must escape */
  private _slavery(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const escapeDate = calendarService.nextOccurrenceOf(st.calendar, st.calendar.day + 7 > 30 ? 1 : st.calendar.day + 7);
    const updatedSt = calendarService.addCircledDate(st, escapeDate, "ESCAPE_SLAVERY", false);
    const newLp = st.lawlessPoints + 2;
    return {
      adventurer: { ...adv, gold: 0 },
      state: { ...updatedSt, lawlessPoints: newLp },
      result: {
        description: "SLAVERY: Captured and enslaved! All gold lost, +2 LP. Circle escape date.",
        goldDelta: -adv.gold, lpDelta: 2,
        pendingEvents: [{ eventName: "MARK_DAYS", modifier: 0, data: { days: r.d6 ?? 3 } }],
      },
    };
  }

  /** SQUALL: Sudden squall at sea */
  private _squall(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    return this._hazardEvent(adv, st, r, "SQUALL: test Dex-10 or lose 1d3 HP and 1 ration", "Dex", -10);
  }

  /** STALKED: Being followed by a creature */
  private _stalked(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    if (roll <= (adv.int ?? 30)) {
      return this._ok(adv, st, { description: "STALKED: You notice the creature and drive it off!", pendingEvents: [] });
    }
    return this._ok(adv, st, {
      description: "STALKED: The creature catches you off-guard!",
      pendingEvents: [{ eventName: "COMBAT", modifier: -10, data: { source: "STALKED" } }],
    });
  }

  /** STEAL_MOUNT: Attempt to steal a mount */
  private _stealMount(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "STEAL MOUNT: You attempt to steal a mount! Test Dex or face consequences.",
      pendingEvents: [{ eventName: "STEAL_MOUNT_ATTEMPT", modifier: 0 }],
    });
  }

  /** STEALING: Someone is stealing from you */
  private _stealing(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    if (roll <= (adv.int ?? 30)) {
      return this._ok(adv, st, { description: "STEALING: You catch the thief in the act!", pendingEvents: [] });
    }
    const goldLoss = Math.floor(adv.gold * 0.15);
    return {
      adventurer: { ...adv, gold: Math.max(0, adv.gold - goldLoss) },
      state: st,
      result: { description: `STEALING: Pickpocketed! Lost ${goldLoss}gp.`, goldDelta: -goldLoss, pendingEvents: [] },
    };
  }

  /** STOLEN_ITEMS: Items stolen from saddlebags */
  private _stolenItems(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "STOLEN ITEMS: Items stolen from your saddlebags! Check mount inventory.",
      pendingEvents: [{ eventName: "REMOVE_RANDOM_SADDLEBAG_ITEM", modifier: 0 }],
    });
  }

  /** STRANGER: A mysterious stranger approaches */
  private _stranger(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.d6 ?? 3;
    const nextMonth = calendarService.nextOccurrenceOf(st.calendar, 1);
    const updatedSt = calendarService.addCircledDate(st, nextMonth, "STRANGER_RETURN", false);
    return {
      adventurer: adv,
      state: updatedSt,
      result: {
        description: `STRANGER: A mysterious figure approaches (d6=${roll}). Circle next month — they may return with news or CHANGE event.`,
        pendingEvents: [{ eventName: "CHANGE", modifier: 0, data: { strangerRoll: roll } }],
      },
    };
  }

  /** SWARMS: Insect/creature swarms attack */
  private _swarms(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    return this._hazardEvent(adv, st, r, "SWARMS: test Dex-10 or lose 1d3 HP", "Dex", -10);
  }

  /** SWIM: Must swim across water */
  private _swim(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.testRoll ?? 50;
    const threshold = (adv.str ?? 50) - 5;
    if (roll <= threshold) {
      return this._ok(adv, st, { description: "SWIM: You cross the water safely!", pendingEvents: [] });
    }
    const hpLoss = r.d3 ?? 1;
    const fatigue = 1;
    return {
      adventurer: { ...adv, hp: Math.max(0, adv.hp - hpLoss) },
      state: { ...st, calendar: { ...st.calendar, fatigue: Math.min(10, st.calendar.fatigue + fatigue) } },
      result: { description: `SWIM: Difficult crossing! Lost ${hpLoss} HP and +1 fatigue.`, hpDelta: -hpLoss, fatigueDelta: fatigue, pendingEvents: [] },
    };
  }

  /** TAVERN: Visit a tavern — gambling and drinking */
  private _tavern(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "TAVERN: You find a tavern — drink, gamble, or find rumours.",
      pendingEvents: [{ eventName: "GAMBLE", modifier: 0 }],
    });
  }

  /** TREASURE: Find a random treasure (seas context) */
  private _treasure(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.d10 ?? 5;
    const entry = getRandomTreasureEntry(roll);
    return this._ok(adv, st, {
      description: `TREASURE: Sunken treasure! ${entry.description}`,
      goldDelta: entry.goldBonus,
      pendingEvents: [{ eventName: "ROLL_TREASURE_TABLE", modifier: 0, data: { table: entry.table, goldBonus: entry.goldBonus } }],
    });
  }

  /** VAMPIRE: Vampire attacks — circle next full moon */
  private _vampire(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    const nextFullMoon = calendarService.nextOccurrenceOf(st.calendar, 11);
    const updatedSt = calendarService.addCircledDate(st, nextFullMoon, "VAMPIRE_CHECK", false);
    const hpLoss = 2;
    return {
      adventurer: { ...adv, hp: Math.max(0, adv.hp - hpLoss) },
      state: updatedSt,
      result: {
        description: `VAMPIRE: A vampire drains your life force! Lost ${hpLoss} HP. Circle ${nextFullMoon.month}/${nextFullMoon.day}/${nextFullMoon.year} — may become a vampire if not cured.`,
        hpDelta: -hpLoss,
        pendingEvents: [],
      },
    };
  }

  /** WANTED: Become wanted by authorities */
  private _wanted(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    const newLp = st.lawlessPoints + 1;
    return {
      adventurer: adv,
      state: { ...st, lawlessPoints: newLp },
      result: { description: "WANTED: Authorities declare you wanted! +1 LP.", lpDelta: 1, pendingEvents: [] },
    };
  }

  /** WEREWOLF: Werewolf encounter — d100 ≤ 5 check already applied at calendar trigger */
  private _werewolf(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    return this._ok(adv, st, {
      description: "WEREWOLF: A werewolf attacks!",
      pendingEvents: [{ eventName: "COMBAT", modifier: 10, data: { source: "WEREWOLF", monsterName: "Werewolf" } }],
    });
  }

  /** WITCH: Encounter a witch */
  private _witch(adv: Adventurer, st: WorldBuilderState, r: EventRolls) {
    const roll = r.d6 ?? 3;
    if (roll <= 3) {
      return this._ok(adv, st, { description: "WITCH: A friendly witch offers a potion — gain 1 random elixir.", pendingEvents: [{ eventName: "ROLL_TREASURE_TABLE", modifier: 0, data: { table: "TC" } }] });
    }
    return this._ok(adv, st, {
      description: "WITCH: A malevolent witch curses you!",
      pendingEvents: [{ eventName: "WITCHERY", modifier: 0 }],
    });
  }

  /** WITCHERY: Witch suspicion event triggered */
  private _witchery(adv: Adventurer, st: WorldBuilderState, _r: EventRolls) {
    const newSuspicion = Math.max(0, st.witchSuspicion - 1);
    const newLp = st.lawlessPoints + 1;
    return {
      adventurer: adv,
      state: { ...st, witchSuspicion: newSuspicion, lawlessPoints: newLp },
      result: {
        description: "WITCHERY: You are accused of witchcraft! Suspicion -1, +1 LP.",
        lpDelta: 1,
        pendingEvents: [{ eventName: "COMBAT", modifier: 0, data: { source: "WITCHERY_MOB" } }],
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private _ok(
    adv: Adventurer,
    st: WorldBuilderState,
    result: Omit<EventResult, "pendingEvents"> & { pendingEvents: PendingEvent[] },
  ) {
    return { adventurer: adv, state: st, result };
  }
}
