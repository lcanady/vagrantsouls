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
import { downtimeTrain } from '../../../api/downtime.ts';
import { buildErrorEmbed } from '../../../embeds/error.ts';
import { COLORS, EMOJI } from '../../../constants.ts';
import type { DungeonSession } from '../../../index.ts';

export async function handleButton(
  interaction: ButtonInteraction,
  _sessions: Map<string, DungeonSession>,
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:train:submit')
    .setTitle('Train at Camp');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('target')
        .setLabel('Stat or skill to train (e.g. STR, DEX)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('STR')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('pips')
        .setLabel('Training pips to spend')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('1')
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

  const target = interaction.fields.getTextInputValue('target').trim();
  const pips = parseInt(interaction.fields.getTextInputValue('pips'), 10);

  if (!target) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Target cannot be empty.')], ephemeral: true });
    return;
  }
  if (isNaN(pips) || pips <= 0) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Enter a valid positive number for pips.')], ephemeral: true });
    return;
  }

  try {
    const result = await downtimeTrain(account.game_token, session.kvAdventurerId, target, pips);

    const embed = new EmbedBuilder()
      .setColor(COLORS.DOWNTIME)
      .setTitle(`${EMOJI.book} Train`)
      .setDescription(result.message)
      .addFields(
        { name: `${EMOJI.gold} Gold`, value: `**${result.state.gold}**`, inline: true },
      );

    await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Train failed: ${(err as Error).message}`)], ephemeral: true });
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
