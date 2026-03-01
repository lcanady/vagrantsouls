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
  artisanUnlock,
  artisanSalvage,
  artisanCraft,
  artisanConvert,
  artisanStorage,
  artisanTrain,
} from '../../../api/extrarules.ts';
import { buildErrorEmbed } from '../../../embeds/error.ts';
import { COLORS, EMOJI } from '../../../constants.ts';
import type { DungeonSession } from '../../../index.ts';
import type { ArtisanData } from '../../../api/adventurer.ts';

// ─── Button dispatcher ────────────────────────────────────────────────────────

export async function handleButton(
  interaction: ButtonInteraction,
  sessions: Map<string, DungeonSession>,
): Promise<void> {
  const id = interaction.customId;

  if (id === 'camp:artisan') {
    await showArtisanMenu(interaction, sessions);
  } else if (id === 'camp:artisan:unlock') {
    await handleUnlockDirect(interaction, sessions);
  } else if (id === 'camp:artisan:salvage') {
    await showSalvageModal(interaction);
  } else if (id === 'camp:artisan:craft') {
    await showCraftModal(interaction);
  } else if (id === 'camp:artisan:convert') {
    await showConvertModal(interaction);
  } else if (id === 'camp:artisan:storage') {
    await handleStorageDirect(interaction, sessions);
  } else if (id === 'camp:artisan:train') {
    await showArtisanTrainModal(interaction);
  }
}

// ─── Sub-menu ─────────────────────────────────────────────────────────────────

async function showArtisanMenu(
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
    const art = adv.artisan as ArtisanData | null;

    const embed = new EmbedBuilder()
      .setColor(COLORS.ARTISAN)
      .setTitle(`${EMOJI.artisan} Artisan Guild`);

    if (art) {
      const matCount = Object.values(art.materials).reduce((s, v) => s + v, 0);
      embed
        .setDescription('Manage your crafting profession.')
        .addFields(
          { name: '⚒️ Craft', value: `**${art.craftingSkill}**`, inline: true },
          { name: '🪨 Salvage', value: `**${art.salvageSkill}**`, inline: true },
          { name: '🎨 Art', value: `**${art.art}**`, inline: true },
          { name: '📦 Materials', value: `**${matCount}** total`, inline: true },
          { name: '📋 Schematics', value: `**${art.schematics.length}**`, inline: true },
          { name: '🤝 Contacts', value: `**${art.contacts}**`, inline: true },
        );
    } else {
      embed.setDescription('Not yet an Artisan. Unlock the profession to begin!');
    }

    const hasArt = art !== null;

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('camp:artisan:unlock')
        .setLabel('🔓 Unlock')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(hasArt),
      new ButtonBuilder()
        .setCustomId('camp:artisan:salvage')
        .setLabel('🪨 Salvage')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasArt),
      new ButtonBuilder()
        .setCustomId('camp:artisan:craft')
        .setLabel(`${EMOJI.artisan} Craft`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasArt),
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('camp:artisan:convert')
        .setLabel('🔄 Convert')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasArt),
      new ButtonBuilder()
        .setCustomId('camp:artisan:storage')
        .setLabel('🏪 Guild Storage')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasArt),
      new ButtonBuilder()
        .setCustomId('camp:artisan:train')
        .setLabel(`${EMOJI.book} Train`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasArt),
    );

    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('dungeon:camp')
        .setLabel(`${EMOJI.camp} Back`)
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Artisan menu failed: ${(err as Error).message}`)], ephemeral: true });
  }
}

// ─── Modal launchers ──────────────────────────────────────────────────────────

async function showSalvageModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:artisan:salvage:submit')
    .setTitle('Salvage Item');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('itemName')
        .setLabel('Item name to salvage')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. Iron Sword')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('roll')
        .setLabel('Your salvage roll result')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 55')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

async function showCraftModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:artisan:craft:submit')
    .setTitle('Craft Item');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('itemName')
        .setLabel('Item name to craft')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. Iron Shield')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('roll')
        .setLabel('Your crafting roll result')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 30')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

async function showConvertModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:artisan:convert:submit')
    .setTitle('Convert Materials');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('from')
        .setLabel('Convert from (material name)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. Iron')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('to')
        .setLabel('Convert to (material name)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. Steel')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('quantity')
        .setLabel('Quantity to convert')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 3')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

async function showArtisanTrainModal(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('camp:artisan:train:submit')
    .setTitle('Train Artisan Skill');

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('type')
        .setLabel('Skill type: Salvage, Crafting, or Art')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Crafting')
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('contactsUsed')
        .setLabel('Guild contacts to use')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 1')
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

// ─── Direct actions ───────────────────────────────────────────────────────────

async function handleUnlockDirect(
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
    const result = await artisanUnlock(account.game_token, session.kvAdventurerId);

    const embed = new EmbedBuilder()
      .setColor(COLORS.ARTISAN)
      .setTitle(`${EMOJI.artisan} Artisan Unlocked`)
      .setDescription(result.message)
      .addFields({ name: `${EMOJI.gold} Gold`, value: `**${result.gold ?? '—'}**`, inline: true });

    await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Unlock failed: ${(err as Error).message}`)], ephemeral: true });
  }
}

