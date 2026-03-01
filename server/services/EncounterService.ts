import { MonsterInstance } from "../models/monster.ts";
import { Book1TableService } from "./table_service.ts";
import { lookupEA } from "../data/encounters_ea.ts";

export type EncounterTable = "E" | "EA";

export class EncounterService {
  private tableService: Book1TableService;

  constructor() {
    this.tableService = new Book1TableService();
  }

  /**
   * The Encounter Rule (Book 2, p.14):
   * When an encounter modifier pushes a roll to ≤0 or ≥101,
   * instead of clamping, use an alternative roll.
   */
  applyEncounterRule(rawRoll: number, modifier: number): number {
    const adjusted = rawRoll + modifier;
    if (adjusted <= 0) {
      // Roll 2d10+15 — simulate deterministically from the raw roll
      const a = ((rawRoll - 1) % 10) + 1;
      const b = ((rawRoll) % 10) + 1;
      return a + b + 15;
    }
    if (adjusted >= 101) {
      const a = ((rawRoll - 1) % 10) + 1;
      const b = ((rawRoll) % 10) + 1;
      return a + b + 80;
    }
    return adjusted;
  }

  generateMonster(roll: number, partySize = 1, table: EncounterTable = "E", encounterModifier = 0): MonsterInstance {
    const effectiveRoll = Math.min(100, Math.max(1, this.applyEncounterRule(roll, encounterModifier)));

    let entry;
    if (table === "EA") {
      entry = lookupEA(effectiveRoll);
    } else {
      const base = this.tableService.getTableE(effectiveRoll);
      // Wrap legacy monster into EA-compatible shape
      entry = {
        name: base.name,
        av: base.av,
        def: base.def,
        dmgModifier: 0,
        hpValues: [base.hp],
        lootTable: "",
        abilities: [] as string[],
        isUndead: false,
        isDaemonic: false,
      };
    }

    // Scale HP for party size: +50% per extra member
    const scaledHp = entry.hpValues.map(v =>
      partySize > 1 ? Math.floor(v * (1 + 0.5 * (partySize - 1))) : v
    );

    return new MonsterInstance({ ...entry, hpValues: scaledHp });
  }
}
