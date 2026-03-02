/**
 * WorldBuilderCalendarService
 *
 * Handles:
 * - markDay: check off 1 day (rations, fatigue check, trigger symbols)
 * - markDays: iteratively mark N days
 * - applyFatigue: shade 1 fatigue pip and perform fatigue check if required
 * - getSeasonModifier: seasonal event bonus
 * - addCircledDate: record a future-triggered event on calendar back
 */

import { Adventurer, WorldBuilderState, WBCalendar, CircledDate } from "../models/adventurer.ts";

// ---------------------------------------------------------------------------
// Calendar layout constants
// ---------------------------------------------------------------------------

/**
 * Trigger day positions per month (day-of-month → symbol):
 * R = Religious day (1st): event roll -10
 * o = Guild day (1st): pay 100gp or lose guild status
 * * = Full moon (11th): d100 ≤ 5 → WEREWOLF event
 * S = Satanic day (16th): event roll +10
 * G = Disease/Poison check (19th AND 20th)
 *
 * Note: R and o both fall on the 1st of each month.
 */
const TRIGGER_DAYS: Record<number, ("R" | "o" | "*" | "S" | "G")[]> = {
  1:  ["R", "o"],
  11: ["*"],
  16: ["S"],
  19: ["G"],
  20: ["G"],
};

/** Calendar months: index 1-12, value = number of days */
const DAYS_IN_MONTH: Record<number, number> = {
  1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
  7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
};
// WB calendar has 364 total days; month 12 = 28 days to balance
// (12 months × ~30 days). Use standard layout from the rulebook.

export interface MarkDayRolls {
  /** d100 for event check on Religious/Satanic trigger days */
  eventRoll?: number;
  /** d100 for full moon WEREWOLF check (if 11th) */
  werewolfRoll?: number;
  /** d10 for fatigue check (if fatigue > 0 and new month starts) */
  fatigueRoll?: number;
  /** d3 for fatigue/hunger HP loss */
  d3Roll?: number;
  /** d3 for HP loss from starvation (-1d3 HP) */
  starvationRoll?: number;
  /** d6 for mount malnutrition death check */
  mountDeathRoll?: number;
}

export interface DayReport {
  day: number;
  month: number;
  year: number;
  triggers: Array<{
    symbol: string;
    description: string;
    effect?: string;
  }>;
  ationsConsumed: number;
  starvation: boolean;
  mountsUnfed: string[];
  fatigueCheck?: { roll: number; threshold: number; failed: boolean; hpLoss?: number };
  circledDateFired?: CircledDate[];
  yearEndAging?: boolean;
}

export interface MarkDayResult {
  reports: DayReport[];
  pendingEvents: Array<{ eventName: string; modifier: number }>;
}

export class WorldBuilderCalendarService {

