import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js';
import { getAccount } from '../db/store.ts';
import { buildErrorEmbed } from '../embeds/error.ts';

export const data = new SlashCommandBuilder()
  .setName('create')
  .setDescription('Create your adventurer (5-step wizard).');

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const account = await getAccount(interaction.user.id);
  if (!account) {
    await interaction.reply({
      embeds: [buildErrorEmbed('No account found. Run `/register` first.')],
      ephemeral: true,
    });
    return;
  }
  if (account.adventurer_id) {
    await interaction.reply({
      embeds: [buildErrorEmbed('You already have an adventurer. Use `/status` to view them.')],
      ephemeral: true,
    });
    return;
  }

  // Open Step 1 modal
  const modal = new ModalBuilder()
    .setCustomId('modal:chargen_step1')
    .setTitle('Create Your Adventurer — Step 1');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('name')
        .setLabel('Adventurer Name')
        .setStyle(TextInputStyle.Short)
        .setMinLength(2)
        .setMaxLength(32)
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('str')
        .setLabel('STR (Strength, min 1 max 8)')
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(1)
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('dex')
        .setLabel('DEX (Dexterity, min 1 max 8)')
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(1)
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('int')
        .setLabel('INT (Intelligence, min 1 max 8)')
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(1)
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}
