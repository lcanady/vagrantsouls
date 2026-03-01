import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getAccount } from '../../db/store.ts';
import { chargenPath } from '../../api/chargen.ts';
import { buildChargenStep3Embed } from '../../embeds/chargen.ts';
import { buildErrorEmbed } from '../../embeds/error.ts';
import { RACE_EMOJI } from '../../constants.ts';
import type { ChargenSession } from '../../index.ts';

export const customIdPrefix = 'chargen:path:';

const RACES = [
  'Dwarf', 'Elf', 'Human', 'Halfling',
  'Half Elf', 'Half Giant', 'High Elf', 'Mountain Dwarf',
];

export async function execute(
  interaction: ButtonInteraction,
  chargenSessions: Map<string, ChargenSession>,
): Promise<void> {
  await interaction.deferUpdate();

  const session = chargenSessions.get(interaction.user.id);
  if (!session || session.step !== 2) {
    await interaction.followUp({
      embeds: [buildErrorEmbed('No active chargen session. Run `/create` again.')],
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

  const path = interaction.customId.replace('chargen:path:', '');

  try {
    const result = await chargenPath(account.game_token, session.chargenId, path);
    session.step = 3;
    session.adventurer = result.adventurer;

    const embed = buildChargenStep3Embed(result.adventurer);

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const chunks = chunkArray(RACES, 4);
    for (const chunk of chunks) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...chunk.map((race) =>
          new ButtonBuilder()
            .setCustomId(`chargen:race:${race}`)
            .setLabel(`${RACE_EMOJI[race] ?? ''} ${race}`)
            .setStyle(ButtonStyle.Secondary),
        ),
      );
      rows.push(row);
    }

    await interaction.editReply({ embeds: [embed], components: rows });
  } catch (err) {
    await interaction.followUp({
      embeds: [buildErrorEmbed(`Failed: ${(err as Error).message}`)],
      ephemeral: true,
    });
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
