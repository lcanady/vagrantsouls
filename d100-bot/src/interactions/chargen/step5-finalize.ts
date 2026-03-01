import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { getAccount, setAdventurerId } from '../../db/store.ts';
import { chargenFinalize } from '../../api/chargen.ts';
import { buildErrorEmbed } from '../../embeds/error.ts';
import { COLORS, EMOJI, PATH_EMOJI, RACE_EMOJI } from '../../constants.ts';
import type { ChargenSession } from '../../index.ts';

export const customIdPrefix = 'chargen:finalize';

export async function execute(
  interaction: ButtonInteraction,
  chargenSessions: Map<string, ChargenSession>,
): Promise<void> {
  await interaction.deferUpdate();

  const session = chargenSessions.get(interaction.user.id);
  if (!session || session.step !== 5) {
    await interaction.followUp({
      embeds: [buildErrorEmbed('No active chargen session at step 5. Run `/create` again.')],
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
    const result = await chargenFinalize(account.game_token, session.chargenId);
    const adv = result.adventurer;

    // Persist adventurer ID
    await setAdventurerId(interaction.user.id, adv.id);
    chargenSessions.delete(interaction.user.id);

    const pathIcon = PATH_EMOJI[adv.path] ?? '';
    const raceIcon = RACE_EMOJI[adv.race] ?? '';

    const embed = new EmbedBuilder()
      .setColor(COLORS.DEFAULT)
      .setTitle(`${EMOJI.star} ${adv.name} is ready!`)
      .setDescription(
        `Your adventurer has been created.\n\n` +
          `${raceIcon} **${adv.race}** — ${pathIcon} **${adv.path}**\n` +
          `${EMOJI.hp} HP: **${adv.hp}** | ${EMOJI.str} **${adv.str}** | ${EMOJI.dex} **${adv.dex}** | ${EMOJI.int} **${adv.int}**\n\n` +
          `Use \`/enter\` to step into the dungeon and begin your quest!`,
      )
      .setFooter({ text: 'May fate smile upon you, adventurer.' });

    await interaction.editReply({ embeds: [embed], components: [] });
  } catch (err) {
    await interaction.followUp({
      embeds: [buildErrorEmbed(`Finalization failed: ${(err as Error).message}`)],
      ephemeral: true,
    });
  }
}
