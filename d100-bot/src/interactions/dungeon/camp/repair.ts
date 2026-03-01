import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { getAccount } from '../../../db/store.ts';
import { downtimeRepair } from '../../../api/downtime.ts';
import { buildErrorEmbed } from '../../../embeds/error.ts';
import { COLORS, EMOJI } from '../../../constants.ts';
import type { DungeonSession } from '../../../index.ts';

export async function handleButton(
  interaction: ButtonInteraction,
  _sessions: Map<string, DungeonSession>,
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:repair:submit')
    .setTitle('Repair Item at Camp');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('itemId')
        .setLabel('Item ID (check /status for IDs)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. sword-01')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('pips')
        .setLabel('Repair pips to spend')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 2')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

export async function handleModal(
  interaction: ModalSubmitInteraction,
  sessions: Map<string, DungeonSession>,
): Promise<void> {
  await interaction.deferUpdate();

  const session = sessions.get(interaction.user.id);
  if (!session) {
    await interaction.followUp({ embeds: [buildErrorEmbed('No active dungeon session.')], ephemeral: true });
    return;
  }

  const account = await getAccount(interaction.user.id);
  if (!account) {
    await interaction.followUp({ embeds: [buildErrorEmbed('No account found.')], ephemeral: true });
    return;
  }

  const itemId = interaction.fields.getTextInputValue('itemId').trim();
  const pips = parseInt(interaction.fields.getTextInputValue('pips'), 10);

  if (!itemId) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Item ID cannot be empty.')], ephemeral: true });
    return;
  }
  if (isNaN(pips) || pips <= 0) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Enter a valid positive number for pips.')], ephemeral: true });
    return;
  }

  try {
    const result = await downtimeRepair(account.game_token, session.kvAdventurerId, itemId, pips);

    const embed = new EmbedBuilder()
      .setColor(COLORS.ARTISAN)
      .setTitle('🔧 Repair')
      .setDescription(result.message)
      .addFields(
        { name: `${EMOJI.gold} Gold`, value: `**${result.state.gold}**`, inline: true },
      );

    await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Repair failed: ${(err as Error).message}`)], ephemeral: true });
  }
}

function buildBackRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('dungeon:camp')
      .setLabel(`${EMOJI.camp} Back to Camp`)
      .setStyle(ButtonStyle.Secondary),
  );
}
