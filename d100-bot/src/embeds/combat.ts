import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJI } from '../constants.ts';
import type { AdventurerData } from '../api/adventurer.ts';

export interface MonsterData {
  name: string;
  av: number;
  def: number;
  hpValues: number[];
  abilities: string[];
  isUndead: boolean;
  isDaemonic: boolean;
  [key: string]: unknown;
}

function totalHp(hpValues: number[]): number {
  return hpValues.reduce((sum, v) => sum + Math.max(0, v), 0);
}

export function buildCombatEmbed(
  adv: AdventurerData,
  monster: MonsterData,
  round?: number,
): EmbedBuilder {
  const monsterHp = totalHp(monster.hpValues);
  const hpBar = buildHpBar(adv.hp, adv.maxHp);
  const monHpBar = buildHpBar(monsterHp, monsterHp + 10); // approx max

  const tags = [
    monster.isUndead ? '☠️ Undead' : null,
    monster.isDaemonic ? '👁️ Daemonic' : null,
    monster.abilities.length > 0 ? monster.abilities.join(', ') : null,
  ]
    .filter(Boolean)
    .join(' | ');

  return new EmbedBuilder()
    .setColor(COLORS.COMBAT)
    .setTitle(`${EMOJI.skull} Combat${round != null ? ` — Round ${round}` : ''}`)
    .addFields(
      {
        name: `${EMOJI.sword} ${adv.name}`,
        value: [
          `${EMOJI.hp} HP: **${adv.hp}/${adv.maxHp}** ${hpBar}`,
          `${EMOJI.str} STR **${adv.str}** | ${EMOJI.dex} DEX **${adv.dex}** | ${EMOJI.int} INT **${adv.int}**`,
        ].join('\n'),
        inline: false,
      },
      {
        name: `${EMOJI.beast} ${monster.name}`,
        value: [
          `${EMOJI.hp} HP: **${monsterHp}** ${monHpBar}`,
          `AV: **${monster.av}** | DEF: **${monster.def}**`,
          tags || '\u200B',
        ].join('\n'),
        inline: false,
      },
    );
}

export function buildCombatResultEmbed(
  logs: string[],
  monsterName: string,
  monsterHp: number,
  combatOver: boolean,
  winner?: string,
): EmbedBuilder {
  const color = combatOver
    ? winner === 'party'
      ? COLORS.ROOM_GREEN
      : COLORS.DEATH
    : COLORS.COMBAT;

  const title = combatOver
    ? winner === 'party'
      ? `${EMOJI.star} Victory!`
      : `${EMOJI.skull} Defeat`
    : `${EMOJI.sword} Round Resolved`;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(logs.join('\n') || '_No events this round._')
    .addFields({
      name: monsterName,
      value: combatOver
        ? winner === 'party'
          ? '_Defeated!_'
          : '_You have fallen..._'
        : `HP: **${monsterHp}** remaining`,
      inline: true,
    });
}

export function buildHpBar(current: number, max: number): string {
  const filled = Math.round((current / Math.max(max, 1)) * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}
