import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getAccount } from '../../db/store.ts';
import { getAdventurer } from '../../api/adventurer.ts';
import { buildCampEmbed } from '../../embeds/camp.ts';
import { buildRoomEmbed } from '../../embeds/room.ts';
import { buildErrorEmbed } from '../../embeds/error.ts';
import { EMOJI } from '../../constants.ts';
import type { DungeonSession } from '../../index.ts';

export const customIdPrefix = 'dungeon:camp';

// ─── Dispatches camp:back separately ─────────────────────────────────────────

export async function execute(
  interaction: ButtonInteraction,
  dungeonSessions: Map<string, DungeonSession>,
): Promise<void> {
  if (interaction.customId === 'camp:back') {
    return executeBack(interaction, dungeonSessions);
  }

  await interaction.deferUpdate();

  const session = dungeonSessions.get(interaction.user.id);
  if (!session) {
    await interaction.followUp({
      embeds: [buildErrorEmbed('No active dungeon session. Use `/enter` to start.')],
      ephemeral: true,
    });
    return;
  }

  const account = await getAccount(interaction.user.id);
  if (!account) {
    await interaction.followUp({ embeds: [buildErrorEmbed('No account found.')], ephemeral: true });
    return;
  }

  try {
    const adv = await getAdventurer(account.game_token, session.kvAdventurerId);
    const embed = buildCampEmbed(adv, session.lastRoom?.timeTrack);

    // Row 1 — always present
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('camp:heal').setLabel(`${EMOJI.hp} Heal`).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('camp:repair').setLabel('🔧 Repair').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('camp:trade').setLabel(`${EMOJI.gold} Trade`).setStyle(ButtonStyle.Secondary),
    );

    // Row 2 — training + optional witchery
    const row2Buttons: ButtonBuilder[] = [
      new ButtonBuilder().setCustomId('camp:train').setLabel(`${EMOJI.book} Train`).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('camp:empire').setLabel(`${EMOJI.guild} Empire`).setStyle(ButtonStyle.Secondary),
    ];
    const witchPaths = ['Druid', 'Warlock'];
    const hasWitchery =
      witchPaths.includes(adv.path ?? '') ||
      Object.keys((adv.witcheryFormulas as Record<string, unknown>) ?? {}).length > 0;
    if (hasWitchery) {
      row2Buttons.push(
        new ButtonBuilder().setCustomId('camp:witchery').setLabel(`${EMOJI.arcane} Witchery`).setStyle(ButtonStyle.Secondary),
      );
    }
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(...row2Buttons);

    const rows: ActionRowBuilder<ButtonBuilder>[] = [row1, row2];

    // Row 3 — Extra features (always shown for discoverability)
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('camp:beast').setLabel(`${EMOJI.beast} Beast`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('camp:arcanist').setLabel(`${EMOJI.scroll} Arcanist`).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('camp:artisan').setLabel(`${EMOJI.artisan} Artisan`).setStyle(ButtonStyle.Secondary),
      ),
    );

    // Back button
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('camp:back')
          .setLabel('↩️ Continue Delving')
          .setStyle(ButtonStyle.Primary),
      ),
    );

    await interaction.editReply({ embeds: [embed], components: rows });
  } catch (err) {
    await interaction.followUp({
      embeds: [buildErrorEmbed(`Camp failed: ${(err as Error).message}`)],
      ephemeral: true,
    });
  }
}

// ─── Restore room card from stored session state ──────────────────────────────

async function executeBack(
  interaction: ButtonInteraction,
  dungeonSessions: Map<string, DungeonSession>,
): Promise<void> {
  await interaction.deferUpdate();

  const session = dungeonSessions.get(interaction.user.id);
  if (!session?.lastRoom) {
    await interaction.editReply({
      embeds: [buildErrorEmbed('Session data unavailable. Use Move Forward to continue.')],
      components: [],
    });
    return;
  }

  const { lastRoom } = session;
  const embed = buildRoomEmbed(
    {
      roll: lastRoom.roll,
      color: lastRoom.color,
      exits: lastRoom.exits,
      searched: lastRoom.searched,
    },
    lastRoom.narrative,
    lastRoom.timeTrack,
    lastRoom.upkeepMessages,
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('dungeon:move')
      .setLabel(`${EMOJI.move} Move Forward`)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('dungeon:search')
      .setLabel(`${EMOJI.search} Search Room`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(session.roomSearched),
    new ButtonBuilder()
      .setCustomId('dungeon:camp')
      .setLabel(`${EMOJI.camp} Make Camp`)
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}
