import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getAccount } from '../../db/store.ts';
import { combatFlee } from '../../api/combat.ts';
import { buildCombatResultEmbed } from '../../embeds/combat.ts';
import { buildErrorEmbed } from '../../embeds/error.ts';
import { buildCombatButtons } from './attack.ts';
import { EMOJI } from '../../constants.ts';
import type { DungeonSession } from '../../index.ts';

export const customIdPrefix = 'combat:flee';

export async function execute(
  interaction: ButtonInteraction,
  dungeonSessions: Map<string, DungeonSession>,
): Promise<void> {
  await interaction.deferUpdate();

  const session = dungeonSessions.get(interaction.user.id);
  if (!session || !session.inCombat) {
    await interaction.followUp({
      embeds: [buildErrorEmbed('No active combat session.')],
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
    const result = await combatFlee(account.game_token, session.kvAdventurerId, {
      partyId: session.partyId,
      adventurerId: session.stateAdventurerId,
    });

    const { resolution } = result;

    if (resolution) {
      const monsterHp = resolution.monster.hpValues.reduce((s, v) => s + Math.max(0, v), 0);
      const embed = buildCombatResultEmbed(
        resolution.logs,
        resolution.monster.name,
        monsterHp,
        resolution.combatOver,
        resolution.winner,
      );

      if (resolution.combatOver) {
        session.inCombat = false;
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('dungeon:move').setLabel(`${EMOJI.move} Move Forward`).setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('dungeon:search').setLabel(`${EMOJI.search} Search Room`).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('dungeon:camp').setLabel(`${EMOJI.camp} Make Camp`).setStyle(ButtonStyle.Secondary),
        );
        await interaction.editReply({ embeds: [embed], components: [row] });
      } else {
        // Flee failed — still in combat
        await interaction.editReply({ embeds: [embed], components: buildCombatButtons() });
      }
    } else {
      await interaction.followUp({ content: 'Flee action submitted...', ephemeral: true });
    }
  } catch (err) {
    await interaction.followUp({
      embeds: [buildErrorEmbed(`Flee failed: ${(err as Error).message}`)],
      ephemeral: true,
    });
  }
}
