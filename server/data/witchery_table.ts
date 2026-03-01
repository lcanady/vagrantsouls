/**
 * Table O — Witchery
 */
export interface WitcheryEntry {
  minRoll: number;
  maxRoll: number;
  effect: string;       // potion/anointment effect
  effectType: "P" | "A"; // P = Potion (drunk), A = Anointment (applied to item)
  mishap: string;
}

export const WITCHERY_TABLE: WitcheryEntry[] = [
  { minRoll:  1, maxRoll:  4, effectType: "P", effect: "Stronger: Adventurer gains +5 adjusted Strength.",                    mishap: "Weaker: Adventurer suffers -5 adjusted Strength." },
  { minRoll:  5, maxRoll:  8, effectType: "P", effect: "Faster: Adventurer gains +5 adjusted Dexterity.",                     mishap: "Slower: Adventurer suffers -5 adjusted Dexterity." },
  { minRoll:  9, maxRoll: 12, effectType: "P", effect: "Wisdom: Adventurer gains +5 adjusted Intelligence.",                  mishap: "Dumbness: Adventurer suffers -5 adjusted Intelligence." },
  { minRoll: 13, maxRoll: 16, effectType: "P", effect: "Toughness: Adventurer gains +0.5 Defence.",                           mishap: "Vulnerable: Adventurer suffers -0.5 Defence." },
  { minRoll: 17, maxRoll: 20, effectType: "P", effect: "Mightier: Adventurer gains +1 Damage.",                               mishap: "Fatigued: Adventurer suffers -1 Damage." },
  { minRoll: 21, maxRoll: 24, effectType: "P", effect: "Healthier: Adventurer gains +1 adjusted HP.",                         mishap: "Sickness: Adventurer suffers -1 adjusted HP." },
  { minRoll: 25, maxRoll: 28, effectType: "P", effect: "Witches Influence: Gain 1 WI point to add/deduct 1-10 from any roll.",mishap: "Curse of the Witches: -10 to all monster reward rolls." },
  { minRoll: 29, maxRoll: 32, effectType: "A", effect: "Strength: Apply to weapon/armour — gains +5 Strength bonus.",        mishap: "Cursed Strength: Random equipped item suffers -5 Strength bonus." },
  { minRoll: 33, maxRoll: 36, effectType: "A", effect: "Dexterity: Apply to weapon/armour — gains +5 Dexterity bonus.",       mishap: "Cursed Dexterity: Random equipped item suffers -5 Dexterity bonus." },
  { minRoll: 37, maxRoll: 40, effectType: "A", effect: "Intelligence: Apply to weapon/armour — gains +5 Intelligence bonus.", mishap: "Cursed Intelligence: Random equipped item suffers -5 Intelligence bonus." },
  { minRoll: 41, maxRoll: 44, effectType: "A", effect: "Health: Apply to weapon/armour — gains +1 HP bonus.",                 mishap: "Cursed Health: Random equipped item suffers -1 HP bonus." },
  { minRoll: 45, maxRoll: 48, effectType: "A", effect: "Defence: Apply to weapon/armour — gains +0.5 Defence bonus.",         mishap: "Cursed Defence: Random equipped item suffers -0.5 Defence bonus." },
  { minRoll: 49, maxRoll: 52, effectType: "A", effect: "Durability: Apply to item — shade ½ pip instead of 1 per damage.",    mishap: "Weakness: Random equipped item shades 1 extra pip per damage." },
  { minRoll: 53, maxRoll: 56, effectType: "A", effect: "Reinforce: Apply to armour — gains +1 A.",                            mishap: "Vulnerable: Random equipped armour suffers -1 A." },
  { minRoll: 57, maxRoll: 60, effectType: "A", effect: "Venom Poison: Apply to weapon — gains +1 Damage.",                   mishap: "Powerful Foes: All monsters gain +1 Damage." },
  { minRoll: 61, maxRoll: 64, effectType: "P", effect: "Anti Venom: Shade ½ pip per poison damage instead of 1.",             mishap: "Susceptible: Shade 1 extra pip per poison damage." },
  { minRoll: 65, maxRoll: 68, effectType: "P", effect: "Immunity: Shade ½ pip per disease damage instead of 1.",              mishap: "Plagued: Shade 1 extra pip per disease damage." },
  { minRoll: 69, maxRoll: 72, effectType: "P", effect: "Adept: Random skill gains +5 skill bonus.",                           mishap: "Unskilful: Random skill suffers -5 skill bonus." },
  { minRoll: 73, maxRoll: 76, effectType: "P", effect: "Learning: Random skill experience star is considered shaded.",         mishap: "Forgotten Learning: Random skill experience star is considered unshaded." },
  { minRoll: 77, maxRoll: 80, effectType: "P", effect: "Witches Fate: Gain 1 WF point usable as a Fate point.",               mishap: "Cursed Fate: Cannot use Fate points for the duration of the quest." },
  { minRoll: 81, maxRoll: 84, effectType: "P", effect: "Witches Life: Gain 1 WL point usable as a Life point.",               mishap: "Cursed Life: Cannot use Life points for the duration of the quest." },
  { minRoll: 85, maxRoll: 88, effectType: "P", effect: "Witches Magic: All spells gain +5 spell bonus.",                      mishap: "Cursed Magic: Each cast attempt — roll d6; on a 1 the spell fails." },
  { minRoll: 89, maxRoll: 92, effectType: "P", effect: "Greed: All gold added to adventure sheet is doubled.",                 mishap: "Luckless: All gold added to adventure sheet is halved." },
  { minRoll: 93, maxRoll: 96, effectType: "P", effect: "Ability: An ability is shaded (Mighty Blow / Perfect Aim / Spell Caster — roll d6).", mishap: "Ability Curse: All abilities are unshaded; cannot use Mighty Blow, Perfect Aim, or Spell Caster." },
  { minRoll: 97, maxRoll:100, effectType: "P", effect: "Time Slip: Gain 1 TH point usable instead of shading a clock face on the time track.", mishap: "Delayed: Each time track refresh shades first two clock faces automatically." },
];

/** Rarity bonus added to the Witchery test */
export const RARITY_BONUS: Record<string, number> = {
  normal:   5,
  uncommon: 10,
  scarce:   15,
  rare:     20,
};

export function lookupWitchery(roll: number): WitcheryEntry {
  return WITCHERY_TABLE.find(e => roll >= e.minRoll && roll <= e.maxRoll) ?? WITCHERY_TABLE[0];
}
