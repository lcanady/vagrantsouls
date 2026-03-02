import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJI, PATH_EMOJI, RACE_EMOJI } from '../constants.ts';
import type { AdventurerData, ArcanistData, ArtisanData, BeastData } from '../api/adventurer.ts';

export function buildCharSheetEmbed(adv: AdventurerData): EmbedBuilder {
  const pathIcon = PATH_EMOJI[adv.path] ?? '';
  const raceIcon = RACE_EMOJI[adv.race] ?? '';

  const embed = new EmbedBuilder()
    .setColor(COLORS.NAVY)
    .setTitle(`${EMOJI.book} ${adv.name}`)
    .setDescription(
      `${raceIcon} **${adv.race}** — ${pathIcon} **${adv.path}** | Level **${adv.level}**`,
    );

  // Vitals
  embed.addFields({
    name: `${EMOJI.hp} Vitals`,
    value: `HP: **${adv.hp}/${adv.maxHp}** | Fate: **${adv.fate}** | Life: **${adv.life}**`,
    inline: false,
  });

  // Attributes & Resources
  const resourceParts = [
    `${EMOJI.gold} **${adv.gold}**`,
    adv.oil != null ? `${EMOJI.oil} **${adv.oil}**` : null,
    adv.food != null ? `${EMOJI.food} **${adv.food}**` : null,
    (adv.picks as number | undefined) != null && (adv.picks as number) > 0
      ? `⛏️ **${adv.picks}**`
      : null,
  ].filter(Boolean).join(' | ');

  embed.addFields(
    {
      name: `${EMOJI.str} Attributes`,
      value: `${EMOJI.str} **${adv.str}** | ${EMOJI.dex} **${adv.dex}** | ${EMOJI.int} **${adv.int}**`,
      inline: true,
    },
    {
      name: `${EMOJI.gold} Resources`,
      value: resourceParts,
      inline: true,
    },
  );

  // Skills
  if (adv.skills?.length > 0) {
    embed.addFields({
      name: `${EMOJI.scroll} Skills`,
      value: adv.skills.join(', '),
    });
  }

  // Witchery
  if (adv.witcheryFormulas && Object.keys(adv.witcheryFormulas).length > 0) {
    embed.addFields({
      name: '🌿 Witchery Formulae',
      value: Object.keys(adv.witcheryFormulas).join(', ').slice(0, 512),
    });
  }

  // Beast companion
  if (adv.beast) {
    const beast = adv.beast as BeastData;
    const abilities = beast.abilities.length > 0 ? `\n_${beast.abilities.join(', ')}_` : '';
    embed.addFields({
      name: `${EMOJI.beast} Beast — ${beast.name}`,
      value: [
        `Level **${beast.level}** | HP: **${beast.currentHp}/${beast.hp}**`,
        `Training: **${beast.trainingPips}** pips${abilities}`,
      ].join('\n'),
    });
  }

  // Arcanist
  if (adv.arcanist) {
    const arc = adv.arcanist as ArcanistData;
    const spellList = arc.arcanistSpells.length > 0
      ? arc.arcanistSpells.join(', ')
      : '_No spells learned_';
    embed.addFields({
      name: `${EMOJI.arcane} Arcanist`,
      value: [
        `Order: **${arc.order}** | Rank: **${arc.rank}**`,
        `Spells: ${spellList}`,
        `Arcane Law Broken: **${arc.arcaneLawBroken}** | Stafe Energy: **${arc.stafeEnergy}**`,
      ].join('\n').slice(0, 1024),
    });
  }

  // Artisan
  if (adv.artisan) {
    const art = adv.artisan as ArtisanData;
    const matEntries = Object.entries(art.materials).filter(([, v]) => v > 0);
    const matStr = matEntries.length > 0
      ? matEntries.map(([k, v]) => `${k}: ${v}`).join(', ')
      : '_None_';
    embed.addFields({
      name: `${EMOJI.artisan} Artisan`,
      value: [
        `ART: **${art.art}** | Salvage: **${art.salvageSkill}** | Craft: **${art.craftingSkill}**`,
        `Materials: ${matStr}`,
      ].join('\n').slice(0, 1024),
    });
  }

  // Combat Experience (top 8 kills)
  const ce = adv.combatExperience;
  if (ce && Object.keys(ce).length > 0) {
    const topKills = Object.entries(ce)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([k, v]) => `${k}: **${v}**`);
    if (topKills.length > 0) {
      embed.addFields({
        name: `${EMOJI.skull} Combat Record`,
        value: topKills.join(' | ').slice(0, 512),
      });
    }
  }

  return embed;
}
