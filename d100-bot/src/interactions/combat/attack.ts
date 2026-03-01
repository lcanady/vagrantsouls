import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getAccount } from '../../db/store.ts';
import { combatAttack } from '../../api/combat.ts';
import { buildCombatResultEmbed } from '../../embeds/combat.ts';
import { buildErrorEmbed } from '../../embeds/error.ts';
import { EMOJI } from '../../constants.ts';
import type { DungeonSession } from '../../index.ts';

export const customIdPrefix = 'combat:attack:';

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
    await interaction.followUp({
      embeds: [buildErrorEmbed('No account found.')],
      ephemeral: true,
    });
    return;
  }

  // customId = "combat:attack:rHand" or "combat:attack:lHand"
  const weaponSlot = interaction.customId.replace('combat:attack:', '') || 'rHand';

  try {
    const result = await combatAttack(account.game_token, session.kvAdventurerId, {
      partyId: session.partyId,
      adventurerId: session.stateAdventurerId,
      weaponSlot,
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
        // Combat over — clear session state and show dungeon buttons
        session.inCombat = false;
        session.combatMonsterId = undefined;

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
        await interaction.editReply({ embeds: [embed], components: [row] });
      } else {
        await interaction.editReply({
          embeds: [embed],
          components: buildCombatButtons(),
        });
      }
    } else {
      // Turn submitted, waiting
      await interaction.followUp({
        content: 'Attack submitted — waiting for the round to resolve...',
        ephemeral: true,
      });
    }
  } catch (err) {
    await interaction.followUp({
      embeds: [buildErrorEmbed(`Attack failed: ${(err as Error).message}`)],
      ephemeral: true,
    });
  }
}

export function buildCombatButtons(): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('combat:attack:rHand')
        .setLabel(`${EMOJI.sword} Attack (Main)`)
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('combat:attack:lHand')
        .setLabel(`${EMOJI.shield} Attack (Off)`)
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('combat:defend')
        .setLabel(`${EMOJI.shield} Defend`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('combat:flee')
        .setLabel(`${EMOJI.run} Flee`)
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}
