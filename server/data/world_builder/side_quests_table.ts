// (WB) SQ – SIDE QUESTS TABLE
// 10 side quest templates, rolled with 1d10

export interface SideQuestTemplate {
  roll: number;
  /** Name template — replace "MONSTER" with rolled monster name */
  nameTpl: string;
  /** Encounter modifier (applied to encounter table roll) */
  encMod: number;
  /** Required monster type (null = any) */
  requiredMonsterType: "demon" | "undead" | null;
  /** Number of random treasures on success */
  rewardCount: number;
  /** Number of areas to explore before boss */
  areasToExplore: number;
  /** Whether the dungeon is trapped (roll d10 on table G per area) */
  isTrapped: boolean;
  /** Details text template */
  details: string;
}

export const SIDE_QUESTS_TABLE: SideQuestTemplate[] = [
  {
    roll: 1,
    nameTpl: "Hollow of the MONSTER",
    encMod: -25,
    requiredMonsterType: null,
    rewardCount: 1,
    areasToExplore: 4,
    isTrapped: false,
    details: "Explore until four areas have been added to the dungeon sheet. In each area the adventurer will encounter a monster (roll for an encounter). In the fourth (the last) area the adventurer will encounter and must Kill the MONSTER. During combat with the MONSTER all escape reaction results are ignored; do not re-roll them, and the MONSTER gains +10 HP. If the monster is killed the adventurer finds 1 random treasure and the quest is completed.",
  },
  {
    roll: 2,
    nameTpl: "Pit of the MONSTER",
    encMod: -20,
    requiredMonsterType: null,
    rewardCount: 1,
    areasToExplore: 6,
    isTrapped: false,
    details: "Explore until six areas have been added to the dungeon sheet. In each area the adventurer will encounter a monster (roll for an encounter). In the sixth (the last) area the adventurer will encounter and must Kill the MONSTER. During combat with the MONSTER all escape reaction results are ignored; do not re-roll them, and the MONSTER gains +10 HP. If the monster is killed the adventurer finds 1 random treasure, and then the quest is completed.",
  },
  {
    roll: 3,
    nameTpl: "Stash of the MONSTER",
    encMod: -15,
    requiredMonsterType: null,
    rewardCount: 2,
    areasToExplore: 6,
    isTrapped: true,
    details: "The dungeon is trapped; roll 1d10 on table G each time an area is added to the dungeon sheet. Then roll for red and green areas in the normal way. Explore until 6 areas have been added to the dungeon sheet. In the sixth (the last) area the adventurer must face the ultimate trap (HIDDEN TRAP: Test Dex-15 [S: Gain 2 random treasures] [F: -1d10 HP]) to reach the hidden treasure. The test may only be attempted once; and then the quest is completed.",
  },
  {
    roll: 4,
    nameTpl: "Burrow of the MONSTER",
    encMod: -10,
    requiredMonsterType: "demon",
    rewardCount: 2,
    areasToExplore: 8,
    isTrapped: false,
    details: "Explore until eight areas have been added to the dungeon sheet. The burrow is in flames and each area the adventurer moves into they must perform AVOID FIRE: Test Dex-10 [S: -1 HP] [F: -2HP] (Agility, Lucky). After the test has been made the adventurer encounters a demon from table E (1-2: Tricksters E56-57, 3-4: Imps E58-59, 5-6: Demon E78). In the eighth (the last) area the adventurer will encounter and must Kill the MONSTER. During combat all escape reaction results are ignored; the MONSTER gains +10 HP. If the monster is killed the adventurer finds 2 random treasures, and then the quest is completed.",
  },
  {
    roll: 5,
    nameTpl: "Crypt of the MONSTER",
    encMod: -5,
    requiredMonsterType: "undead",
    rewardCount: 3,
    areasToExplore: 8,
    isTrapped: false,
    details: "Explore until eight areas have been added to the dungeon sheet. Each area the adventurer moves to a corpse rises from the ground and the adventurer encounters an undead monster (roll 1d6: 1-2 Zombies E53-55, 3-4 Zombie Master E71, 5-6 Skeleton E72). In the eighth (the last) area the adventurer will encounter and must Kill the MONSTER. During combat all escape reaction results are ignored; the MONSTER gains +10 HP. If the monster is killed the adventurer finds 3 random treasures, and then the quest is completed.",
  },
  {
    roll: 6,
    nameTpl: "Den of the MONSTER",
    encMod: 0,
    requiredMonsterType: null,
    rewardCount: 3,
    areasToExplore: 8,
    isTrapped: false,
    details: "Explore until eight areas have been added to the dungeon sheet. In each area the adventurer will encounter a monster (roll for an encounter). In the eighth (the last) area the adventurer will encounter and must Kill the MONSTER. During combat all escape reaction results are ignored; the MONSTER gains +10 HP. If the monster is killed the adventurer finds 3 random treasures, and then the quest is completed.",
  },
  {
    roll: 7,
    nameTpl: "Labyrinth of the MONSTER",
    encMod: 5,
    requiredMonsterType: null,
    rewardCount: 4,
    areasToExplore: 10,
    isTrapped: true,
    details: "Labyrinths are always trapped; roll 1d10 on table G each time an area is added to the dungeon sheet. Then roll for new red and green areas in the normal way. Explore until ten areas have been added to the dungeon sheet. In the tenth (the last) area the adventurer will encounter and must Kill the MONSTER. During combat all escape reaction results are ignored; the MONSTER gains +10 HP. If the monster is killed the adventurer finds 4 random treasures, and then the quest is completed.",
  },
  {
    roll: 8,
    nameTpl: "Sanctuary of the MONSTER",
    encMod: 10,
    requiredMonsterType: "demon",
    rewardCount: 4,
    areasToExplore: 10,
    isTrapped: false,
    details: "Explore until ten areas have been added to the dungeon sheet. The sanctuary is in flames and each area the adventurer moves into they must perform AVOID FIRE: Test Dex-10 [S: -2 HP] [F: -3 HP] (Agility, Lucky). After the test the adventurer encounters a demon from table E (1-2: Tricksters E56-57, 3-4: Imps E58-59, 5-6: Demon E78). In the tenth (the last) area the adventurer will encounter and must Kill the MONSTER. During combat all escape reaction results are ignored; the MONSTER gains +10 HP. If killed the adventurer finds 4 random treasures.",
  },
  {
    roll: 9,
    nameTpl: "Tomb of the MONSTER",
    encMod: 15,
    requiredMonsterType: "undead",
    rewardCount: 5,
    areasToExplore: 12,
    isTrapped: false,
    details: "Explore until twelve areas have been added to the dungeon sheet. Each area the adventurer moves into a corpse rises from the ground (roll 1d6: 1-2 Zombies E53-55, 3-4 Zombie Master E71, 5-6 Skeleton E72). In the twelfth (the last) area the adventurer will encounter and must Kill the MONSTER. During combat all escape reaction results are ignored; the MONSTER gains +10 HP. If the monster is killed the adventurer finds 5 random treasures and then the quest is completed.",
  },
  {
    roll: 10,
    nameTpl: "Lair of the MONSTER",
    encMod: 20,
    requiredMonsterType: null,
    rewardCount: 5,
    areasToExplore: 12,
    isTrapped: false,
    details: "Explore until twelve areas have been added to the dungeon sheet. In each area the adventurer will encounter a monster (roll for an encounter). In the twelfth (the last) area the adventurer will encounter and must Kill the MONSTER. During combat all escape reaction results are ignored; the MONSTER gains +10 HP. If the monster is killed the adventurer finds 5 random treasures and then the quest is completed.",
  },
];

export function getSideQuestTemplate(roll: number): SideQuestTemplate {
  const entry = SIDE_QUESTS_TABLE.find((e) => e.roll === roll);
  if (!entry) throw new Error(`Invalid side quest roll: ${roll}`);
  return entry;
}
