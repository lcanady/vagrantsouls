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
  arcanistBecome,
  arcanistLearn,
  arcanistDonate,
  arcanistConceal,
  arcanistPrism,
} from '../../../api/extrarules.ts';
import { buildErrorEmbed } from '../../../embeds/error.ts';
import { COLORS, EMOJI } from '../../../constants.ts';
import type { DungeonSession } from '../../../index.ts';
import type { ArcanistData } from '../../../api/adventurer.ts';

// ─── Button dispatcher ────────────────────────────────────────────────────────

export async function handleButton(
  interaction: ButtonInteraction,
  sessions: Map<string, DungeonSession>,
): Promise<void> {
  const id = interaction.customId;

  if (id === 'camp:arcanist') {
    await showArcanistMenu(interaction, sessions);
  } else if (id === 'camp:arcanist:become') {
    await showBecomeModal(interaction);
  } else if (id === 'camp:arcanist:learn') {
    await showLearnModal(interaction);
  } else if (id === 'camp:arcanist:donate') {
    await handleDonateDirect(interaction, sessions);
  } else if (id === 'camp:arcanist:conceal') {
    await showConcealModal(interaction);
  } else if (id === 'camp:arcanist:prism') {
    await showPrismModal(interaction);
  }
}

// ─── Sub-menu ─────────────────────────────────────────────────────────────────

