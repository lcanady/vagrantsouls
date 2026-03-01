import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJI } from '../constants.ts';
import type { AdventurerData, BeastData } from '../api/adventurer.ts';
import type { TimeTrack } from '../api/dungeon.ts';

export function buildCampEmbed(
  adv: AdventurerData,
  timeTrack?: TimeTrack,
): EmbedBuilder {
  const timeValue = timeTrack
    ? `Day **${timeTrack.day}**, ${timeTrack.phase}`
    : '—';

  const backpackCount = Array.isArray(adv.inventory) ? adv.inventory.length : 0;

  const embed = new EmbedBuilder()
    .setColor(COLORS.DOWNTIME)
    .setAuthor({ name: `${EMOJI.camp} The hero rests.` })
    .setTitle('MAKE CAMP')
    .setDescription('The dungeon can wait. What will you do?')
    .addFields(
      { name: `${EMOJI.hp} HP`,       value: `**${adv.hp}/${adv.maxHp}**`, inline: true },
      { name: `${EMOJI.gold} Gold`,   value: `**${adv.gold}**`,            inline: true },
      { name: `${EMOJI.time} Time`,   value: timeValue,                    inline: true },
      { name: `${EMOJI.oil} Oil`,     value: `**${adv.oil ?? 0}**`,        inline: true },
      { name: `${EMOJI.food} Food`,   value: `**${adv.food ?? 0}**`,       inline: true },
      { name: `${EMOJI.backpack} Items`, value: `**${backpackCount}**`,    inline: true },
    );

  // Show beast HP if one is present
  if (adv.beast) {
    const beast = adv.beast as BeastData;
    embed.addFields({
      name: `${EMOJI.beast} ${beast.name}`,
      value: `${EMOJI.hp} **${beast.currentHp}/${beast.hp}** | Lv.${beast.level}`,
      inline: true,
    });
  }

  return embed;
}