  /**
   * Mark a single day on the calendar.
   * Returns the updated adventurer + state and a report of what happened.
   */
  markDay(
    adventurer: Adventurer,
    state: WorldBuilderState,
    rolls: MarkDayRolls,
  ): { adventurer: Adventurer; state: WorldBuilderState; report: DayReport; pendingEvents: Array<{ eventName: string; modifier: number }> } {
    let cal = { ...state.calendar };
    let hp = adventurer.hp;
    const pendingEvents: Array<{ eventName: string; modifier: number }> = [];
    const triggers: DayReport["triggers"] = [];
    const mountsUnfed: string[] = [];
    let starvation = false;

    // --- Rations ---
    let rationsConsumed = 0;
    if (cal.rations > 0) {
      cal = { ...cal, rations: cal.rations - 1 };
      rationsConsumed = 1;
    } else {
      // Starvation: -1d3 HP
      starvation = true;
      const hpLoss = rolls.starvationRoll ?? 1;
      hp = Math.max(0, hp - hpLoss);
      triggers.push({ symbol: "hunger", description: "No rations — starvation", effect: `-${hpLoss} HP` });
    }

    // --- Mount feeding ---
    const updatedMounts = state.mounts.map((mount) => {
      if (mount.type === "dragon") return mount; // dragons feed themselves
      if (mount.rations > 0) {
        return { ...mount, rations: mount.rations - 1 };
      }
      // Unfed: shade 1 malnutrition pip
      mountsUnfed.push(mount.name);
      const newPips = mount.malnutrition + 1;
      if (newPips >= 10) {
        // Full track: d6 death check — 6 = mount dies
        const deathRoll = rolls.mountDeathRoll ?? 1;
        if (deathRoll === 6) {
          triggers.push({ symbol: "mount", description: `${mount.name} has died from malnutrition.` });
          // Return the mount with a note; removal handled by caller
        }
      }
      return { ...mount, malnutrition: Math.min(newPips, 10) };
    });

    // --- Trigger day symbols ---
    const dayTriggers = TRIGGER_DAYS[cal.day] ?? [];

    for (const symbol of dayTriggers) {
      switch (symbol) {
        case "R":
          // Religious day: event roll -10
          triggers.push({ symbol: "R", description: "Religious Day — event roll with -10 modifier" });
          if (rolls.eventRoll !== undefined) {
            pendingEvents.push({ eventName: "event_check", modifier: -10 });
          }
          break;
        case "o":
          // Guild day: pay 100gp or lose guild status
          if (adventurer.guildId) {
            triggers.push({ symbol: "o", description: "Guild day — pay 100gp or lose guild status" });
            pendingEvents.push({ eventName: "GUILD_FEE", modifier: 0 });
          }
          break;
        case "*":
          // Full moon: d100 ≤ 5 → WEREWOLF
          if (rolls.werewolfRoll !== undefined && rolls.werewolfRoll <= 5) {
            triggers.push({ symbol: "*", description: "Full Moon — werewolf encountered!", effect: "WEREWOLF event" });
            pendingEvents.push({ eventName: "WEREWOLF", modifier: 0 });
          } else {
            triggers.push({ symbol: "*", description: "Full Moon — no werewolf tonight" });
          }
          break;
        case "S":
          // Satanic day: event roll +10
          triggers.push({ symbol: "S", description: "Satanic Day — event roll with +10 modifier" });
          if (rolls.eventRoll !== undefined) {
            pendingEvents.push({ eventName: "event_check", modifier: 10 });
          }
          break;
        case "G":
          // Disease/poison check
          triggers.push({ symbol: "G", description: "Disease/Poison check day" });
          pendingEvents.push({ eventName: "DISEASE_POISON_CHECK", modifier: 0 });
          break;
      }
    }

    // --- Circled dates ---
    const firedCircledDates: CircledDate[] = [];
    const remainingCircledDates: CircledDate[] = [];
    for (const cd of cal.circledDates) {
      if (cd.year === cal.year && cd.month === cal.month && cd.day === cal.day) {
        firedCircledDates.push(cd);
        pendingEvents.push({ eventName: cd.entry, modifier: 0 });
        if (cd.isOngoing) {
          // Keep it, advance by 1 month
          remainingCircledDates.push({
            ...cd,
            month: cd.month === 12 ? 1 : cd.month + 1,
            year: cd.month === 12 ? cd.year + 1 : cd.year,
          });
        }
      } else {
        remainingCircledDates.push(cd);
      }
    }

    // --- Advance the day ---
    let { year, month, day } = cal;
    const daysInMonth = DAYS_IN_MONTH[month] ?? 30;

    day += 1;
    let yearEndAging = false;
    if (day > daysInMonth) {
      day = 1;
      month += 1;

      // Fatigue check at start of new month
      if (cal.fatigue > 0) {
        const roll = rolls.fatigueRoll ?? 11; // default: no fatigue
        if (roll <= cal.fatigue) {
          const hpLoss = rolls.d3Roll ?? 1;
          hp = Math.max(0, hp - hpLoss);
          cal = { ...cal, fatigue: Math.max(0, cal.fatigue - 1) };
          triggers.push({
            symbol: "fatigue",
            description: "Fatigue check at new month",
            effect: `-${hpLoss} HP, -1 fatigue pip`,
          });
        }
      }

      if (month > 12) {
        month = 1;
        year += 1;
        yearEndAging = true;
        triggers.push({ symbol: "aging", description: "Year end — STR -1, DEX -1, INT +2" });
      }
    }

    cal = { ...cal, year, month, day, circledDates: remainingCircledDates };

    const report: DayReport = {
      day: state.calendar.day, // original day
      month: state.calendar.month,
      year: state.calendar.year,
      triggers,
      ationsConsumed: rationsConsumed,
      starvation,
      mountsUnfed,
      fatigueCheck: undefined,
      circledDateFired: firedCircledDates.length > 0 ? firedCircledDates : undefined,
      yearEndAging,
    };

    // Apply year-end aging to adventurer
    let updatedAdventurer: Adventurer = { ...adventurer, hp: Math.max(0, hp) };
    if (yearEndAging) {
      updatedAdventurer = {
        ...updatedAdventurer,
        str: (updatedAdventurer.str ?? 50) - 1,
        dex: (updatedAdventurer.dex ?? 40) - 1,
        int: (updatedAdventurer.int ?? 30) + 2,
      };
    }

    const updatedState: WorldBuilderState = {
      ...state,
      calendar: cal,
      mounts: updatedMounts,
    };

    return { adventurer: updatedAdventurer, state: updatedState, report, pendingEvents };
  }

