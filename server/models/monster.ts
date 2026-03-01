export interface Monster {
  name: string;
  av: number;
  def: number;
  dmgModifier: number;   // bonus/penalty to damage roll (e.g. +2, -1)
  hpValues: number[];    // current HP for each HP pool (index 0 = primary)
  lootTable: string;
  abilities: string[];
  isUndead: boolean;
  isDaemonic: boolean;
  // Convenience accessor — total remaining HP across all pools
  get hp(): number;
}

export class MonsterInstance implements Monster {
  name: string;
  av: number;
  def: number;
  dmgModifier: number;
  hpValues: number[];
  lootTable: string;
  abilities: string[];
  isUndead: boolean;
  isDaemonic: boolean;

  constructor(data: Omit<Monster, "hp">) {
    this.name        = data.name;
    this.av          = data.av;
    this.def         = data.def;
    this.dmgModifier = data.dmgModifier;
    this.hpValues    = [...data.hpValues];
    this.lootTable   = data.lootTable;
    this.abilities   = data.abilities;
    this.isUndead    = data.isUndead;
    this.isDaemonic  = data.isDaemonic;
  }

  get hp(): number {
    return this.hpValues.reduce((sum, v) => sum + Math.max(0, v), 0);
  }

  /** Apply damage to the first living HP pool. Returns excess damage. */
  applyDamage(dmg: number): number {
    let remaining = dmg;
    for (let i = 0; i < this.hpValues.length; i++) {
      if (this.hpValues[i] > 0) {
        const absorbed = Math.min(this.hpValues[i], remaining);
        this.hpValues[i] -= absorbed;
        remaining -= absorbed;
        break;
      }
    }
    return remaining;
  }

  isDead(): boolean {
    return this.hpValues.every(v => v <= 0);
  }

  toJSON() {
    return {
      name: this.name,
      av: this.av,
      def: this.def,
      dmgModifier: this.dmgModifier,
      hpValues: this.hpValues,
      hp: this.hp,
      lootTable: this.lootTable,
      abilities: this.abilities,
      isUndead: this.isUndead,
      isDaemonic: this.isDaemonic,
    };
  }
}
