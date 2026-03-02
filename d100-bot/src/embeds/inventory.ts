import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJI } from '../constants.ts';
import type { AdventurerData } from '../api/adventurer.ts';

interface ItemLike {
  name: string;
  value?: number;
  damage?: string;
  def?: number;
  bonus?: number;
  damagePips?: number;
  twoHanded?: boolean;
  usable?: boolean;
  [key: string]: unknown;
}

function itemSummary(item: ItemLike): string {
  const parts: string[] = [];
  if (item.damage) parts.push(`DMG: ${item.damage}`);
  if (item.def != null && item.def > 0) parts.push(`DEF: ${item.def}`);
  if (item.bonus != null && item.bonus !== 0) parts.push(`+${item.bonus}`);
  if (item.damagePips && item.damagePips > 0) parts.push('●'.repeat(item.damagePips));
  if (item.twoHanded) parts.push('2H');
  if (item.value) parts.push(`${item.value}${EMOJI.gold}`);
  return parts.length > 0 ? `_(${parts.join(' | ')})_` : '';
}

export function buildInventoryEmbed(adv: AdventurerData): EmbedBuilder {
  const items = (adv.inventory as ItemLike[]) ?? [];
  const rHand = adv.rHand as ItemLike | null;
  const lHand = adv.lHand as ItemLike | null;

  const embed = new EmbedBuilder()
    .setColor(COLORS.DEFAULT)
    .setTitle(`${EMOJI.backpack} Inventory — ${adv.name}`)
    .setDescription(`**${items.length}** item${items.length !== 1 ? 's' : ''} in backpack`);

  // Equipped
  const equippedLines: string[] = [];
  if (rHand) equippedLines.push(`${EMOJI.sword} **${rHand.name}** ${itemSummary(rHand)}`);
  if (lHand) equippedLines.push(`${EMOJI.shield} **${lHand.name}** ${itemSummary(lHand)}`);

  embed.addFields({
    name: `${EMOJI.sword} Equipped`,
    value: equippedLines.length > 0 ? equippedLines.join('\n') : '_Nothing equipped_',
  });

  // Backpack — split into chunks of 10 to stay within Discord field limits
  if (items.length > 0) {
    const CHUNK = 10;
    for (let i = 0; i < items.length; i += CHUNK) {
      const chunk = items.slice(i, i + CHUNK);
      const lines = chunk.map((item, idx) =>
        `**${i + idx + 1}.** ${item.name} ${itemSummary(item)}`
      );
      embed.addFields({
        name: i === 0 ? `${EMOJI.backpack} Backpack` : '\u200B',
        value: lines.join('\n'),
      });
    }
  } else {
    embed.addFields({ name: `${EMOJI.backpack} Backpack`, value: '_Empty_' });
  }

  return embed;
}