  /**
   * Mark N days at once, collecting all reports and pending events.
   */
  markDays(
    adventurer: Adventurer,
    state: WorldBuilderState,
    count: number,
    rollsPerDay: MarkDayRolls[],
  ): { adventurer: Adventurer; state: WorldBuilderState; result: MarkDayResult } {
    let currentAdventurer = adventurer;
    let currentState = state;
    const allReports: DayReport[] = [];
    const allPendingEvents: Array<{ eventName: string; modifier: number }> = [];

    for (let i = 0; i < count; i++) {
      const rolls = rollsPerDay[i] ?? {};
      const { adventurer: nextAdventurer, state: nextState, report, pendingEvents } =
        this.markDay(currentAdventurer, currentState, rolls);
      currentAdventurer = nextAdventurer;
      currentState = nextState;
      allReports.push(report);
      allPendingEvents.push(...pendingEvents);
    }

    return {
      adventurer: currentAdventurer,
      state: currentState,
      result: { reports: allReports, pendingEvents: allPendingEvents },
    };
  }

  /**
   * Shade 1 fatigue pip. If a new month just started or fatigue was already > 0,
   * perform a fatigue check.
   * @param isNewMonth Pass true if a month boundary just crossed.
   */
  applyFatigue(
    adventurer: Adventurer,
    state: WorldBuilderState,
    isNewMonth: boolean,
    fatigueRoll: number,
    d3Roll: number,
  ): { adventurer: Adventurer; state: WorldBuilderState; result: { failed: boolean; hpLoss: number } } {
    const cal = state.calendar;
    const newFatigue = Math.min(cal.fatigue + 1, 10);

    let updatedAdventurer = adventurer;
    let hpLoss = 0;
    let failed = false;

    // Fatigue check: if new month starts or gaining a new fatigue pip while already fatigued
    if (isNewMonth || cal.fatigue > 0) {
      if (fatigueRoll <= newFatigue) {
        failed = true;
        hpLoss = d3Roll;
        const hp = Math.max(0, adventurer.hp - hpLoss);
        const reducedFatigue = Math.max(0, newFatigue - 1);
        updatedAdventurer = { ...adventurer, hp };
        const updatedState: WorldBuilderState = {
          ...state,
          calendar: { ...cal, fatigue: reducedFatigue },
        };
        return { adventurer: updatedAdventurer, state: updatedState, result: { failed, hpLoss } };
      }
    }

    const updatedState: WorldBuilderState = {
      ...state,
      calendar: { ...cal, fatigue: newFatigue },
    };
    return { adventurer: updatedAdventurer, state: updatedState, result: { failed, hpLoss } };
  }

  /**
   * Season forage bonus ç by month.
   * January: -2, February: -1, March-April: 0, May-July: +1, August-September: +2,
   * October: +1, November: 0, December: -1
   */
  getSeasonBonus(month: number): number {
    const bonuses: Record<number, number> = {
      1: -2, 2: -1, 3: 0, 4: 0, 5: 1, 6: 1,
      7: 1, 8: 2, 9: 2, 10: 1, 11: 0, 12: -1,
    };
    return bonuses[month] ?? 0;
  }

  /**
   * Event roll seasonal modifier (+5 spring, +10 summer, -5 autumn, -10 winter).
   */
  getSeasonModifier(month: number): number {
    if (month >= 3 && month <= 5) return 5;   // Spring
    if (month >= 6 && month <= 8) return 10;  // Summer
    if (month >= 9 && month <= 11) return -5; // Autumn
    return -10; // Winter (12, 1, 2)
  }

  /**
   * Record a future-triggered event on the back of the calendar.
   */
  addCircledDate(
    state: WorldBuilderState,
    date: { year: number; month: number; day: number },
    entry: string,
    isOngoing: boolean,
  ): WorldBuilderState {
    const circledDate: CircledDate = {
      year: date.year,
      month: date.month,
      day: date.day,
      entry,
      isOngoing,
    };
    return {
      ...state,
      calendar: {
        ...state.calendar,
        circledDates: [...state.calendar.circledDates, circledDate],
      },
    };
  }

  /**
   * Get the next occurrence of a specific day-of-month from the current date.
   * Used for "circle the next full moon (11th)" type instructions.
   */
  nextOccurrenceOf(cal: WBCalendar, dayOfMonth: number): { year: number; month: number; day: number } {
    let { year, month, day } = cal;
    if (day < dayOfMonth) {
      return { year, month, day: dayOfMonth };
    }
    // Already past this day — go to next month
    month += 1;
    if (month > 12) { month = 1; year += 1; }
    return { year, month, day: dayOfMonth };
  }
}
