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
import { downtimeSell, downtimeBuyNeeded, downtimeSearchMarket } from '../../../api/downtime.ts';
import { buildErrorEmbed } from '../../../embeds/error.ts';
import { COLORS, EMOJI } from '../../../constants.ts';
import type { DungeonSession } from '../../../index.ts';

// ─── camp:trade — show sub-menu ───────────────────────────────────────────────

export async function handleButton(
  interaction: ButtonInteraction,
  _sessions: Map<string, DungeonSession>,
): Promise<void> {
  if (interaction.customId === 'camp:trade') {
    await showTradeMenu(interaction);
    return;
  }

  // Sub-actions that open modals
  if (interaction.customId === 'camp:trade:sell') {
    await showSellModal(interaction);
  } else if (interaction.customId === 'camp:trade:buy') {
    await showBuyModal(interaction);
  } else if (interaction.customId === 'camp:trade:market') {
    await showMarketModal(interaction);
  }
}

async function showTradeMenu(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferUpdate();

  const embed = new EmbedBuilder()
    .setColor(COLORS.DEFAULT)
    .setTitle(`${EMOJI.gold} Trade`)
    .setDescription('Buy, sell, or search the market. What would you like to do?');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('camp:trade:sell')
      .setLabel(`${EMOJI.gold} Sell Item`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('camp:trade:buy')
      .setLabel('🛒 Buy Item')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('camp:trade:market')
      .setLabel(`${EMOJI.search} Search Market`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('dungeon:camp')
      .setLabel(`${EMOJI.camp} Back`)
      .setStyle(ButtonStyle.Primary),
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

async function showSellModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:trade:sell:submit')
    .setTitle('Sell Item');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('itemId')
        .setLabel('Item ID to sell (check /status)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. sword-01')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

async function showBuyModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:trade:buy:submit')
    .setTitle('Buy Item');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('itemName')
        .setLabel('Item name to buy')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. Torch')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

async function showMarketModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:trade:market:submit')
    .setTitle('Search Market');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('table')
        .setLabel('Table: A (armour/weapons) or W (misc)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('A')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('roll')
        .setLabel('Your d100 roll result')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 42')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

// ─── Modal submit handlers ────────────────────────────────────────────────────

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

  const id = interaction.customId;

  try {
    if (id === 'camp:trade:sell:submit') {
      await handleSell(interaction, account.game_token, session.kvAdventurerId);
    } else if (id === 'camp:trade:buy:submit') {
      await handleBuy(interaction, account.game_token, session.kvAdventurerId);
    } else if (id === 'camp:trade:market:submit') {
      await handleMarket(interaction, account.game_token, session.kvAdventurerId);
    }
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Trade failed: ${(err as Error).message}`)], ephemeral: true });
  }
}

async function handleSell(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const itemId = interaction.fields.getTextInputValue('itemId').trim();
  if (!itemId) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Item ID cannot be empty.')], ephemeral: true });
    return;
  }

  const result = await downtimeSell(token, adventurerId, itemId);

  const embed = new EmbedBuilder()
    .setColor(COLORS.DEFAULT)
    .setTitle(`${EMOJI.gold} Sold`)
    .setDescription(result.message)
    .addFields({ name: `${EMOJI.gold} Gold`, value: `**${result.state.gold}**`, inline: true });

  await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
}

async function handleBuy(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const itemName = interaction.fields.getTextInputValue('itemName').trim();
  if (!itemName) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Item name cannot be empty.')], ephemeral: true });
    return;
  }

  const result = await downtimeBuyNeeded(token, adventurerId, itemName);

  const embed = new EmbedBuilder()
    .setColor(COLORS.DEFAULT)
    .setTitle('🛒 Purchased')
    .setDescription(result.message)
    .addFields({ name: `${EMOJI.gold} Gold`, value: `**${result.state.gold}**`, inline: true });

  await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
}

async function handleMarket(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const tableRaw = interaction.fields.getTextInputValue('table').trim().toUpperCase();
  const roll = parseInt(interaction.fields.getTextInputValue('roll'), 10);

  if (tableRaw !== 'A' && tableRaw !== 'W') {
    await interaction.followUp({ embeds: [buildErrorEmbed('Table must be A or W.')], ephemeral: true });
    return;
  }
  if (isNaN(roll) || roll < 1 || roll > 100) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Roll must be 1–100.')], ephemeral: true });
    return;
  }

  const result = await downtimeSearchMarket(token, adventurerId, tableRaw as 'A' | 'W', roll);

  const embed = new EmbedBuilder()
    .setColor(COLORS.DEFAULT)
    .setTitle(`${EMOJI.search} Market — Table ${tableRaw}`)
    .setDescription(result.message)
    .addFields({ name: `${EMOJI.gold} Gold`, value: `**${result.state.gold}**`, inline: true });

  await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
}

function buildBackRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('dungeon:camp')
      .setLabel(`${EMOJI.camp} Back to Camp`)
      .setStyle(ButtonStyle.Secondary),
  );
}
