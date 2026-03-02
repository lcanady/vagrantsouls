// SecretPassagewayService — Book 8: Curious Rules
// Adventurers may search a dungeon area for secret passageways.
// Roll d10: 1-2 = danger, 3-7 = nothing, 8-9 = passage found, 10 = boost.
// Once searched, the area is marked (P) — cannot be searched again.

import type { Adventurer } from "../models/adventurer.ts";

export type PassagewayOutcome = "danger" | "nothing" | "passage" | "boost";

export interface SecretPassagewayResult {
  outcome: PassagewayOutcome;
  roll: number;
  alreadySearched?: boolean;
  message: string;
  /** For "danger": encounter or curse description */
  dangerDetail?: string;
  /** For "boost": bonus type and amount */
  boostDetail?: string;
}

/** Resolve outcome from a d10 roll */
function resolveOutcome(roll: number): PassagewayOutcome {
  if (roll <= 2) return "danger";
  if (roll <= 7) return "nothing";
  if (roll <= 9) return "passage";
  return "boost";
}

const DANGER_DETAILS = [
  "A hidden curse is triggered — shade 1d3 disease pips.",
  "Disturbed tomb — a wandering monster is encountered immediately.",
];

const BOOST_DETAILS = [
  "A hidden cache is found — gain 1d6 × 10g.",
  "An enchanted glyph restores 1d3 HP.",
  "A blessed shrine inscription — gain 1 Fate point.",
];

export class SecretPassagewayService {
  /**
   * Search an area for a secret passageway.
   * `areaId` identifies the dungeon area being searched.
   * `roll` is a d10 rolled by the caller.
   * `dangerRoll` / `boostRoll` are secondary d3 rolls for danger/boost detail selection.
   */
  search(
    adv: Adventurer,
    areaId: string,
    roll: number,
    dangerRoll = 1,
    boostRoll = 1,
  ): { adventurer: Adventurer; result: SecretPassagewayResult } {
    // Track searched areas in skills as a convention (prefixed "passageSearch:")
    const searchKey = `passageSearch:${areaId}`;
    if ((adv.skills?.[searchKey] ?? 0) > 0) {
      return {
        adventurer: adv,
        result: {
          outcome: "nothing",
          roll,
          alreadySearched: true,
          message: `Area ${areaId} has already been searched (P).`,
        },
      };
    }

    const outcome = resolveOutcome(roll);

    // Mark area as searched
    const adventurer: Adventurer = {
      ...adv,
      skills: { ...(adv.skills ?? {}), [searchKey]: 1 },
    };

    switch (outcome) {
      case "danger": {
        const detail = DANGER_DETAILS[(dangerRoll - 1) % DANGER_DETAILS.length];
        return {
          adventurer,
          result: {
            outcome,
            roll,
            dangerDetail: detail,
            message: `Danger! ${detail}`,
          },
        };
      }
      case "nothing":
        return {
          adventurer,
          result: {
            outcome,
            roll,
            message: "Nothing found. Area marked (P).",
          },
        };
      case "passage":
        return {
          adventurer,
          result: {
            outcome,
            roll,
            message: "A secret passageway is revealed! Area marked (P).",
          },
        };
      case "boost": {
        const detail = BOOST_DETAILS[(boostRoll - 1) % BOOST_DETAILS.length];
        return {
          adventurer,
          result: {
            outcome,
            roll,
            boostDetail: detail,
            message: `Hidden bonus! ${detail} Area marked (P).`,
          },
        };
      }
    }
  }
}
