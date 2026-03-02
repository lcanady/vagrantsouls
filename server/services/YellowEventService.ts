// YellowEventService — Book 8: Curious Rules
// Tracks yellow-area event pips. Each time the tracker is shaded, roll 2d10.
// If 2d10 ≤ current pips, an event triggers; tracker resets to 0.
// Event type and detail are resolved from the YE table (d100).

import type { Adventurer } from "../models/adventurer.ts";
import {
  YELLOW_EVENTS,
  type YEEvent,
} from "../data/curious_rules/yellow_events_table.ts";

export interface YellowEventResult {
  pipShaded: boolean;
  newPips: number;
  eventTriggered: boolean;
  event?: YEEvent;
  subRollResult?: string;
  message: string;
}

function lookupYellowEvent(roll: number): YEEvent | undefined {
  const clamped = Math.max(1, Math.min(100, roll));
  return YELLOW_EVENTS.find((e) => e.roll === clamped);
}

function resolveSubTable(event: YEEvent, d6Roll: number, d100Roll: number): string {
  if (event.d6Table && event.d6Table.length > 0) {
    const clamped = Math.max(1, Math.min(6, d6Roll));
    const entry = event.d6Table.find((e) => e.roll === clamped);
    if (entry) return `d6=${clamped}: ${entry.effect}`;
  }
  if (event.d100Table && event.d100Table.length > 0) {
    const clamped = Math.max(1, Math.min(100, d100Roll));
    const entry = event.d100Table.find(
      (e) => clamped >= e.minRoll && clamped <= e.maxRoll,
    );
    if (entry) return `d100=${clamped}: ${entry.label}`;
  }
  return "";
}

export class YellowEventService {
  /**
   * Shade one pip on the yellow event tracker and check for event trigger.
   *
   * @param adv       — adventurer
   * @param d10Roll1  — first d10 for 2d10 check
   * @param d10Roll2  — second d10 for 2d10 check
   * @param eventRoll — d100 for YE table lookup (used only if event triggers)
   * @param d6Roll    — d6 for d6 sub-table resolution (optional)
   * @param d100SubRoll — d100 for d100 sub-table resolution (optional)
   */
  rollYellowEvent(
    adv: Adventurer,
    d10Roll1: number,
    d10Roll2: number,
    eventRoll: number,
    d6Roll = 1,
    d100SubRoll = 1,
  ): { adventurer: Adventurer; result: YellowEventResult } {
    const tracker = adv.yellowEventTracker ?? { pips: 0 };
    const newPips = tracker.pips + 1;

    const twoD10 = d10Roll1 + d10Roll2;
    const eventTriggered = twoD10 <= newPips;

    // Reset pips if event fires
    const finalPips = eventTriggered ? 0 : newPips;
    const adventurer: Adventurer = {
      ...adv,
      yellowEventTracker: { pips: finalPips },
    };

    if (!eventTriggered) {
      return {
        adventurer,
        result: {
          pipShaded: true,
          newPips: finalPips,
          eventTriggered: false,
          message: `Yellow event pip shaded (${newPips}). 2d10 = ${twoD10} — no event yet.`,
        },
      };
    }

    const event = lookupYellowEvent(eventRoll);
    const subRollResult = event ? resolveSubTable(event, d6Roll, d100SubRoll) : "";

    return {
      adventurer,
      result: {
        pipShaded: true,
        newPips: 0,
        eventTriggered: true,
        event,
        subRollResult: subRollResult || undefined,
        message: event
          ? `Yellow event triggered! (2d10 = ${twoD10} ≤ ${newPips} pips) → ${event.title}. Tracker reset.`
          : `Yellow event triggered but roll ${eventRoll} not found in table.`,
      },
    };
  }
}
