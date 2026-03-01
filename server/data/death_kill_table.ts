/**
 * Table K — Death Kill
 *
 * When overkill damage (excess after reducing HP to 0) is ≥ 10,
 * a Death Kill occurs. Look up by hit location (1-10) and excess
 * damage tier to get a narrative description and loot table bonus.
 */

export interface DeathKillEntry {
  location: number;    // 1 = Head, 2 = Back, 3 = Torso, 4 = Arms, 5-7 = Hands, 8 = Waist, 9 = Legs, 10 = Feet
  minExcess: number;
  maxExcess: number;   // 15+ becomes maxExcess = Infinity
  tableBonus: number;
  description: string;
}

export const DEATH_KILL_TABLE: DeathKillEntry[] = [
  // HEAD (location 1)
  { location: 1, minExcess: 10, maxExcess: 10, tableBonus:  5, description: "The impact ruptures blood vessels in the brain; the monster slumps forward and is easily defeated." },
  { location: 1, minExcess: 11, maxExcess: 11, tableBonus:  5, description: "One side of the monster's head caves in, causing blood to spray in all directions." },
  { location: 1, minExcess: 12, maxExcess: 12, tableBonus: 10, description: "Connecting with the neck and destroying the vertebrae, the monster falls lifelessly to the ground." },
  { location: 1, minExcess: 13, maxExcess: 13, tableBonus: 10, description: "The monster's jaw is torn away and flaps as it turns its head, spraying blood in all directions." },
  { location: 1, minExcess: 14, maxExcess: 14, tableBonus: 15, description: "The monster's skull is shattered and its brain oozes out from the impact; death is instantaneous." },
  { location: 1, minExcess: 15, maxExcess: Infinity, tableBonus: 15, description: "The attack decimates the neck, tearing flesh and causing the head to fly off from its body." },
  // BACK (location 2)
  { location: 2, minExcess: 10, maxExcess: 10, tableBonus:  5, description: "With its back exposed the impact impales and shatters its spine, bringing the monster to its knees." },
  { location: 2, minExcess: 11, maxExcess: 11, tableBonus:  5, description: "Shattering its scapula, the monster is flung forward and is easily dealt with in a follow-up attack." },
  { location: 2, minExcess: 12, maxExcess: 12, tableBonus: 10, description: "Tearing through flesh, the attack penetrates a kidney and the monster falls in deadly pain." },
  { location: 2, minExcess: 13, maxExcess: 13, tableBonus: 10, description: "Fragments of spine splinter and impale a major artery, ending the monster in a heap on the floor." },
  { location: 2, minExcess: 14, maxExcess: 14, tableBonus: 15, description: "The attack tears open the back severing its spine; it slumps forward, twitching in pain." },
  { location: 2, minExcess: 15, maxExcess: Infinity, tableBonus: 15, description: "Impacting its back, the attack ploughs through its body and a shower of blood erupts from its chest." },
  // TORSO (location 3)
  { location: 3, minExcess: 10, maxExcess: 10, tableBonus:  5, description: "A direct hit to its chest sends the monster sprawling backwards onto the floor and it is quickly killed." },
  { location: 3, minExcess: 11, maxExcess: 11, tableBonus:  5, description: "Crunching into the monster's collarbone, the devastating impact sends the monster to the ground." },
  { location: 3, minExcess: 12, maxExcess: 12, tableBonus: 10, description: "Smashing into the ribcage, causing a rib to penetrate a vital organ, the monster drops dead and lays still." },
  { location: 3, minExcess: 13, maxExcess: 13, tableBonus: 10, description: "The devastating attack ruptures internal organs, sending the monster squealing to its death." },
  { location: 3, minExcess: 14, maxExcess: 14, tableBonus: 15, description: "The impact shatters the ribcage and a splintered bone pierces the monster's heart." },
  { location: 3, minExcess: 15, maxExcess: Infinity, tableBonus: 15, description: "The force of the impact caves in the chest, rupturing organs and showering blood in every direction." },
  // ARMS (location 4)
  { location: 4, minExcess: 10, maxExcess: 10, tableBonus:  5, description: "Ripping through the flesh of the upper arm opens a severe wound; the monster dies from blood loss." },
  { location: 4, minExcess: 11, maxExcess: 11, tableBonus:  5, description: "The elbow takes the full force of the impact and is shattered into pieces; the monster is easily defeated." },
  { location: 4, minExcess: 12, maxExcess: 12, tableBonus: 10, description: "Devastating power crushes the arm and bursts an artery; the monster dies just moments later." },
  { location: 4, minExcess: 13, maxExcess: 13, tableBonus: 10, description: "The impact rips away flesh and muscle from the upper arm, crushing the arm bone to dust." },
  { location: 4, minExcess: 14, maxExcess: 14, tableBonus: 15, description: "The attack smashes through skin and bone, severing the arm from the body and leaving behind a stump." },
  { location: 4, minExcess: 15, maxExcess: Infinity, tableBonus: 15, description: "Destroying the shoulder, the arm hangs limply before falling severed to the ground." },
  // HANDS (locations 5, 6, 7)
  { location: 5, minExcess: 10, maxExcess: 10, tableBonus:  5, description: "Shattering the wrist, the thumb is dislocated and the monster falters, enabling it to be killed." },
  { location: 5, minExcess: 11, maxExcess: 11, tableBonus:  5, description: "Smashing the monster's hand into tiny fragments, it screams out in pain, clutching it to its chest." },
  { location: 5, minExcess: 12, maxExcess: 12, tableBonus: 10, description: "Mangled and shredded, the hand hangs limp and broken at the wrist; the monster squeals out in pain." },
  { location: 5, minExcess: 13, maxExcess: 13, tableBonus: 10, description: "The attack severs flesh and bone and four tiny sprinklers spray blood from where fingers should be." },
  { location: 5, minExcess: 14, maxExcess: 14, tableBonus: 15, description: "The wrist takes the brunt of the impact, severing flesh; the monster holds up its newly created stump." },
  { location: 5, minExcess: 15, maxExcess: Infinity, tableBonus: 15, description: "Raised in defence, both hands tumble to the floor, leaving stumps flailing blood in all directions." },
  // WAIST (location 8)
  { location: 8, minExcess: 10, maxExcess: 10, tableBonus:  5, description: "Impacting the groin, the monster drops wincing in pain and is easily dispatched while it lays defenceless." },
  { location: 8, minExcess: 11, maxExcess: 11, tableBonus:  5, description: "The abdomen takes a powerful attack; the monster folds over in pain, twitching momentarily before dying." },
  { location: 8, minExcess: 12, maxExcess: 12, tableBonus: 10, description: "The hip bone is shattered and sends the monster sprawling; unable to rise, it is easily dispatched." },
  { location: 8, minExcess: 13, maxExcess: 13, tableBonus: 10, description: "Shattering the pelvis, the monster screams, dropping its defences and is easily dispatched." },
  { location: 8, minExcess: 14, maxExcess: 14, tableBonus: 15, description: "Ripping through the abdomen, the monster's entrails spill out across the dungeon floor. Death is instantaneous." },
  { location: 8, minExcess: 15, maxExcess: Infinity, tableBonus: 15, description: "Decimating the abdomen, the monster falls to the ground in two separate pieces." },
  // LEGS (location 9)
  { location: 9, minExcess: 10, maxExcess: 10, tableBonus:  5, description: "Dislocating the leg from its hip, the monster stumbles and falls on its back and is easy prey." },
  { location: 9, minExcess: 11, maxExcess: 11, tableBonus:  5, description: "The impact crushes the thigh, severing an artery; the monster drops, twitches momentarily and dies." },
  { location: 9, minExcess: 12, maxExcess: 12, tableBonus: 10, description: "The hip and pelvis shatter on impact, sending fragments of bone into an artery." },
  { location: 9, minExcess: 13, maxExcess: 13, tableBonus: 10, description: "The top part of the leg explodes in a blood shower, sending the monster sprawling to the floor." },
  { location: 9, minExcess: 14, maxExcess: 14, tableBonus: 15, description: "The impact crushes bones and flesh is torn, wrenching the lower leg from the knee socket." },
  { location: 9, minExcess: 15, maxExcess: Infinity, tableBonus: 15, description: "Flesh is torn from the hip joint and bone splinters, severing the leg and sending it across the floor." },
  // FEET (location 10)
  { location: 10, minExcess: 10, maxExcess: 10, tableBonus:  5, description: "Shattering the metatarsal bones across the foot, the monster falters enough for it to be dispatched." },
  { location: 10, minExcess: 11, maxExcess: 11, tableBonus:  5, description: "Smashing the monster's foot into tiny fragments, it squeals out in pain and attempts to limp away." },
  { location: 10, minExcess: 12, maxExcess: 12, tableBonus: 10, description: "The attack impacts the ankle with great force and precision; remarkably the monster drops down dead." },
  { location: 10, minExcess: 13, maxExcess: 13, tableBonus: 10, description: "Severing toes on both feet and after a few bloody footsteps, the monster collapses to the floor in pain." },
  { location: 10, minExcess: 14, maxExcess: 14, tableBonus: 15, description: "Smashing into the top of the foot, the impact splinters bone and mangles flesh, creating a cloud of blood." },
  { location: 10, minExcess: 15, maxExcess: Infinity, tableBonus: 15, description: "Pinning the foot to the ground, the monster attempts to pull it free but instead rips it away from its leg." },
];

// Locations 6 and 7 (Hands) share the same entries as location 5
for (const entry of [...DEATH_KILL_TABLE]) {
  if (entry.location === 5) {
    DEATH_KILL_TABLE.push({ ...entry, location: 6 });
    DEATH_KILL_TABLE.push({ ...entry, location: 7 });
  }
}

export function getDeathKill(location: number, excessDamage: number): DeathKillEntry | null {
  if (excessDamage < 10) return null;
  const capped = Math.min(excessDamage, 15); // 15+ tier applies to 15 and above
  return (
    DEATH_KILL_TABLE.find(
      e => e.location === location && capped >= e.minExcess && capped <= e.maxExcess
    ) ?? null
  );
}

export const LOCATION_NAMES: Record<number, string> = {
  1: "Head", 2: "Back", 3: "Torso", 4: "Arms",
  5: "Hands", 6: "Hands", 7: "Hands",
  8: "Waist", 9: "Legs", 10: "Feet"
};
