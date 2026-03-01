import { getParty, updateAdventurer, getAdventurer } from "../state.ts";
import pc from "picocolors";
import { MonsterInstance } from "../models/monster.ts";
import { dice } from "./instances.ts";
import { Item } from "../models/item.ts";
import { EquipmentManager } from "../logic/equipment.ts";
import { getDeathKill, LOCATION_NAMES } from "../data/death_kill_table.ts";

export interface CombatAction {
  type: "ATTACK" | "ITEM" | "FLEE" | "WAIT" | "PASS_ITEM";
  payload: unknown;
}

export interface CombatTurn {
  adventurerId: string;
  action: CombatAction;
}

export interface DeathKillResult {
  location: number;
  locationName: string;
  excessDamage: number;
  tableBonus: number;
  description: string;
}

export interface CombatResult {
  logs: string[];
  monster: ReturnType<MonsterInstance["toJSON"]>;
  partyId: string;
  roundOver: boolean;
  combatOver: boolean;
  deathKill?: DeathKillResult;
}

export class CombatLobby {
  private turnBucket: Record<string, Record<string, CombatTurn>> = {};
  private activeMonsters: Record<string, MonsterInstance> = {};

  startCombat(partyId: string, monster: MonsterInstance) {
    this.activeMonsters[partyId] = monster;
    this.turnBucket[partyId] = {};
  }

  getMonster(partyId: string): MonsterInstance | undefined {
    return this.activeMonsters[partyId];
  }

  updateMonster(partyId: string, monster: MonsterInstance) {
    this.activeMonsters[partyId] = monster;
  }

  endCombat(partyId: string) {
    delete this.activeMonsters[partyId];
    if (this.turnBucket[partyId]) delete this.turnBucket[partyId];
  }

  submitAction(partyId: string, adventurerId: string, action: CombatAction): { ready: boolean; pendingCount: number; totalCount: number } {
    const party = getParty(partyId);
    if (!party) throw new Error("Party not found");
    if (!this.turnBucket[partyId]) this.turnBucket[partyId] = {};
    this.turnBucket[partyId][adventurerId] = { adventurerId, action };
    const membersCount = party.members.length;
    const submittedCount = Object.keys(this.turnBucket[partyId]).length;
    return { ready: submittedCount >= membersCount, pendingCount: submittedCount, totalCount: membersCount };
  }

  checkTurnReady(partyId: string): boolean {
    const party = getParty(partyId);
    if (!party || !this.turnBucket[partyId]) return false;
    return Object.keys(this.turnBucket[partyId]).length >= party.members.length;
  }

