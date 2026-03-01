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
import { downtimeEmpire } from '../../../api/downtime.ts';
import { buildErrorEmbed } from '../../../embeds/error.ts';
import { COLORS, EMOJI } from '../../../constants.ts';
import type { DungeonSession } from '../../../index.ts';

export async function handleButton(
  interaction: ButtonInteraction,
  _sessions: Map<string, DungeonSession>,
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:empire:submit')
    .setTitle('Empire Building');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('type')
        .setLabel('Investment type (e.g. Shop, Farm, Inn)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Shop')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('amount')
        .setLabel('Gold to invest')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 50')
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

  const type = interaction.fields.getTextInputValue('type').trim();
  const amount = parseInt(interaction.fields.getTextInputValue('amount'), 10);

  if (!type) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Investment type cannot be empty.')], ephemeral: true });
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Enter a valid gold amount.')], ephemeral: true });
    return;
  }

  try {
    const result = await downtimeEmpire(account.game_token, session.kvAdventurerId, { [type]: amount });

    const embed = new EmbedBuilder()
      .setColor(COLORS.NAVY)
      .setTitle(`${EMOJI.guild} Empire Building`)
      .setDescription(result.message)
      .addFields(
        { name: `${EMOJI.gold} Gold`, value: `**${result.state.gold}**`, inline: true },
      );

    await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Empire failed: ${(err as Error).message}`)], ephemeral: true });
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
