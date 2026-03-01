import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getAccount } from '../db/store.ts';
import { createParty } from '../api/party.ts';
import { dungeonMove } from '../api/dungeon.ts';
import { buildRoomEmbed } from '../embeds/room.ts';
import { buildErrorEmbed } from '../embeds/error.ts';
import { EMOJI } from '../constants.ts';
import type { DungeonSession } from '../index.ts';

export const data = new SlashCommandBuilder()
  .setName('enter')
  .setDescription('Enter the dungeon and begin your quest.');

export async function execute(
  interaction: ChatInputCommandInteraction,
  dungeonSessions: Map<string, DungeonSession>,
): Promise<void> {
  await interaction.deferReply({ ephemeral: false });

  const account = await getAccount(interaction.user.id);
  if (!account) {
    await interaction.editReply({
      embeds: [buildErrorEmbed('No account found. Run `/register` first.')],
    });
    return;
  }
  if (!account.adventurer_id) {
    await interaction.editReply({
      embeds: [buildErrorEmbed('No adventurer yet. Run `/create` first!')],
    });
    return;
  }

  // Check if already in dungeon
  if (dungeonSessions.has(interaction.user.id)) {
    await interaction.editReply({
      embeds: [buildErrorEmbed('You are already in the dungeon! Use the buttons to continue.')],
    });
    return;
  }

  try {
    // Create a solo party
    const party = await createParty(account.game_token);

    // Move into first room
    const roomState = await dungeonMove(account.game_token, account.adventurer_id);

    const embed = buildRoomEmbed(
      roomState.room,
      roomState.narrative ?? 'You step into the dungeon...',
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
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('dungeon:camp')
        .setLabel(`${EMOJI.camp} Make Camp`)
        .setStyle(ButtonStyle.Secondary),
    );

    const msg = await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    // Store session
    dungeonSessions.set(interaction.user.id, {
      adventurerId: account.adventurer_id,
      kvAdventurerId: account.adventurer_id,
      stateAdventurerId: party.leaderId,
      partyId: party.id,
      messageId: msg.id,
      channelId: interaction.channelId,
      roomSearched: roomState.room.searched,
      inCombat: false,
      beastAbilityUses: 0,
      lastRoom: {
        roll: roomState.roll,
        color: roomState.room.color,
        exits: roomState.room.exits,
        searched: roomState.room.searched,
        narrative: roomState.narrative ?? 'You step into the dungeon...',
        timeTrack: roomState.timeTrack,
        upkeepMessages: roomState.upkeepReport?.messages,
      },
    });
  } catch (err) {
    await interaction.editReply({
      embeds: [buildErrorEmbed(`Failed to enter dungeon: ${(err as Error).message}`)],
    });
  }
}