async function handleStorageDirect(
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
    const result = await artisanStorage(account.game_token, session.kvAdventurerId);

    const embed = new EmbedBuilder()
      .setColor(COLORS.ARTISAN)
      .setTitle(`${EMOJI.artisan} Guild Storage`)
      .setDescription(result.message)
      .addFields({ name: `${EMOJI.gold} Gold`, value: `**${result.gold}**`, inline: true });

    await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Storage failed: ${(err as Error).message}`)], ephemeral: true });
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
    if (id === 'camp:artisan:salvage:submit') {
      await processSalvage(interaction, account.game_token, session.kvAdventurerId);
    } else if (id === 'camp:artisan:craft:submit') {
      await processCraft(interaction, account.game_token, session.kvAdventurerId);
    } else if (id === 'camp:artisan:convert:submit') {
      await processConvert(interaction, account.game_token, session.kvAdventurerId);
    } else if (id === 'camp:artisan:train:submit') {
      await processArtisanTrain(interaction, account.game_token, session.kvAdventurerId);
    }
  } catch (err) {
    await interaction.followUp({ embeds: [buildErrorEmbed(`Artisan action failed: ${(err as Error).message}`)], ephemeral: true });
  }
}

async function processSalvage(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const itemName = interaction.fields.getTextInputValue('itemName').trim();
  const roll = parseInt(interaction.fields.getTextInputValue('roll'), 10);

  if (!itemName) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Item name cannot be empty.')], ephemeral: true });
    return;
  }
  if (isNaN(roll)) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Roll must be a number.')], ephemeral: true });
    return;
  }

  const result = await artisanSalvage(token, adventurerId, itemName, roll);
  const matEntries = Object.entries(result.materials)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n') || 'None';

  const embed = new EmbedBuilder()
    .setColor(COLORS.ARTISAN)
    .setTitle(`${EMOJI.artisan} Salvage`)
    .setDescription(result.message)
    .addFields({ name: '📦 Materials', value: matEntries, inline: false });

  if (result.doubled) {
    embed.addFields({ name: EMOJI.star, value: 'Double yield!', inline: true });
  }

  await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
}

async function processCraft(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const itemName = interaction.fields.getTextInputValue('itemName').trim();
  const roll = parseInt(interaction.fields.getTextInputValue('roll'), 10);

  if (!itemName) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Item name cannot be empty.')], ephemeral: true });
    return;
  }
  if (isNaN(roll)) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Roll must be a number.')], ephemeral: true });
    return;
  }

  const result = await artisanCraft(token, adventurerId, itemName, roll);

  const embed = new EmbedBuilder()
    .setColor(result.success ? COLORS.ARTISAN : COLORS.ERROR)
    .setTitle(`${EMOJI.artisan} Craft — ${result.success ? 'Success' : 'Failed'}`)
    .setDescription(result.message);

  if (result.craftedItem) {
    embed.addFields({ name: '🗡️ Crafted', value: `**${result.craftedItem}**`, inline: true });
  }

  await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
}

async function processConvert(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const from = interaction.fields.getTextInputValue('from').trim();
  const to = interaction.fields.getTextInputValue('to').trim();
  const quantity = parseInt(interaction.fields.getTextInputValue('quantity'), 10);

  if (!from || !to) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Material names cannot be empty.')], ephemeral: true });
    return;
  }
  if (isNaN(quantity) || quantity <= 0) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Quantity must be a positive number.')], ephemeral: true });
    return;
  }

  const result = await artisanConvert(token, adventurerId, from, to, quantity);
  const matEntries = Object.entries(result.materials)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n') || 'None';

  const embed = new EmbedBuilder()
    .setColor(COLORS.ARTISAN)
    .setTitle(`${EMOJI.artisan} Convert Materials`)
    .setDescription(result.message)
    .addFields({ name: '📦 Materials', value: matEntries, inline: false });

  await interaction.editReply({ embeds: [embed], components: [buildBackRow()] });
}

async function processArtisanTrain(
  interaction: ModalSubmitInteraction,
  token: string,
  adventurerId: string,
): Promise<void> {
  const typeRaw = interaction.fields.getTextInputValue('type').trim();
  const contactsUsed = parseInt(interaction.fields.getTextInputValue('contactsUsed'), 10);

  const validTypes = ['Salvage', 'Crafting', 'Art'];
  const type = validTypes.find((t) => t.toLowerCase() === typeRaw.toLowerCase());

  if (!type) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Type must be Salvage, Crafting, or Art.')], ephemeral: true });
    return;
  }
  if (isNaN(contactsUsed) || contactsUsed < 0) {
    await interaction.followUp({ embeds: [buildErrorEmbed('Contacts used must be 0 or more.')], ephemeral: true });
    return;
  }

  const result = await artisanTrain(token, adventurerId, type as 'Salvage' | 'Crafting' | 'Art', contactsUsed);

  const embed = new EmbedBuilder()
    .setColor(COLORS.ARTISAN)
    .setTitle(`${EMOJI.artisan} Artisan Trained`)
    .setDescription(result.message)
    .addFields({ name: `${EMOJI.gold} Gold`, value: `**${result.gold ?? '—'}**`, inline: true });

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
