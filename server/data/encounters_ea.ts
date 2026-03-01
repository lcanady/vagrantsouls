/**
 * Encounter Table EA — 
 * Each entry represents one or more consecutive d100 rows.
 */
export interface EAMonsterEntry {
  minRoll: number;
  maxRoll: number;
  name: string;
  av: number;
  def: number;
  dmgModifier: number;       // added to damage roll
  hpValues: number[];        // multi-HP for pack monsters; single element = solo
  lootTable: string;         // e.g. "P1", "TA+10", "A/I/W"
  abilities: string[];       // ability names
  isUndead: boolean;         // C marker
  isDaemonic: boolean;       // d marker
}

export const ENCOUNTER_TABLE_EA: EAMonsterEntry[] = [
  { minRoll:  1, maxRoll: 10, name: "Giant Oozes",           av: 20, def: 0, dmgModifier: -3, hpValues: [3,3,2,2],  lootTable: "1d10 GP",      abilities: ["Pack","Web","Regenerate"],          isUndead: false, isDaemonic: false },
  { minRoll: 11, maxRoll: 20, name: "Hobgoblins",            av: 25, def: 1, dmgModifier: -2, hpValues: [4,4,3],    lootTable: "I/W",          abilities: ["Pack"],                            isUndead: false, isDaemonic: false },
  { minRoll: 21, maxRoll: 25, name: "Lizardman",             av: 25, def: 1, dmgModifier: -1, hpValues: [6],        lootTable: "A/I/W",        abilities: ["Poison"],                          isUndead: false, isDaemonic: false },
  { minRoll: 26, maxRoll: 30, name: "Lizardman Rock Slinger",av: 25, def: 1, dmgModifier: -1, hpValues: [6],        lootTable: "A/I/W",        abilities: ["Poison","Surprise"],               isUndead: false, isDaemonic: false },
  { minRoll: 31, maxRoll: 33, name: "Revenant Elf Archer",   av: 30, def: 0, dmgModifier:  0, hpValues: [5],        lootTable: "A/W",          abilities: ["Surprise","Fear"],                 isUndead: true,  isDaemonic: false },
  { minRoll: 34, maxRoll: 37, name: "Revenant Dwarf",        av: 30, def: 1, dmgModifier:  0, hpValues: [5],        lootTable: "A/W",          abilities: ["Fear"],                            isUndead: true,  isDaemonic: false },
  { minRoll: 38, maxRoll: 41, name: "Revenant Elf Champion", av: 30, def: 0, dmgModifier:  0, hpValues: [6],        lootTable: "A/W",          abilities: ["Surprise","Fear"],                 isUndead: true,  isDaemonic: false },
  { minRoll: 42, maxRoll: 42, name: "Revenant Dwarf Champion",av:30, def: 1, dmgModifier:  0, hpValues: [6],        lootTable: "A/W",          abilities: ["Fear"],                            isUndead: true,  isDaemonic: false },
  { minRoll: 43, maxRoll: 44, name: "Mountain Lions",        av: 35, def: 0, dmgModifier:  1, hpValues: [5,5,4],    lootTable: "P3",           abilities: ["Pack","Leap"],                     isUndead: false, isDaemonic: false },
  { minRoll: 45, maxRoll: 46, name: "Beastman",              av: 35, def: 1, dmgModifier:  1, hpValues: [8],        lootTable: "A/I/W",        abilities: ["Frenzy"],                          isUndead: false, isDaemonic: false },
  { minRoll: 47, maxRoll: 47, name: "Beastman Archer",       av: 35, def: 2, dmgModifier:  1, hpValues: [10],       lootTable: "A/I/W",        abilities: ["Frenzy"],                          isUndead: false, isDaemonic: false },
  { minRoll: 48, maxRoll: 49, name: "Giant Boar",            av: 40, def: 1, dmgModifier:  2, hpValues: [12],       lootTable: "P3",           abilities: [],                                  isUndead: false, isDaemonic: false },
  { minRoll: 50, maxRoll: 51, name: "Giant Moth",            av: 40, def: 2, dmgModifier:  2, hpValues: [8],        lootTable: "2d10 GP",      abilities: ["Fly"],                             isUndead: false, isDaemonic: false },
  { minRoll: 52, maxRoll: 52, name: "Centaur",               av: 45, def: 2, dmgModifier:  1, hpValues: [8],        lootTable: "A/I/W",        abilities: [],                                  isUndead: false, isDaemonic: false },
  { minRoll: 53, maxRoll: 55, name: "Giant Wasps",           av: 40, def: 1, dmgModifier:  0, hpValues: [5,5,3,3],  lootTable: "P1",           abilities: ["Pack","Fly","Stun"],               isUndead: false, isDaemonic: false },
  { minRoll: 56, maxRoll: 57, name: "Giant Centipede",       av: 45, def: 2, dmgModifier:  2, hpValues: [8],        lootTable: "P1",           abilities: ["Poison"],                          isUndead: false, isDaemonic: false },
  { minRoll: 58, maxRoll: 59, name: "Succubus",              av: 40, def: 1, dmgModifier:  1, hpValues: [12],       lootTable: "P4/I/W",       abilities: ["Fly","Dark Magic"],                isUndead: false, isDaemonic: true  },
  { minRoll: 60, maxRoll: 61, name: "Giant Crab",            av: 45, def: 3, dmgModifier:  2, hpValues: [10],       lootTable: "P1",           abilities: [],                                  isUndead: false, isDaemonic: false },
  { minRoll: 62, maxRoll: 65, name: "Dire Wolves",           av: 40, def: 2, dmgModifier:  1, hpValues: [6,5,5,5],  lootTable: "P3",           abilities: ["Pack","Leap"],                     isUndead: false, isDaemonic: false },
  { minRoll: 66, maxRoll: 66, name: "Beastman Champion",     av: 40, def: 2, dmgModifier:  1, hpValues: [16],       lootTable: "A+10/I/W+10",  abilities: ["Frenzy"],                          isUndead: false, isDaemonic: false },
  { minRoll: 67, maxRoll: 67, name: "Centaur Champion",      av: 45, def: 3, dmgModifier:  2, hpValues: [16],       lootTable: "A+10/I/W+10",  abilities: [],                                  isUndead: false, isDaemonic: false },
  { minRoll: 68, maxRoll: 68, name: "Valkyries",             av: 50, def: 2, dmgModifier:  1, hpValues: [12],       lootTable: "A+15/I/W+15",  abilities: ["Fly"],                             isUndead: false, isDaemonic: false },
  { minRoll: 69, maxRoll: 70, name: "Doppelgänger",          av: -1, def: 0, dmgModifier:  0, hpValues: [14],       lootTable: "TA",           abilities: ["Doppelganger"],                    isUndead: false, isDaemonic: false },
  { minRoll: 71, maxRoll: 71, name: "Werewolves",            av: 45, def: 1, dmgModifier:  2, hpValues: [7,7,6],    lootTable: "P2/TA",        abilities: ["Pack","Leap","Frenzy"],             isUndead: true,  isDaemonic: false },
  { minRoll: 72, maxRoll: 72, name: "Beastman Witch",        av: 45, def: 2, dmgModifier:  1, hpValues: [16],       lootTable: "A+15/I/W+15",  abilities: ["Frenzy","Dark Magic"],             isUndead: false, isDaemonic: false },
  { minRoll: 73, maxRoll: 73, name: "Giant Scorpion",        av: 55, def: 4, dmgModifier:  2, hpValues: [15],       lootTable: "P1",           abilities: ["Poison","Leap","Stun"],             isUndead: false, isDaemonic: false },
  { minRoll: 74, maxRoll: 74, name: "Shade",                 av: 60, def: 4, dmgModifier:  1, hpValues: [15],       lootTable: "TA+10",        abilities: ["Death Touch","Ethereal","Fear"],    isUndead: true,  isDaemonic: false },
  { minRoll: 75, maxRoll: 75, name: "Hell Hounds",           av: 55, def: 2, dmgModifier:  3, hpValues: [6,6,5],    lootTable: "P3/TA+10",     abilities: ["Pack","Leap"],                      isUndead: false, isDaemonic: true  },
  { minRoll: 76, maxRoll: 76, name: "Siren",                 av: 55, def: 3, dmgModifier:  3, hpValues: [18],       lootTable: "I/W/TA+10",    abilities: ["Dark Magic"],                      isUndead: false, isDaemonic: true  },
  { minRoll: 77, maxRoll: 77, name: "Banshee",               av: 50, def: 4, dmgModifier:  2, hpValues: [24],       lootTable: "TA+15",        abilities: ["Death Touch","Ethereal","Fear"],    isUndead: true,  isDaemonic: false },
  { minRoll: 78, maxRoll: 78, name: "Wendigo",               av: 55, def: 4, dmgModifier:  3, hpValues: [22],       lootTable: "TA+15",        abilities: ["Fear"],                            isUndead: false, isDaemonic: true  },
  { minRoll: 79, maxRoll: 79, name: "Basilisk",              av: 60, def: 4, dmgModifier:  3, hpValues: [24],       lootTable: "P3/TA+15",     abilities: ["Petrify","Poison","Fear"],          isUndead: false, isDaemonic: false },
  { minRoll: 80, maxRoll: 80, name: "Sphinx",                av: 65, def: 4, dmgModifier:  4, hpValues: [25],       lootTable: "P3/TA+20",     abilities: ["Dark Magic"],                      isUndead: false, isDaemonic: false },
  { minRoll: 81, maxRoll: 81, name: "Griffon",               av: 60, def: 3, dmgModifier:  3, hpValues: [30],       lootTable: "P4/TB",        abilities: ["Fly","Fear"],                       isUndead: false, isDaemonic: false },
  { minRoll: 82, maxRoll: 82, name: "Giant Roc",             av: 65, def: 3, dmgModifier:  4, hpValues: [28],       lootTable: "P4/TB",        abilities: ["Fly","Fear"],                       isUndead: false, isDaemonic: false },
  { minRoll: 83, maxRoll: 83, name: "Mummy",                 av: 55, def: 3, dmgModifier:  5, hpValues: [30],       lootTable: "TB",           abilities: ["Fear","Disease","Regenerate"],      isUndead: true,  isDaemonic: false },
  { minRoll: 84, maxRoll: 84, name: "Harpy",                 av: 65, def: 5, dmgModifier:  4, hpValues: [28],       lootTable: "P4/TB+5",      abilities: ["Fly","Dark Magic"],                isUndead: false, isDaemonic: false },
  { minRoll: 85, maxRoll: 85, name: "Cyclops",               av: 65, def: 5, dmgModifier:  3, hpValues: [35],       lootTable: "P2/TB+5",      abilities: ["Fear","Large","Stun"],              isUndead: false, isDaemonic: false },
  { minRoll: 86, maxRoll: 86, name: "Stone Golem",           av: 60, def: 6, dmgModifier:  5, hpValues: [35],       lootTable: "P2/TB+10",     abilities: ["Large","Stun"],                    isUndead: false, isDaemonic: false },
  { minRoll: 87, maxRoll: 87, name: "Manticore",             av: 65, def: 4, dmgModifier:  3, hpValues: [37],       lootTable: "P4/TB+10",     abilities: ["Fear","Large","Poison"],            isUndead: false, isDaemonic: false },
  { minRoll: 88, maxRoll: 88, name: "Cerberus",              av: 60, def: 5, dmgModifier:  4, hpValues: [10,10,10], lootTable: "P3/TB+15",     abilities: ["Pack (Heads)","Fear"],              isUndead: false, isDaemonic: true  },
  { minRoll: 89, maxRoll: 89, name: "Cockatrice",            av: 65, def: 6, dmgModifier:  3, hpValues: [40],       lootTable: "P4/TB+15",     abilities: ["Petrify","Fear"],                   isUndead: false, isDaemonic: false },
  { minRoll: 90, maxRoll: 90, name: "Fire Elemental",        av: 65, def: 7, dmgModifier:  4, hpValues: [39],       lootTable: "P2/TB+20",     abilities: ["Fire","Large","Ethereal (Fire)"],   isUndead: false, isDaemonic: false },
  { minRoll: 91, maxRoll: 91, name: "Chimera",               av: 70, def: 6, dmgModifier:  5, hpValues: [40],       lootTable: "P4/TC",        abilities: ["Fly","Attacks 2","Fire","Fear"],    isUndead: false, isDaemonic: false },
  { minRoll: 92, maxRoll: 92, name: "Echidna",               av: 75, def: 6, dmgModifier:  5, hpValues: [38],       lootTable: "TC+5",         abilities: ["Petrify","Poison","Fear"],          isUndead: false, isDaemonic: true  },
  { minRoll: 93, maxRoll: 93, name: "Lamia",                 av: 75, def: 7, dmgModifier:  5, hpValues: [44],       lootTable: "TC+5",         abilities: ["Dark Magic","Poison","Fear"],       isUndead: false, isDaemonic: true  },
  { minRoll: 94, maxRoll: 94, name: "Vampire Lord",          av: 75, def: 7, dmgModifier:  4, hpValues: [48],       lootTable: "A+20/I/W+40",  abilities: ["Dark Magic","Fly","Phase","Resurrection"], isUndead: true, isDaemonic: false },
  { minRoll: 95, maxRoll: 95, name: "Wyvern",                av: 80, def: 8, dmgModifier:  6, hpValues: [50],       lootTable: "P4/TC+10",     abilities: ["Fire","Fly","Fear","Attacks 2","Large"], isUndead: false, isDaemonic: false },
  { minRoll: 96, maxRoll: 96, name: "Nemean Lions",          av: 75, def: 7, dmgModifier:  6, hpValues: [22,20],    lootTable: "P3/TC+10",     abilities: ["Pack","Leap","Fear"],               isUndead: false, isDaemonic: false },
  { minRoll: 97, maxRoll: 97, name: "Titan",                 av: 85, def: 7, dmgModifier:  7, hpValues: [46],       lootTable: "P2/TC+15",     abilities: ["Fear","Large","Stun"],              isUndead: false, isDaemonic: false },
  { minRoll: 98, maxRoll: 98, name: "Medusa",                av: 90, def: 7, dmgModifier:  6, hpValues: [47],       lootTable: "P2/TC+15",     abilities: ["Petrify","Poison","Fear"],          isUndead: false, isDaemonic: true  },
  { minRoll: 99, maxRoll: 99, name: "Hydra",                 av: 70, def: 8, dmgModifier:  6, hpValues: [10,9,9,8,8,8,7], lootTable: "P3/TC+20", abilities: ["Pack","Large","Fear","Fire","Allies 7"], isUndead: false, isDaemonic: true },
  { minRoll:100, maxRoll:100, name: "Phoenix",               av: 95, def: 9, dmgModifier:  7, hpValues: [55],       lootTable: "P4+90/TC+20",  abilities: ["Fire","Fly","Fear","Large","Resurrection"], isUndead: false, isDaemonic: false },
];

export function lookupEA(roll: number): EAMonsterEntry {
  const entry = ENCOUNTER_TABLE_EA.find(e => roll >= e.minRoll && roll <= e.maxRoll);
  return entry ?? ENCOUNTER_TABLE_EA[0];
}
