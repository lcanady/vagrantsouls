/**
 * ArcanistService
 *
 * Handles:
 * - becomeArcanist   (prerequisites check + Test of Death)
 * - learnSpell       (add spell to Arcanist Spell Book + rank update)
 * - payDonation      (150gp / 300gp per Before Your Next Quest)
 * - checkArcaneLawConcealment
 * - surviveArcanePrism
 * - getRankForSpellCount
 */

import { Adventurer, Arcanist } from "../models/adventurer.ts";
import {
  PATH_ORDERS,
  ARCANIST_RANKS,
  ARCANIST_SPELL_TABLES,
  getArcanistSpell,
  getArcanistRank,
  ArcanistOrder,
} from "../data/arcanist_spells.ts";

export interface BecomeArcanistInput { order: ArcanistOrder }
export interface LearnSpellInput { spellTableRoll: number; cost?: number }
export interface ConcealmenetInput { roll: number }
export interface PrismInput { strRoll: number; dexRoll: number; intRoll: number }

export interface ArcanistServiceResult {
  success: boolean;
  message: string;
  adventurer: Adventurer;
  arcaneLawBroken?: boolean;
}

export interface PrismResult {
  survived: boolean;
  adventurer: Adventurer;
  message: string;
}

export interface ConcealResult {
  concealed: boolean;
  sentToPrism: boolean;
  adventurer: Adventurer;
}

// Suppress unused import warning — ARCANIST_RANKS is used in arcanist_spells.ts
const _unusedRanks = ARCANIST_RANKS;

function countOrderSpells(order: string, allSpells: string[]): number {
  if (order === "Esoteric") return allSpells.length;
  const orderSpellNames = new Set((ARCANIST_SPELL_TABLES[order] ?? []).map((s: { name: string }) => s.name));
  return allSpells.filter(name => orderSpellNames.has(name)).length;
}

export class ArcanistService {
  /** Check prerequisites and set up Arcanist sheet */
  becomeArcanist(
    adventurer: Adventurer,
    input: BecomeArcanistInput,
  ): { result: ArcanistServiceResult } {
    const { order } = input;
    const path = adventurer.path;

    if (!path) {
      return { result: { success: false, message: "Adventurer has no hero path.", adventurer } };
    }

    const allowedOrders = PATH_ORDERS[path];
    if (!allowedOrders || !allowedOrders.includes(order)) {
      return {
        result: {
          success: false,
          message: `Order '${order}' is not available to ${path}. Allowed: ${allowedOrders?.join(", ") ?? "none"}.`,
          adventurer,
        },
      };
    }

    if (adventurer.int < 60) {
      return {
        result: {
          success: false,
          message: `Int must be ≥ 60 to become an Arcanist (current: ${adventurer.int}).`,
          adventurer,
        },
      };
    }

    const magicSkill = adventurer.skills?.["Magic"] ?? 0;
    if (magicSkill < 10) {
      return {
        result: {
          success: false,
          message: `Magic skill must be ≥ +10 (current: +${magicSkill}).`,
          adventurer,
        },
      };
    }

    const spellCount = Object.keys(adventurer.spells ?? {}).length;
    if (spellCount < 5) {
      return {
        result: {
          success: false,
          message: `Need 5 individual spells in spell book (have ${spellCount}).`,
          adventurer,
        },
      };
    }

    // REP minimum 4
    const reputation = Math.max(adventurer.reputation, 4);

    const arcanist: Arcanist = {
      order,
      rank: "Initiate",
      arcanistSpells: [],
      ingredientsBagActive: false,
      ingredients: {},
      arcaneLawBroken: 0,
      stafeEnergy: 0,
    };

    const updated: Adventurer = { ...adventurer, reputation, arcanist };
    return {
      result: {
        success: true,
        message: `${adventurer.name} is now an Initiate ${path} of ${order}!`,
        adventurer: updated,
      },
    };
  }

  /**
   * Learn a spell from the order's SA table.
   * Costs 2000gp per spell.  Adds to arcanistSpells and updates rank.
   */
  learnSpell(
    adventurer: Adventurer,
    input: LearnSpellInput,
  ): { result: ArcanistServiceResult } {
    const arcanist = adventurer.arcanist;
    if (!arcanist) {
      return { result: { success: false, message: "Adventurer is not an Arcanist.", adventurer } };
    }

    const cost = input.cost ?? 2000;
    if (adventurer.gold < cost) {
      return {
        result: {
          success: false,
          message: `Not enough gold (need ${cost}gp, have ${adventurer.gold}gp).`,
          adventurer,
        },
      };
    }

    // Resolve spell from table
    const tableToRoll = arcanist.order === "Esoteric"
      ? ["Alchemy", "Elements", "Illusion", "Invocation", "Psyche", "Summoning"][
          Math.floor(Math.random() * 6)
        ]
      : arcanist.order;

    const spell = getArcanistSpell(tableToRoll, input.spellTableRoll);
    if (!spell) {
      return {
        result: {
          success: false,
          message: `No spell found on table SA-${arcanist.order} for roll ${input.spellTableRoll}.`,
          adventurer,
        },
      };
    }

    if (arcanist.arcanistSpells.includes(spell.name)) {
      return {
        result: {
          success: false,
          message: `${spell.name} is already in the Arcanist Spell Book.`,
          adventurer,
        },
      };
    }

    const newSpells = [...arcanist.arcanistSpells, spell.name];

    // Rank based on order spell count
    const orderSpellCount = countOrderSpells(arcanist.order, newSpells);
    const { rank } = getArcanistRank(orderSpellCount);

    const updatedArcanist: Arcanist = { ...arcanist, arcanistSpells: newSpells, rank: rank as Arcanist["rank"] };
    const updated: Adventurer = {
      ...adventurer,
      gold: adventurer.gold - cost,
      arcanist: updatedArcanist,
    };
    return {
      result: {
        success: true,
        message: `Learned ${spell.name}. New rank: ${rank}.`,
        adventurer: updated,
      },
    };
  }

