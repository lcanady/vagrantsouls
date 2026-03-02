// (WB) NI – NEW ITEMS TABLE
// Roll 1d6 to determine which item to buy; prices vary by settlement type.

export type NewItemRoll = 1 | 2 | 3 | 4 | 5 | 6;
export type WBSettlementType = "camp" | "village" | "town" | "city";

export interface NewItemEntry {
  roll: NewItemRoll;
  name: string;
  description: string;
  /**
   * Buy price per settlement type.
   * null = not available at this settlement type.
   * unlockChance = d100 must be ≤ this value (null = always available).
   * unlockPerPurchase = roll is made each purchase (true) or once per visit (false).
   */
  camp: { unlockChance: number | null; unlockPerPurchase: boolean; price: number } | null;
  village: { unlockChance: number | null; unlockPerPurchase: boolean; price: number } | null;
  town: { unlockChance: number | null; unlockPerPurchase: boolean; price: number } | null;
  city: { unlockChance: number | null; unlockPerPurchase: boolean; price: number } | null;
  /** Sell price (null if cannot be sold) */
  sellPrice: number | null;
}

export const NEW_ITEMS_TABLE: NewItemEntry[] = [
  {
    roll: 1,
    name: "LINE",
    description: "Fishing line for a fishing rod",
    camp:    { unlockChance: 35, unlockPerPurchase: false, price: 7 },
    village: { unlockChance: null, unlockPerPurchase: false, price: 6 },
    town:    { unlockChance: null, unlockPerPurchase: false, price: 5 },
    city:    { unlockChance: null, unlockPerPurchase: false, price: 4 },
    sellPrice: null,
  },
  {
    roll: 2,
    name: "BAIT",
    description: "Fish food used when fishing",
    camp:    { unlockChance: 35, unlockPerPurchase: false, price: 7 },
    village: { unlockChance: null, unlockPerPurchase: false, price: 6 },
    town:    { unlockChance: null, unlockPerPurchase: false, price: 5 },
    city:    { unlockChance: null, unlockPerPurchase: false, price: 4 },
    sellPrice: null,
  },
  {
    roll: 3,
    name: "RATION",
    description: "Dried food",
    camp:    { unlockChance: null, unlockPerPurchase: false, price: 14 },
    village: { unlockChance: null, unlockPerPurchase: false, price: 12 },
    town:    { unlockChance: null, unlockPerPurchase: false, price: 10 },
    city:    { unlockChance: null, unlockPerPurchase: false, price: 8 },
    sellPrice: null,
  },
  {
    roll: 4,
    name: "FISHING ROD",
    description: "Needed for fishing (H,R) (DMG -6)",
    camp:    { unlockChance: 35, unlockPerPurchase: false, price: 35 },
    village: { unlockChance: null, unlockPerPurchase: false, price: 30 },
    town:    { unlockChance: null, unlockPerPurchase: false, price: 25 },
    city:    { unlockChance: null, unlockPerPurchase: false, price: 20 },
    sellPrice: 5,
  },
  {
    roll: 5,
    name: "SADDLEBAGS",
    description: "Four per mount; each bag = 1 damage-track slot + 2 qty-10 slots",
    camp:    null,
    village: { unlockChance: 50, unlockPerPurchase: false, price: 70 },
    town:    { unlockChance: null, unlockPerPurchase: false, price: 60 },
    city:    { unlockChance: null, unlockPerPurchase: false, price: 50 },
    sellPrice: null,
  },
  {
    roll: 6,
    name: "HORSE",
    description: "Mount; value 1500gp. Roll made each purchase attempt.",
    camp:    null,
    village: { unlockChance: 50, unlockPerPurchase: true, price: 1800 },
    town:    { unlockChance: 65, unlockPerPurchase: true, price: 1650 },
    city:    { unlockChance: null, unlockPerPurchase: false, price: 1500 },
    sellPrice: null, // sell price determined by buyer roll
  },
];

/** Scroll of Teleportation is a special item not on the d6 roll but purchasable separately */
export const SCROLL_OF_TELEPORTATION = {
  name: "SCROLL OF TELEPORTATION",
  description: "If cast whilst on a quest: move to any mapped area. If cast whilst not on a quest (World Builder): move to any generated hex up to 2 hex spaces away.",
  camp:    null,
  village: { unlockChance: 50, unlockPerPurchase: true, price: 600 },
  town:    { unlockChance: 65, unlockPerPurchase: true, price: 500 },
  city:    { unlockChance: null, unlockPerPurchase: false, price: 400 },
  sellPrice: null,
} as const;

export function getNewItem(roll: NewItemRoll): NewItemEntry {
  const entry = NEW_ITEMS_TABLE.find((e) => e.roll === roll);
  if (!entry) throw new Error(`Invalid new item roll: ${roll}`);
  return entry;
}

export function getNewItemPrice(
  roll: NewItemRoll,
  settlementType: WBSettlementType,
): { price: number; unlockChance: number | null; unlockPerPurchase: boolean } | null {
  const entry = getNewItem(roll);
  const slot = entry[settlementType];
  if (!slot) return null;
  return { price: slot.price, unlockChance: slot.unlockChance, unlockPerPurchase: slot.unlockPerPurchase };
}
