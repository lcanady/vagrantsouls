import { EmbedBuilder } from 'discord.js';
import {
  COLORS,
  EMOJI,
  GUILD_EMOJI,
  PATH_EMOJI,
  RACE_EMOJI,
} from '../constants.ts';
import type { AdventurerData } from '../api/adventurer.ts';

export function buildStatusEmbed(adv: AdventurerData): EmbedBuilder {
  const pathIcon = PATH_EMOJI[adv.path] ?? '';
  const raceIcon = RACE_EMOJI[adv.race] ?? '';

  const embed = new EmbedBuilder()
    .setColor(COLORS.DEFAULT)
    .setTitle(`${EMOJI.stats} ${adv.name}`)
    .setDescription(
      `${raceIcon} **${adv.race}** — ${pathIcon} **${adv.path}** | Level **${adv.level}**`,
    )
    .addFields(
      {
        name: `${EMOJI.hp} Vitals`,
        value: [
          `HP: **${adv.hp}/${adv.maxHp}**`,
          `Fate: **${adv.fate}**`,
          `Life: **${adv.life}**`,
        ].join('\n'),
        inline: true,
      },
      {
        name: `${EMOJI.str} Attributes`,
        value: [
          `${EMOJI.str} STR: **${adv.str}**`,
          `${EMOJI.dex} DEX: **${adv.dex}**`,
          `${EMOJI.int} INT: **${adv.int}**`,
        ].join('\n'),
        inline: true,
      },
      {
        name: `${EMOJI.gold} Resources`,
        value: `Gold: **${adv.gold}${EMOJI.gold}**`,
        inline: true,
      },
    );

  if (adv.skills && adv.skills.length > 0) {
    embed.addFields({
      name: `${EMOJI.scroll} Skills`,
      value: adv.skills.join(', '),
    });
  }

  if (adv.beast) {
    const beast = adv.beast as Record<string, unknown>;
    embed.addFields({
      name: `${EMOJI.beast} Beast Companion`,
      value: `**${beast.name}** (Lvl ${beast.level}) — HP: ${beast.currentHp}/${beast.hp}`,
    });
  }

  if (adv.arcanist) {
    const arc = adv.arcanist as Record<string, unknown>;
    embed.addFields({
      name: `${EMOJI.arcane} Arcanist`,
      value: `Order: **${arc.order}** | Rank: **${arc.rank}**`,
    });
  }

  if (adv.artisan) {
    const art = adv.artisan as Record<string, unknown>;
    const guildIcon = GUILD_EMOJI[(art.guild as string) ?? ''] ?? EMOJI.artisan;
    embed.addFields({
      name: `${guildIcon} Artisan`,
      value: `Guild: **${art.guild}**`,
    });
  }

  return embed;
}
