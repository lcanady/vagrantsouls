import {
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { getAccount } from '../../db/store.ts';
import { chargenRace, getChargenOptions } from '../../api/chargen.ts';
import { buildChargenStep4Embed } from '../../embeds/chargen.ts';
import { buildErrorEmbed } from '../../embeds/error.ts';
import type { ChargenSession } from '../../index.ts';

export const customIdPrefix = 'chargen:race:';

export async function execute(
  interaction: ButtonInteraction,
  chargenSessions: Map<string, ChargenSession>,
): Promise<void> {
  await interaction.deferUpdate();

  const session = chargenSessions.get(interaction.user.id);
  if (!session || session.step !== 3) {
    await interaction.followUp({
      embeds: [buildErrorEmbed('No active chargen session at step 3. Run `/create` again.')],
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

  const race = interaction.customId.replace('chargen:race:', '');

  try {
    const result = await chargenRace(account.game_token, session.chargenId, race);
    session.step = 4;
    session.adventurer = result.adventurer;

    const options = await getChargenOptions();

    const embed = buildChargenStep4Embed(result.adventurer);

    const select = new StringSelectMenuBuilder()
      .setCustomId('chargen:skills')
      .setPlaceholder('Choose 2 skills...')
      .setMinValues(2)
      .setMaxValues(2)
      .addOptions(
        options.skills.map((skill) =>
          new StringSelectMenuOptionBuilder().setLabel(skill).setValue(skill),
        ),
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (err) {
    await interaction.followUp({
      embeds: [buildErrorEmbed(`Failed: ${(err as Error).message}`)],
      ephemeral: true,
    });
  }
}