  resolveTurn(partyId: string): CombatResult {
    const monster = this.activeMonsters[partyId];
    const party = getParty(partyId);
    if (!monster || !party) throw new Error("Invalid combat state");

    const logs: string[] = [];
    const turns = Object.values(this.turnBucket[partyId] || {});
    let finalDeathKill: DeathKillResult | undefined;

    // Ganging Up
    const attackers = turns.filter(t => t.action.type === "ATTACK");
    const gangBonus = Math.max(0, (attackers.length - 1) * 5);
    if (gangBonus > 0) logs.push(`[GANG UP] ${attackers.length} attackers — first attacker gains +${gangBonus} to hit!`);

    for (let idx = 0; idx < turns.length; idx++) {
      const turn = turns[idx];
      const adventurer = getAdventurer(turn.adventurerId);
      if (!adventurer) continue;

      if (turn.action.type === "ATTACK") {
        const payload = turn.action.payload as { weaponSlot?: string };
        const slot: "mainHand" | "offHand" = payload.weaponSlot === "lHand" ? "offHand" : "mainHand";
        const weapon = adventurer[slot] as Item | undefined;
        const roll = dice.rollD100();
        const effectiveStat = adventurer.str + (idx === 0 ? gangBonus : 0);

        if (roll <= effectiveStat) {
          const weaponDamage = weapon?.damage ? dice.parseAndRoll(weapon.damage) : dice.roll(4);
          const totalDamage = Math.max(1, weaponDamage + (weapon?.bonus || 0) + monster.dmgModifier - monster.def);
          const location = Math.ceil(Math.random() * 10);
          const locationName = LOCATION_NAMES[location] ?? "Body";
          const hpBefore = monster.hp;
          const excess = monster.applyDamage(totalDamage);
          const actualDmg = hpBefore - monster.hp;
          const hitStyles = [
            `* SLASH * ${adventurer.name} carves through ${monster.name}.`,
            `* CRUSH * A sickening crunch as ${adventurer.name} strikes.`,
            `* PIERCE * Iron finds soft flesh.`,
            `* HIT * The impact vibrates through ${adventurer.name}'s arms.`,
          ];
          logs.push(`[${pc.red("-" + actualDmg + " HP")}] ${hitStyles[Math.floor(Math.random() * hitStyles.length)]} Hit: ${locationName}. (Roll: ${roll} vs ${effectiveStat})`);

          if (monster.isDead() && excess >= 10) {
            const dk = getDeathKill(location, excess);
            if (dk) {
              finalDeathKill = { location, locationName, excessDamage: excess, tableBonus: dk.tableBonus, description: dk.description };
              logs.push(`[DEATH KILL +${dk.tableBonus} to loot table] ${dk.description}`);
            }
          }
        } else {
          const missStyles = [
            `* SWISH * ${adventurer.name} strikes only cold air.`,
            `* CLANG * Steel sparks against stone.`,
            `* MISS * ${monster.name} skitters out of reach.`,
            `* DODGED * A desperate lunge, easily avoided.`,
          ];
          logs.push(`[MISS] ${missStyles[Math.floor(Math.random() * missStyles.length)]} (Roll: ${roll} vs ${effectiveStat})`);
        }

      } else if (turn.action.type === "ITEM") {
        const payload = turn.action.payload as { slot: "belt1" | "belt2" };
        const item = adventurer[payload.slot];
        if (item && item.usable) {
          try {
            const { adventurer: updatedAdv, log: effectLog } = EquipmentManager.useItem(adventurer, item);
            updateAdventurer(turn.adventurerId, { ...updatedAdv, [payload.slot]: null });
            logs.push(`* USE * ${effectLog}`);
          } catch (e) {
            logs.push(`* FAIL * ${adventurer.name} fumbles: ${(e as Error).message}`);
          }
        } else {
          logs.push(`* VOID * ${adventurer.name} reaches for an empty or unusable slot.`);
        }

      } else if (turn.action.type === "PASS_ITEM") {
        // Pass one equipped item to another party member as a combat action
        const payload = turn.action.payload as { slot: "mainHand" | "offHand" | "belt1" | "belt2"; targetId: string };
        const item = adventurer[payload.slot] as Item | null | undefined;
        if (!item) {
          logs.push(`* VOID * ${adventurer.name} has nothing in slot '${payload.slot}' to pass.`);
        } else {
          const target = getAdventurer(payload.targetId);
          if (!target) {
            logs.push(`* ERROR * Target '${payload.targetId}' not found.`);
          } else {
            updateAdventurer(turn.adventurerId, { ...adventurer, [payload.slot]: null });
            updateAdventurer(payload.targetId, { ...target, backpack: [...(target.backpack || []), item] });
            logs.push(`* PASS * ${adventurer.name} passes ${item.name} to ${target.name}.`);
          }
        }

      } else if (turn.action.type === "FLEE") {
        const roll = dice.rollD100();
        if (roll <= adventurer.dex) {
          logs.push(`[FLEE] ${adventurer.name} scrambles away into the dark!`);
          this.endCombat(partyId);
          return { logs, monster: monster.toJSON(), partyId, roundOver: true, combatOver: true };
        } else {
          logs.push(`[TRAPPED] ${adventurer.name} fails to escape!`);
        }
      } else {
        logs.push(`${adventurer.name}: ${turn.action.type}`);
      }
    }

    if (monster.isDead()) {
      const deathStyles = [
        `[SLAIN] ${monster.name} collapses into a heap.`,
        `[SLAIN] The life spills out of ${monster.name} onto the cold floor.`,
        `[SLAIN] ${monster.name} gives a final, wet gasp and goes still.`,
        `[VICTORY] The threat is neutralized. For now.`,
      ];
      logs.push(deathStyles[Math.floor(Math.random() * deathStyles.length)]);
      this.endCombat(partyId);
      return { logs, monster: monster.toJSON(), partyId, roundOver: true, combatOver: true, deathKill: finalDeathKill };
    }

    // Monster attacks
    if (party.members.length > 0) {
      const targetId = party.members[Math.floor(Math.random() * party.members.length)];
      const target = getAdventurer(targetId);
      if (target) {
        const mRoll = dice.rollD100();
        if (mRoll <= monster.av) {
          const dmg = Math.max(1, Math.floor(monster.av / 10) + monster.dmgModifier + dice.roll(4));
          updateAdventurer(targetId, { hp: Math.max(0, target.hp - dmg) });
          const mHitStyles = [`* REND * ${monster.name} tears into ${target.name}.`, `* BITE * Teeth sink deep.`, `* STRIKE * A heavy blow lands true.`];
          logs.push(`[${pc.red("-" + dmg + " HP")}] ${mHitStyles[Math.floor(Math.random() * mHitStyles.length)]} (Roll: ${mRoll} vs ${monster.av})`);
        } else {
          logs.push(`* DODGED * ${monster.name} misses ${target.name} (Roll: ${mRoll} vs ${monster.av}).`);
        }
      }
    }

    this.turnBucket[partyId] = {};
    return { logs, monster: monster.toJSON(), partyId, roundOver: true, combatOver: false };
  }

  getPendingActions(partyId: string): CombatTurn[] {
    if (!this.turnBucket[partyId]) return [];
    return Object.values(this.turnBucket[partyId]);
  }

  clearTurn(partyId: string) {
    if (this.turnBucket[partyId]) this.turnBucket[partyId] = {};
  }
}
