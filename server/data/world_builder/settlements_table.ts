// (WB) S – SETTLEMENTS TABLE
// All 11 "Before Your Next Quest" steps with costs/unlock% for each settlement type

export type SettlementType = "camp" | "village" | "town" | "city";

/** Represents a price/availability value that may require an unlock roll */
export interface ServiceCost {
  /** % chance to unlock the service (0 = always available, -1 = not available) */
  unlockChance: number;
  /** Gold cost or price adjustment */
  cost: number;
  /** Whether the roll is per-item (x) vs once-per-visit (1) */
  perItem: boolean;
}

export const NOT_AVAILABLE: ServiceCost = { unlockChance: -1, cost: 0, perItem: false };
export const ALWAYS_AVAILABLE = (cost: number, perItem = false): ServiceCost => ({
  unlockChance: 0,
  cost,
  perItem,
});

export interface SettlementHealCosts {
  hpPerPoint: number;
  poisonPerPip: ServiceCost;
  diseasePerPip: ServiceCost;
}

export interface SettlementStep2Heal {
  camp: SettlementHealCosts;
  village: SettlementHealCosts;
  town: SettlementHealCosts;
  city: SettlementHealCosts;
}

export interface SettlementPriceAdj {
  camp: ServiceCost;
  village: ServiceCost;
  town: ServiceCost;
  city: ServiceCost;
}

export const SETTLEMENT_COSTS = {
  /** Step 2: Heal */
  heal: {
    camp:    { hpPerPoint: 40, poisonPerPip: { unlockChance: 35, cost: 70, perItem: false }, diseasePerPip: { unlockChance: 35, cost: 110, perItem: false } },
    village: { hpPerPoint: 30, poisonPerPip: { unlockChance: 50, cost: 60, perItem: false }, diseasePerPip: { unlockChance: 50, cost: 95,  perItem: false } },
    town:    { hpPerPoint: 25, poisonPerPip: { unlockChance: 75, cost: 50, perItem: false }, diseasePerPip: { unlockChance: 75, cost: 80,  perItem: false } },
    city:    { hpPerPoint: 20, poisonPerPip: { unlockChance:  0, cost: 40, perItem: false }, diseasePerPip: { unlockChance:  0, cost: 65,  perItem: false } },
  } satisfies SettlementStep2Heal,

  /** Step 3: Repair Items (adjustment per pip over base cost) */
  repair: {
    camp:    { unlockChance: 35, cost: 30, perItem: false },
    village: { unlockChance: 50, cost: 20, perItem: false },
    town:    { unlockChance: 75, cost: 10, perItem: false },
    city:    { unlockChance:  0, cost:  0, perItem: false },
  } satisfies Record<SettlementType, ServiceCost>,

  /** Step 4: Sell Items (find buyer per item) */
  sell: {
    camp:    { unlockChance: 35, cost: 0, perItem: true },
    village: { unlockChance: 50, cost: 0, perItem: true },
    town:    { unlockChance: 75, cost: 0, perItem: true },
    city:    { unlockChance:  0, cost: 0, perItem: true }, // always finds buyer
  } satisfies Record<SettlementType, ServiceCost>,

  /** Step 5: Buy Needed — price over base per N table range */
  buyNeeded: {
    /** N results 1-45 */
    n1to45: {
      camp:    { unlockChance:  0, cost: 3, perItem: false },
      village: { unlockChance:  0, cost: 2, perItem: false },
      town:    { unlockChance:  0, cost: 1, perItem: false },
      city:    { unlockChance:  0, cost: 0, perItem: false },
    } satisfies Record<SettlementType, ServiceCost>,
    /** N results 46-70 */
    n46to70: {
      camp:    { unlockChance: 35, cost: 30, perItem: false },
      village: { unlockChance: 50, cost: 20, perItem: false },
      town:    { unlockChance:  0, cost: 10, perItem: false },
      city:    { unlockChance:  0, cost:  0, perItem: false },
    } satisfies Record<SettlementType, ServiceCost>,
    /** N results 71-97 */
    n71to97: {
      camp:    { unlockChance: 35, cost: 60, perItem: false },
      village: { unlockChance: 50, cost: 40, perItem: false },
      town:    { unlockChance: 75, cost: 20, perItem: false },
      city:    { unlockChance:  0, cost:  0, perItem: false },
    } satisfies Record<SettlementType, ServiceCost>,
    /** N results 98-100 */
    n98to100: {
      camp:    NOT_AVAILABLE,
      village: { unlockChance: 50, cost: 120, perItem: false },
      town:    { unlockChance: 75, cost: 100, perItem: false },
      city:    { unlockChance:  0, cost:   0, perItem: false },
    } satisfies Record<SettlementType, ServiceCost>,
  },

  /** Step 6: Search Markets */
  searchMarket: {
    /** Tables A & W */
    aAndW: {
      camp:    { unlockChance: 35, cost: 30, perItem: false },
      village: { unlockChance:  0, cost: 20, perItem: false },
      town:    { unlockChance:  0, cost: 10, perItem: false },
      city:    { unlockChance:  0, cost:  0, perItem: false },
    } satisfies Record<SettlementType, ServiceCost>,
    /** Table P (witchery parts) */
    tableP: {
      camp:    { unlockChance: 35, cost: 20, perItem: false },
      village: { unlockChance: 50, cost: 10, perItem: false },
      town:    { unlockChance:  0, cost:  0, perItem: false },
      city:    { unlockChance:  0, cost:  0, perItem: false },
    } satisfies Record<SettlementType, ServiceCost>,
    /** Tables TA, TB, TC */
    taTbTc: {
      camp:    NOT_AVAILABLE,
      village: { unlockChance: 50, cost: 40, perItem: false },
      town:    { unlockChance: 75, cost: 20, perItem: false },
      city:    { unlockChance:  0, cost:  0, perItem: false },
    } satisfies Record<SettlementType, ServiceCost>,
  },

  /** Step 7: Training */
  training: {
    skill: {
      camp:    { unlockChance: 35, cost: 350, perItem: false },
      village: { unlockChance: 50, cost: 300, perItem: false },
      town:    { unlockChance:  0, cost: 250, perItem: false },
      city:    { unlockChance:  0, cost: 200, perItem: false },
    } satisfies Record<SettlementType, ServiceCost>,
    stat: {
      camp:    { unlockChance: 35, cost: 3500,  perItem: false },
      village: { unlockChance: 50, cost: 3000,  perItem: false },
      town:    { unlockChance: 75, cost: 2500,  perItem: false },
      city:    { unlockChance:  0, cost: 2000,  perItem: false },
    } satisfies Record<SettlementType, ServiceCost>,
    hp: {
      camp:    NOT_AVAILABLE,
      village: { unlockChance: 50, cost: 30000, perItem: false },
      town:    { unlockChance: 75, cost: 25000, perItem: false },
      city:    { unlockChance:  0, cost: 20000, perItem: false },
    } satisfies Record<SettlementType, ServiceCost>,
  },

  /** Step 8: Magic Tuition (per spell) */
  magicTuition: {
    camp:    { unlockChance: 35, cost: 1750, perItem: false },
    village: { unlockChance: 50, cost: 1500, perItem: false },
    town:    { unlockChance:  0, cost: 1250, perItem: false },
    city:    { unlockChance:  0, cost: 1000, perItem: false },
  } satisfies Record<SettlementType, ServiceCost>,

  /** Step 9: Empire Building unlock */
  empireBuilding: {
    camp:    { unlockChance: 35, cost: 0, perItem: false },
    village: { unlockChance: 50, cost: 0, perItem: false },
    town:    { unlockChance: 75, cost: 0, perItem: false },
    city:    { unlockChance:  0, cost: 0, perItem: false },
  } satisfies Record<SettlementType, ServiceCost>,

  /** Step 10: Witchery suspicion % to trigger WITCHERY event */
  witcherySuspicion: {
    camp:    10,
    village: 50,
    town:    75,
    city:    80,
  } satisfies Record<SettlementType, number>,

  /** Step 11: Artisan steps available (unlock % + max step) */
  artisan: {
    camp:    { unlockChance: 35, cost: 0, perItem: false }, // steps 1 & 2 only
    village: { unlockChance: 50, cost: 0, perItem: false }, // steps 1-3
    town:    { unlockChance: 75, cost: 0, perItem: false }, // steps 1-4
    city:    { unlockChance:  0, cost: 0, perItem: false }, // all steps
  } satisfies Record<SettlementType, ServiceCost>,
  artisanMaxSteps: {
    camp: 2,
    village: 3,
    town: 4,
    city: 999,
  } satisfies Record<SettlementType, number>,
} as const;