  /**
   * Pay the end-of-quest donation to the Arcane Council.
   * Esoteric order: 300gp.  All others: 150gp.
   * Failure to pay breaks Arcane Law.
   */
  payDonation(adventurer: Adventurer): { result: ArcanistServiceResult } {
    const arcanist = adventurer.arcanist;
    if (!arcanist) {
      return { result: { success: false, message: "Adventurer is not an Arcanist.", adventurer } };
    }

    const donation = arcanist.order === "Esoteric" ? 300 : 150;
    if (adventurer.gold < donation) {
      const updatedArcanist: Arcanist = {
        ...arcanist,
        arcaneLawBroken: arcanist.arcaneLawBroken + 1,
      };
      return {
        result: {
          success: false,
          message: `Cannot pay donation of ${donation}gp — Arcane Law broken.`,
          adventurer: { ...adventurer, arcanist: updatedArcanist },
          arcaneLawBroken: true,
        },
      };
    }

    return {
      result: {
        success: true,
        message: `Paid donation of ${donation}gp to the Arcane Council.`,
        adventurer: { ...adventurer, gold: adventurer.gold - donation },
      },
    };
  }

  /**
   * Check if broken arcane law was noticed.
   * Roll 1d100 + 5 per law broken.  If result ≤ primary Int → concealed.
   * Otherwise → sentenced to arcane prism.
   */
  checkArcaneLawConcealment(
    adventurer: Adventurer,
    input: ConcealmenetInput,
  ): { result: ConcealResult } {
    const arcanist = adventurer.arcanist;
    if (!arcanist) {
      return { result: { concealed: true, sentToPrism: false, adventurer } };
    }

    const adjustedRoll = input.roll + arcanist.arcaneLawBroken * 5;
    const concealed = adjustedRoll <= adventurer.int;

    if (concealed) {
      const updatedArcanist: Arcanist = { ...arcanist, arcaneLawBroken: 0 };
      return {
        result: {
          concealed: true,
          sentToPrism: false,
          adventurer: { ...adventurer, arcanist: updatedArcanist },
        },
      };
    }

    return { result: { concealed: false, sentToPrism: true, adventurer } };
  }

  /**
   * Test each primary stat vs roll.  Roll must be LESS THAN the stat to survive.
   * Failure on any → adventurer dies (roll new one).
   * Success → roll becomes new primary value, then all assets seized, Arcanist removed.
   */
  surviveArcanePrism(adventurer: Adventurer, input: PrismInput): { result: PrismResult } {
    if (input.strRoll >= adventurer.str) {
      return {
        result: {
          survived: false,
          adventurer,
          message: `Failed Str test (rolled ${input.strRoll} ≥ ${adventurer.str}). Adventurer died in the Arcane Prism.`,
        },
      };
    }
    if (input.dexRoll >= adventurer.dex) {
      return {
        result: {
          survived: false,
          adventurer,
          message: `Failed Dex test (rolled ${input.dexRoll} ≥ ${adventurer.dex}). Adventurer died in the Arcane Prism.`,
        },
      };
    }
    if (input.intRoll >= adventurer.int) {
      return {
        result: {
          survived: false,
          adventurer,
          message: `Failed Int test (rolled ${input.intRoll} ≥ ${adventurer.int}). Adventurer died in the Arcane Prism.`,
        },
      };
    }

    // All survived — apply consequences
    const roguePrefix = `Rogue ${adventurer.path ?? "Adventurer"}`;
    const updated: Adventurer = {
      ...adventurer,
      str: input.strRoll,
      dex: input.dexRoll,
      int: input.intRoll,
      gold: 0,
      investments: {},
      arcanist: null,
      skills: Object.fromEntries(
        Object.entries(adventurer.skills ?? {}).map(([k, v]) => [k, v - 5]),
      ),
      path: roguePrefix as Adventurer["path"],
    };

    return {
      result: {
        survived: true,
        adventurer: updated,
        message: "Survived the Arcane Prism — penniless, weakened, and a Rogue spell caster.",
      },
    };
  }

  /** Return rank name for a given number of order spells (1-10) */
  getRankForSpellCount(count: number): string {
    return getArcanistRank(count).rank;
  }
}
