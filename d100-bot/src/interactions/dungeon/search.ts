import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getAccount } from '../../db/store.ts';
import { dungeonSearch } from '../../api/dungeon.ts';
import { buildSearchEmbed } from '../../embeds/room.ts';
import { buildErrorEmbed } from '../../embeds/error.ts';
import { EMOJI } from '../../constants.ts';
import type { DungeonSession } from '../../index.ts';

export const customIdPrefix = 'dungeon:search';

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
  if (session.roomSearched) {
    await interaction.followUp({
      embeds: [buildErrorEmbed('You have already searched this room.')],
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
    const result = await dungeonSearch(account.game_token, session.kvAdventurerId);
    session.roomSearched = true;

    const embed = buildSearchEmbed(result.find?.name ?? 'Nothing', result.find?.value, result.narrative);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('dungeon:move')
        .setLabel(`${EMOJI.move} Move Forward`)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('dungeon:search')
        .setLabel(`${EMOJI.search} Search Room`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('dungeon:camp')
        .setLabel(`${EMOJI.camp} Make Camp`)
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (err) {
    await interaction.followUp({
      embeds: [buildErrorEmbed(`Search failed: ${(err as Error).message}`)],
      ephemeral: true,
    });
  }
}