async function showArcanistMenu(
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
    const arc = adv.arcanist as ArcanistData | null;

    const embed = new EmbedBuilder()
      .setColor(COLORS.ARCANE)
      .setTitle(`${EMOJI.scroll} Arcanist`);

    if (arc) {
      embed
        .setDescription(`**${arc.order}** — ${arc.rank}`)
        .addFields(
          { name: '📜 Spells', value: `**${arc.arcanistSpells.length}** known`, inline: true },
          { name: '🏛️ Donations', value: `**${arc.donations}**`, inline: true },
          { name: `${EMOJI.warn} Law Broken`, value: `**${arc.arcaneLawBroken}x**`, inline: true },
        );
    } else {
      embed.setDescription('Not yet an Arcanist. Join an order to begin!');
    }

    const hasArc = arc !== null;

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('camp:arcanist:become')
        .setLabel('🏛️ Join Order')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(hasArc),
      new ButtonBuilder()
        .setCustomId('camp:arcanist:learn')
        .setLabel(`${EMOJI.scroll} Learn Spell`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasArc),
      new ButtonBuilder()
        .setCustomId('camp:arcanist:donate')
        .setLabel(`${EMOJI.gold} Donate`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasArc),
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('camp:arcanist:conceal')
        .setLabel('🕵️ Conceal')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasArc),
      new ButtonBuilder()
        .setCustomId('camp:arcanist:prism')
        .setLabel('🔺 Arcane Prism')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!hasArc),
      new ButtonBuilder()
        .setCustomId('dungeon:camp')
        .setLabel(`${EMOJI.camp} Back`)
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.editReply({ embeds: [embed], components: [row1, row2] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Arcanist menu failed: ${(err as Error).message}`)], ephemeral: true });
  }
}

// ─── Modal launchers ──────────────────────────────────────────────────────────

async function showBecomeModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:arcanist:become:submit')
    .setTitle('Join an Arcane Order');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('order')
        .setLabel('Order name (SA1–SA6)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('SA1')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

async function showLearnModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:arcanist:learn:submit')
    .setTitle('Learn a Spell');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('spellTableRoll')
        .setLabel('Spell table roll (d6)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 3')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

async function showConcealModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:arcanist:conceal:submit')
    .setTitle('Conceal Arcane Law');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('roll')
        .setLabel('Concealment roll result')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 12')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

async function showPrismModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:arcanist:prism:submit')
    .setTitle('Arcane Prism Trial');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('strRoll')
        .setLabel('STR roll result')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 8')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('dexRoll')
        .setLabel('DEX roll result')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 5')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('intRoll')
        .setLabel('INT roll result')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 10')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

// ─── Direct action ────────────────────────────────────────────────────────────

async function handleDonateDirect(
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
    const result = await arcanistDonate(account.game_token, session.kvAdventurerId);

    const embed = new EmbedBuilder()
      .setColor(COLORS.ARCANE)
      .setTitle(`${EMOJI.scroll} Donation Made`)
      .setDescription(result.message)
      .addFields({ name: `${EMOJI.gold} Gold`, value: `**${result.gold}**`, inline: true });

    if (result.arcaneLawBroken) {
      embed.addFields({ name: `${EMOJI.warn} Warning`, value: 'Arcane Law breached!', inline: true });
    }

    await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Donate failed: ${(err as Error).message}`)], ephemeral: true });
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
    if (id === 'camp:arcanist:become:submit') {
      await processBecome(interaction, account.game_token, session.kvAdventurerId);
    } else if (id === 'camp:arcanist:learn:submit') {
      await processLearn(interaction, account.game_token, session.kvAdventurerId);
    } else if (id === 'camp:arcanist:conceal:submit') {
      await processConceal(interaction, account.game_token, session.kvAdventurerId);
    } else if (id === 'camp:arcanist:prism:submit') {
      await processPrism(interaction, account.game_token, session.kvAdventurerId);
    }
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Arcanist action failed: ${(err as Error).message}`)], ephemeral: true });
  }
}

async function processBecome(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const order = interaction.fields.getTextInputValue('order').trim();
  if (!order) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Order name cannot be empty.')], ephemeral: true });
    return;
  }

  const result = await arcanistBecome(token, adventurerId, order);
  const arc = result.arcanist;

  const embed = new EmbedBuilder()
    .setColor(COLORS.ARCANE)
    .setTitle(`${EMOJI.scroll} Joined ${arc.order}`)
    .setDescription(result.message)
    .addFields({ name: '🏛️ Rank', value: `**${arc.rank}**`, inline: true });

  await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
}

async function processLearn(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const roll = parseInt(interaction.fields.getTextInputValue('spellTableRoll'), 10);
  if (isNaN(roll)) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Roll must be a number.')], ephemeral: true });
    return;
  }

  const result = await arcanistLearn(token, adventurerId, roll);
  const arc = result.arcanist;

  const embed = new EmbedBuilder()
    .setColor(COLORS.ARCANE)
    .setTitle(`${EMOJI.scroll} Spell Learned`)
    .setDescription(result.message)
    .addFields({ name: '📜 Spells Known', value: `**${arc.arcanistSpells.length}**`, inline: true });

  await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
}

async function processConceal(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const roll = parseInt(interaction.fields.getTextInputValue('roll'), 10);
  if (isNaN(roll)) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Roll must be a number.')], ephemeral: true });
    return;
  }

  const result = await arcanistConceal(token, adventurerId, roll);

  const embed = new EmbedBuilder()
    .setColor(COLORS.ARCANE)
    .setTitle(`${EMOJI.scroll} Concealment`)
    .setDescription(result.concealed ? 'Arcane Law successfully concealed.' : 'Concealment failed.')
    .addFields(
      { name: `${EMOJI.check} Concealed`, value: result.concealed ? 'Yes' : 'No', inline: true },
      { name: '🔺 Sent to Prism', value: result.sentToPrism ? 'Yes' : 'No', inline: true },
    );

  await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
}

async function processPrism(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const strRoll = parseInt(interaction.fields.getTextInputValue('strRoll'), 10);
  const dexRoll = parseInt(interaction.fields.getTextInputValue('dexRoll'), 10);
  const intRoll = parseInt(interaction.fields.getTextInputValue('intRoll'), 10);

  if (isNaN(strRoll) || isNaN(dexRoll) || isNaN(intRoll)) {
    await interaction.followUp({ embeds: [buildErrorEmbed('All roll values must be numbers.')], ephemeral: true });
    return;
  }

  const result = await arcanistPrism(token, adventurerId, strRoll, dexRoll, intRoll);

  const embed = new EmbedBuilder()
    .setColor(result.survived ? COLORS.ARCANE : COLORS.DEATH)
    .setTitle(`🔺 Arcane Prism — ${result.survived ? 'Survived' : 'Perished'}`)
    .setDescription(result.message);

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