/** Quests & events section of settlement table */
export const SETTLEMENT_MISC = {
  questChance:     { camp: 20, village: 30, town: 40, city: 50 } satisfies Record<SettlementType, number>,
  lawModifier:     { camp: 2,  village: 1,  town: 0,  city: -1 } satisfies Record<SettlementType, number>,
  eventChance:     { camp: 35, village: 50, town: 75, city: 80 } satisfies Record<SettlementType, number>,
} as const;

// ---------------------------------------------------------------------------
// Book 8: Curious Rules — settlement service availability
// ---------------------------------------------------------------------------

/** Unlock % for Book 8 settlement services (0 = always available, -1 = never) */
export const BOOK8_SETTLEMENT = {
  herbTrainer: {
    camp:    NOT_AVAILABLE,
    village: { unlockChance: 30, cost: 300, perItem: false },
    town:    { unlockChance: 60, cost: 250, perItem: false },
    city:    { unlockChance:  0, cost: 200, perItem: false },
  } satisfies Record<SettlementType, ServiceCost>,

  wizard: {
    camp:    NOT_AVAILABLE,
    village: NOT_AVAILABLE,
    town:    { unlockChance: 50, cost:  50, perItem: false },
    city:    { unlockChance:  0, cost:  50, perItem: false },
  } satisfies Record<SettlementType, ServiceCost>,

  witch: {
    camp:    NOT_AVAILABLE,
    village: { unlockChance: 30, cost: 200, perItem: false },
    town:    { unlockChance: 50, cost: 200, perItem: false },
    city:    { unlockChance:  0, cost: 200, perItem: false },
  } satisfies Record<SettlementType, ServiceCost>,

  armourer: {
    camp:    NOT_AVAILABLE,
    village: NOT_AVAILABLE,
    town:    NOT_AVAILABLE,
    city:    { unlockChance: 0, cost: 0, perItem: false },
  } satisfies Record<SettlementType, ServiceCost>,

  dualWieldTrainer: {
    camp:    NOT_AVAILABLE,
    village: NOT_AVAILABLE,
    town:    { unlockChance: 40, cost: 1000, perItem: false },
    city:    { unlockChance:  0, cost: 1000, perItem: false },
  } satisfies Record<SettlementType, ServiceCost>,
} as const;

/** Haggling price escalation rules (WB S p.27) */
export function hagglingCostMore(basePrice: number): number {
  const digits = Math.floor(Math.log10(Math.max(basePrice, 1))) + 1;
  if (digits <= 1) return basePrice + 1;
  if (digits === 2) return basePrice + 5;
  if (digits === 3) return basePrice + 50;
  return basePrice + 500;
}
