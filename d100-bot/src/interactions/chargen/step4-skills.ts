import {
  StringSelectMenuInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getAccount } from '../../db/store.ts';
import { chargenSkills } from '../../api/chargen.ts';
import { buildChargenStep5Embed } from '../../embeds/chargen.ts';
import { buildErrorEmbed } from '../../embeds/error.ts';
import { EMOJI } from '../../constants.ts';
import type { ChargenSession } from '../../index.ts';

export const customIdPrefix = 'chargen:skills';

export async function execute(
  interaction: StringSelectMenuInteraction,
  chargenSessions: Map<string, ChargenSession>,
): Promise<void> {
  await interaction.deferUpdate();

  const session = chargenSessions.get(interaction.user.id);
  if (!session || session.step !== 4) {
    await interaction.followUp({
      embeds: [buildErrorEmbed('No active chargen session at step 4. Run `/create` again.')],
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

  const skills = interaction.values;

  try {
    const result = await chargenSkills(account.game_token, session.chargenId, skills);
    session.step = 5;
    session.adventurer = result.adventurer;

    const embed = buildChargenStep5Embed(result.adventurer);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('chargen:finalize')
        .setLabel(`${EMOJI.star} Finalize & Enter Dungeon`)
        .setStyle(ButtonStyle.Success),
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (err) {
    await interaction.followUp({
      embeds: [buildErrorEmbed(`Failed: ${(err as Error).message}`)],
      ephemeral: true,
    });
  }
}
