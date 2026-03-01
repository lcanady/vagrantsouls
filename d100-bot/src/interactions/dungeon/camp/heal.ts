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
import { downtimeHeal } from '../../../api/downtime.ts';
import { buildErrorEmbed } from '../../../embeds/error.ts';
import { COLORS, EMOJI } from '../../../constants.ts';
import type { DungeonSession } from '../../../index.ts';

export async function handleButton(
  interaction: ButtonInteraction,
  _sessions: Map<string, DungeonSession>,
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:heal:submit')
    .setTitle('Heal at Camp');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('amount')
        .setLabel('HP to heal (costs food)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 5')
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

  const amount = parseInt(interaction.fields.getTextInputValue('amount'), 10);
  if (isNaN(amount) || amount <= 0) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Enter a valid positive number.')], ephemeral: true });
    return;
  }

  try {
    const result = await downtimeHeal(account.game_token, session.kvAdventurerId, amount);

    const embed = new EmbedBuilder()
      .setColor(COLORS.DOWNTIME)
      .setTitle(`${EMOJI.hp} Heal`)
      .setDescription(result.message)
      .addFields(
        { name: `${EMOJI.hp} HP`, value: `**${result.state.hp}/${result.state.maxHp}**`, inline: true },
        { name: `${EMOJI.food} Food`, value: `**${result.state.food ?? 0}**`, inline: true },
      );

    await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Heal failed: ${(err as Error).message}`)], ephemeral: true });
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
