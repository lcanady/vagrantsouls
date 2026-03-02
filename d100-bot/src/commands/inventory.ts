import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getAccount } from '../db/store.ts';
import { getAdventurer } from '../api/adventurer.ts';
import { buildInventoryEmbed } from '../embeds/inventory.ts';
import { buildErrorEmbed } from '../embeds/error.ts';

export const data = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('View your adventurer\'s equipped items and backpack.');

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
    await interaction.editReply({ embeds: [buildInventoryEmbed(adv)] });
  } catch (err) {
    await interaction.editReply({
      embeds: [buildErrorEmbed(`Could not fetch adventurer: ${(err as Error).message}`)],
    });
  }
}
