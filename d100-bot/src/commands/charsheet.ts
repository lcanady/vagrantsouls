import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getAccount } from '../db/store.ts';
import { getAdventurer } from '../api/adventurer.ts';
import { buildCharSheetEmbed } from '../embeds/charsheet.ts';
import { buildErrorEmbed } from '../embeds/error.ts';

export const data = new SlashCommandBuilder()
  .setName('charsheet')
  .setDescription('View your full character sheet — stats, skills, spells, beast, artisan, and more.');

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const account = await getAccount(interaction.user.id);
  if (!account) {
    await interaction.editReply({
      embeds: [buildErrorEmbed('No account found. Run `/register` first.')],
    });
    return;
  }
  if (!account.adventurer_id) {
    await interaction.editReply({
      embeds: [buildErrorEmbed('No adventurer yet. Run `/create` to build one!')],
    });
    return;
  }

  try {
    const adv = await getAdventurer(account.game_token, account.adventurer_id);
    await interaction.editReply({ embeds: [buildCharSheetEmbed(adv)] });
  } catch (err) {
    await interaction.editReply({
      embeds: [buildErrorEmbed(`Could not fetch adventurer: ${(err as Error).message}`)],
    });
  }
}
