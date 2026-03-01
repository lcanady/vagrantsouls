import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJI, PATH_EMOJI, RACE_EMOJI } from '../constants.ts';
import type { AdventurerData } from '../api/adventurer.ts';

export function buildChargenStep1Embed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.DEFAULT)
    .setTitle(`${EMOJI.scroll} Create Your Adventurer — Step 1: Name & Stats`)
    .setDescription(
      'Fill in your adventurer\'s name and distribute your starting attribute points.\n\n' +
        '**Attributes**\n' +
        `${EMOJI.str} **STR** — melee attacks, feats of strength\n` +
        `${EMOJI.dex} **DEX** — ranged attacks, dodge, stealth\n` +
        `${EMOJI.int} **INT** — magic, tame beasts, perception\n\n` +
        '_You have **15 points** to distribute (min 1, max 8 per attribute)._',
    );
}

export function buildChargenStep2Embed(adv: AdventurerData): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.DEFAULT)
    .setTitle(`${EMOJI.sword} Create Your Adventurer — Step 2: Choose Path`)
    .setDescription(
      `**${adv.name}** — ${EMOJI.str} ${adv.str} | ${EMOJI.dex} ${adv.dex} | ${EMOJI.int} ${adv.int}\n\n` +
        'Choose your adventuring path. Each path grants unique starting equipment and unlocks special abilities.',
    );
}

export function buildChargenStep3Embed(adv: AdventurerData): EmbedBuilder {
  const pathIcon = PATH_EMOJI[adv.path] ?? '';
  return new EmbedBuilder()
    .setColor(COLORS.DEFAULT)
    .setTitle(`${EMOJI.map} Create Your Adventurer — Step 3: Choose Race`)
    .setDescription(
      `**${adv.name}** | ${pathIcon} ${adv.path}\n\n` +
        'Choose your character\'s race. Each race grants a passive racial ability.',
    );
}

export function buildChargenStep4Embed(adv: AdventurerData): EmbedBuilder {
  const pathIcon = PATH_EMOJI[adv.path] ?? '';
  const raceIcon = RACE_EMOJI[adv.race] ?? '';
  return new EmbedBuilder()
    .setColor(COLORS.DEFAULT)
    .setTitle(`${EMOJI.book} Create Your Adventurer — Step 4: Choose Skills`)
    .setDescription(
      `**${adv.name}** | ${raceIcon} ${adv.race} — ${pathIcon} ${adv.path}\n\n` +
        'Select **2 skills** from the list below. Skills provide passive bonuses or special actions during your adventure.',
    );
}

export function buildChargenStep5Embed(adv: AdventurerData): EmbedBuilder {
  const pathIcon = PATH_EMOJI[adv.path] ?? '';
  const raceIcon = RACE_EMOJI[adv.race] ?? '';
  return new EmbedBuilder()
    .setColor(COLORS.DEFAULT)
    .setTitle(`${EMOJI.star} Create Your Adventurer — Step 5: Finalize`)
    .setDescription(
      'Review your adventurer before entering the dungeon.',
    )
    .addFields(
      {
        name: 'Name',
        value: adv.name,
        inline: true,
      },
      {
        name: 'Race & Path',
        value: `${raceIcon} ${adv.race} — ${pathIcon} ${adv.path}`,
        inline: true,
      },
      {
        name: `${EMOJI.str} STR / ${EMOJI.dex} DEX / ${EMOJI.int} INT`,
        value: `**${adv.str}** / **${adv.dex}** / **${adv.int}**`,
        inline: true,
      },
      {
        name: `${EMOJI.hp} HP / ${EMOJI.fate} Fate / ${EMOJI.life} Life`,
        value: `**${adv.hp}** / **${adv.fate}** / **${adv.life}**`,
        inline: true,
      },
      {
        name: `${EMOJI.scroll} Skills`,
        value: adv.skills?.join(', ') || '_None_',
        inline: false,
      },
    )
    .setFooter({ text: 'Click "Finalize" to begin your adventure!' });
}
