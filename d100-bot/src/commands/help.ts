import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJI } from '../constants.ts';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show available commands and how to play D100 Dungeon.');

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(COLORS.NAVY)
    .setTitle(`${EMOJI.book} D100 Dungeon — Command Reference`)
    .setDescription(
      'Welcome to D100 Dungeon — a solo dungeon crawler played right here in Discord!',
    )
    .addFields(
      {
        name: `${EMOJI.guild} Getting Started`,
        value: [
          `\`/register\` — Link your Discord to the game`,
          `\`/create\` — Build your adventurer (5-step wizard)`,
          `\`/enter\` — Enter the dungeon and begin your quest`,
        ].join('\n'),
      },
      {
        name: `${EMOJI.door} During Your Quest`,
        value: [
          `**Move Forward** — Advance to the next room`,
          `**Search Room** — Search for loot and secrets`,
          `**Make Camp** — Rest to recover resources _(unlocked later)_`,
        ].join('\n'),
      },
      {
        name: `${EMOJI.skull} In Combat`,
        value: [
          `**Attack** — Strike the monster with your weapon`,
          `**Defend** — Hold position and reduce incoming damage`,
          `**Flee** — Attempt to escape combat`,
        ].join('\n'),
      },
      {
        name: `${EMOJI.stats} Other Commands`,
        value: [
          `\`/status\` — View your current adventurer stats`,
          `\`/help\` — Show this reference`,
        ].join('\n'),
      },
    )
    .setFooter({
      text: 'D100 Dungeon • Based on the solo tabletop RPG by Martin Knight',
    });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
