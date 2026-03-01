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
import { getAdventurer } from '../../../api/adventurer.ts';
import {
  beastBuy,
  beastTame,
  beastTrain,
  beastSell,
  beastResurrect,
} from '../../../api/extrarules.ts';
import { buildErrorEmbed } from '../../../embeds/error.ts';
import { COLORS, EMOJI } from '../../../constants.ts';
import type { DungeonSession } from '../../../index.ts';
import type { BeastData } from '../../../api/adventurer.ts';

// ─── Button dispatcher ────────────────────────────────────────────────────────

export async function handleButton(
  interaction: ButtonInteraction,
  sessions: Map<string, DungeonSession>,
): Promise<void> {
  const id = interaction.customId;

  if (id === 'camp:beast') {
    await showBeastMenu(interaction, sessions);
  } else if (id === 'camp:beast:buy') {
    await showBuyModal(interaction);
  } else if (id === 'camp:beast:tame') {
    await showTameModal(interaction);
  } else if (id === 'camp:beast:train') {
    await showTrainModal(interaction);
  } else if (id === 'camp:beast:sell') {
    await handleSellDirect(interaction, sessions);
  } else if (id === 'camp:beast:resurrect') {
    await handleResurrectDirect(interaction, sessions);
  }
}

// ─── Sub-menu ─────────────────────────────────────────────────────────────────

async function showBeastMenu(
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
    const adv = await getAdventurer(account.game_token, session.kvAdventurerId);
    const beast = adv.beast as BeastData | null;

    const embed = new EmbedBuilder()
      .setColor(COLORS.DOWNTIME)
      .setTitle(`${EMOJI.beast} Beast Companion`);

    if (beast) {
      embed
        .setDescription(`**${beast.name}** — Lv.${beast.level}`)
        .addFields(
          { name: `${EMOJI.hp} HP`, value: `**${beast.currentHp}/${beast.hp}**`, inline: true },
          { name: '🎓 Training', value: `**${beast.trainingPips} pips**`, inline: true },
          { name: '🤝 Cooperative', value: beast.isCooperative ? 'Yes' : 'No', inline: true },
        );
    } else {
      embed.setDescription('No beast companion. Buy or tame one!');
    }

    const hasBeast = beast !== null;
    const isDead = hasBeast && beast!.currentHp <= 0;

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('camp:beast:buy')
        .setLabel(`${EMOJI.gold} Buy Beast`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(hasBeast),
      new ButtonBuilder()
        .setCustomId('camp:beast:tame')
        .setLabel('🪢 Tame Monster')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(hasBeast),
      new ButtonBuilder()
        .setCustomId('camp:beast:train')
        .setLabel(`${EMOJI.book} Train Beast`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasBeast || isDead),
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('camp:beast:sell')
        .setLabel(`${EMOJI.gold} Sell Beast`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasBeast),
      new ButtonBuilder()
        .setCustomId('camp:beast:resurrect')
        .setLabel('💀 Resurrect')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!isDead),
      new ButtonBuilder()
        .setCustomId('dungeon:camp')
        .setLabel(`${EMOJI.camp} Back`)
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.editReply({ embeds: [embed], components: [row1, row2] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Beast menu failed: ${(err as Error).message}`)], ephemeral: true });
  }
}

// ─── Modal launchers ──────────────────────────────────────────────────────────

async function showBuyModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:beast:buy:submit')
    .setTitle('Buy a Beast');

  modal.addComponents(
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

async function showTameModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:beast:tame:submit')
    .setTitle('Tame a Monster');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('monsterName')
        .setLabel('Monster name to tame')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. Wolf')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('roll')
        .setLabel('Your tame roll result')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 15')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

async function showTrainModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:beast:train:submit')
    .setTitle('Train Your Beast');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('roll')
        .setLabel('Your training roll result')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 8')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

// ─── Direct actions (no modal) ────────────────────────────────────────────────

async function handleSellDirect(
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
    const result = await beastSell(account.game_token, session.kvAdventurerId);

    const embed = new EmbedBuilder()
      .setColor(COLORS.DOWNTIME)
      .setTitle(`${EMOJI.beast} Beast Sold`)
      .setDescription(`Beast sold for **${result.goldGained}** gold.`)
      .addFields({ name: `${EMOJI.gold} Gold`, value: `**${result.gold}**`, inline: true });

    await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Sell failed: ${(err as Error).message}`)], ephemeral: true });
  }
}

