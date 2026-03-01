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
import { downtimeWitchery, downtimeWitcheryClear } from '../../../api/downtime.ts';
import { buildErrorEmbed } from '../../../embeds/error.ts';
import { COLORS, EMOJI } from '../../../constants.ts';
import type { DungeonSession } from '../../../index.ts';

export async function handleButton(
  interaction: ButtonInteraction,
  _sessions: Map<string, DungeonSession>,
): Promise<void> {
  if (interaction.customId === 'camp:witchery') {
    await showWitcheryMenu(interaction);
    return;
  }

  if (interaction.customId === 'camp:witchery:brew') {
    await showBrewModal(interaction);
  } else if (interaction.customId === 'camp:witchery:clear') {
    // handled separately in handleClearButton for access to sessions
  }
}

async function showWitcheryMenu(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferUpdate();

  const embed = new EmbedBuilder()
    .setColor(COLORS.MAGIC)
    .setTitle(`${EMOJI.arcane} Witchery`)
    .setDescription('Brew a formula from three ingredients, or clear active effects.');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('camp:witchery:brew')
      .setLabel(`${EMOJI.arcane} Brew Formula`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('camp:witchery:clear')
      .setLabel('🌀 Clear Effects')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('dungeon:camp')
      .setLabel(`${EMOJI.camp} Back`)
      .setStyle(ButtonStyle.Primary),
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

async function showBrewModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:witchery:brew:submit')
    .setTitle('Brew Witchery Formula');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('part1')
        .setLabel('Formula part 1')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. Nightshade')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('part2')
        .setLabel('Formula part 2')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. Moonwater')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('part3')
        .setLabel('Formula part 3')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. Bone Ash')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('roll')
        .setLabel('Your brew roll (d10)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 7')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('tableRoll')
        .setLabel('Table roll (d10)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 3')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

export async function handleClearButton(
  interaction: ButtonInteraction,
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

  try {
    const result = await downtimeWitcheryClear(account.game_token, session.kvAdventurerId);

    const embed = new EmbedBuilder()
      .setColor(COLORS.MAGIC)
      .setTitle(`${EMOJI.arcane} Witchery — Effects Cleared`)
      .setDescription(result.message);

    await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Clear failed: ${(err as Error).message}`)], ephemeral: true });
  }
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

  const part1 = interaction.fields.getTextInputValue('part1').trim();
  const part2 = interaction.fields.getTextInputValue('part2').trim();
  const part3 = interaction.fields.getTextInputValue('part3').trim();
  const roll = parseInt(interaction.fields.getTextInputValue('roll'), 10);
  const tableRoll = parseInt(interaction.fields.getTextInputValue('tableRoll'), 10);

  if (!part1 || !part2 || !part3) {
    await interaction.followUp({ embeds: [buildErrorEmbed('All three formula parts are required.')], ephemeral: true });
    return;
  }
  if (isNaN(roll) || isNaN(tableRoll)) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Roll values must be numbers.')], ephemeral: true });
    return;
  }

  try {
    const result = await downtimeWitchery(
      account.game_token,
      session.kvAdventurerId,
      [part1, part2, part3],
      roll,
      tableRoll,
    );

    const resultData = result.result as Record<string, unknown>;
    const description = (resultData.message as string) ?? 'The formula takes effect.';

    const embed = new EmbedBuilder()
      .setColor(COLORS.MAGIC)
      .setTitle(`${EMOJI.arcane} Witchery`)
      .setDescription(description)
      .addFields(
        { name: `${EMOJI.hp} HP`, value: `**${result.state.hp}/${result.state.maxHp}**`, inline: true },
      );

    await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Witchery failed: ${(err as Error).message}`)], ephemeral: true });
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
