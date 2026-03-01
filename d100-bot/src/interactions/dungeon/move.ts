import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getAccount } from '../../db/store.ts';
import { dungeonMove } from '../../api/dungeon.ts';
import { buildRoomEmbed } from '../../embeds/room.ts';
import { buildErrorEmbed } from '../../embeds/error.ts';
import { EMOJI } from '../../constants.ts';
import type { DungeonSession } from '../../index.ts';

export const customIdPrefix = 'dungeon:move';

export async function execute(
  interaction: ButtonInteraction,
  dungeonSessions: Map<string, DungeonSession>,
): Promise<void> {
  await interaction.deferUpdate();

  const session = dungeonSessions.get(interaction.user.id);
  if (!session) {
    await interaction.followUp({
      embeds: [buildErrorEmbed('No active dungeon session. Use `/enter` to start.')],
      ephemeral: true,
    });
    return;
  }
  if (session.inCombat) {
    await interaction.followUp({
      embeds: [buildErrorEmbed('You are in combat! Resolve the fight first.')],
      ephemeral: true,
    });
    return;
  }

  const account = await getAccount(interaction.user.id);
  if (!account) {
    await interaction.followUp({
      embeds: [buildErrorEmbed('No account found.')],
      ephemeral: true,
    });
    return;
  }

  try {
    const roomState = await dungeonMove(account.game_token, session.kvAdventurerId);

    session.roomSearched = roomState.room.searched;
    session.lastRoom = {
      roll: roomState.roll,
      color: roomState.room.color,
      exits: roomState.room.exits,
      searched: roomState.room.searched,
      narrative: roomState.narrative ?? 'You move to the next room...',
      timeTrack: roomState.timeTrack,
      upkeepMessages: roomState.upkeepReport?.messages,
    };

    const embed = buildRoomEmbed(
      roomState.room,
      roomState.narrative ?? 'You move to the next room...',
      roomState.timeTrack,
      roomState.upkeepReport?.messages,
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
  } catch (err) {
    await interaction.followUp({
      embeds: [buildErrorEmbed(`Move failed: ${(err as Error).message}`)],
      ephemeral: true,
    });
  }
}