async function handleResurrectDirect(
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
    const result = await beastResurrect(account.game_token, session.kvAdventurerId);
    const beast = result.beast;

    const embed = new EmbedBuilder()
      .setColor(COLORS.DOWNTIME)
      .setTitle(`${EMOJI.beast} Beast Resurrected`)
      .setDescription(result.message)
      .addFields(
        { name: `${EMOJI.hp} HP`, value: `**${beast.currentHp}/${beast.hp}**`, inline: true },
      );

    await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Resurrect failed: ${(err as Error).message}`)], ephemeral: true });
  }
}

// ─── Modal submit handler ─────────────────────────────────────────────────────

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
    if (id === 'camp:beast:buy:submit') {
      await processBuy(interaction, account.game_token, session.kvAdventurerId);
    } else if (id === 'camp:beast:tame:submit') {
      await processTame(interaction, account.game_token, session.kvAdventurerId);
    } else if (id === 'camp:beast:train:submit') {
      await processTrain(interaction, account.game_token, session.kvAdventurerId);
    }
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Beast action failed: ${(err as Error).message}`)], ephemeral: true });
  }
}

async function processBuy(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const roll = parseInt(interaction.fields.getTextInputValue('roll'), 10);
  if (isNaN(roll) || roll < 1 || roll > 100) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Roll must be 1–100.')], ephemeral: true });
    return;
  }

  const result = await beastBuy(token, adventurerId, roll);
  const beast = result.beast;

  const embed = new EmbedBuilder()
    .setColor(COLORS.DOWNTIME)
    .setTitle(`${EMOJI.beast} Beast Acquired`)
    .setDescription(result.message)
    .addFields(
      { name: '🐾 Name', value: `**${beast.name}**`, inline: true },
      { name: `${EMOJI.hp} HP`, value: `**${beast.hp}**`, inline: true },
      { name: '⚔️ Bonus', value: `**+${beast.bonus}**`, inline: true },
    );

  await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
}

async function processTame(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const monsterName = interaction.fields.getTextInputValue('monsterName').trim();
  const roll = parseInt(interaction.fields.getTextInputValue('roll'), 10);

  if (!monsterName) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Monster name cannot be empty.')], ephemeral: true });
    return;
  }
  if (isNaN(roll)) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Roll must be a number.')], ephemeral: true });
    return;
  }

  const result = await beastTame(token, adventurerId, monsterName, roll);
  const beast = result.beast;

  const embed = new EmbedBuilder()
    .setColor(COLORS.DOWNTIME)
    .setTitle(`${EMOJI.beast} Monster Tamed`)
    .setDescription(result.message)
    .addFields(
      { name: '🐾 Name', value: `**${beast.name}**`, inline: true },
      { name: `${EMOJI.hp} HP`, value: `**${beast.hp}**`, inline: true },
    );

  if (result.extraDamageDice) {
    embed.addFields({ name: '🎲 Extra Damage', value: result.extraDamageDice, inline: true });
  }

  await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
}

async function processTrain(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const roll = parseInt(interaction.fields.getTextInputValue('roll'), 10);
  if (isNaN(roll)) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Roll must be a number.')], ephemeral: true });
    return;
  }

  const result = await beastTrain(token, adventurerId, roll);
  const beast = result.beast;

  const embed = new EmbedBuilder()
    .setColor(COLORS.DOWNTIME)
    .setTitle(`${EMOJI.beast} Beast Trained`)
    .setDescription(result.message)
    .addFields(
      { name: '🎓 Pips', value: `**${beast.trainingPips}**`, inline: true },
      { name: '📈 Level', value: `**${beast.level}**`, inline: true },
    );

  if (result.leveledUp) {
    embed.addFields({ name: EMOJI.star, value: '**Leveled up!**', inline: true });
  }

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
