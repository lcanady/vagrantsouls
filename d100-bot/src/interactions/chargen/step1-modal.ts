import {
  ModalSubmitInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getAccount } from '../../db/store.ts';
import { chargenCreate } from '../../api/chargen.ts';
import { buildChargenStep2Embed } from '../../embeds/chargen.ts';
import { buildErrorEmbed } from '../../embeds/error.ts';
import { PATH_EMOJI } from '../../constants.ts';
import type { ChargenSession } from '../../index.ts';

export const customIdPrefix = 'modal:chargen_step1';

const PATHS = [
  'Warrior', 'Rogue', 'Sorcerer', 'Knight', 'Paladin',
  'Assassin', 'Scoundrel', 'Warlock', 'Druid', 'Barbarian',
  'Hunter', 'Arcane Wizard',
];

export async function execute(
  interaction: ModalSubmitInteraction,
  chargenSessions: Map<string, ChargenSession>,
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const account = await getAccount(interaction.user.id);
  if (!account) {
    await interaction.editReply({
      embeds: [buildErrorEmbed('No account found. Run `/register` first.')],
    });
    return;
  }

  const name = interaction.fields.getTextInputValue('name').trim();
  const str = parseInt(interaction.fields.getTextInputValue('str'), 10);
  const dex = parseInt(interaction.fields.getTextInputValue('dex'), 10);
  const int = parseInt(interaction.fields.getTextInputValue('int'), 10);

  if ([str, dex, int].some((v) => isNaN(v) || v < 1 || v > 8)) {
    await interaction.editReply({
      embeds: [buildErrorEmbed('Each attribute must be between 1 and 8.')],
    });
    return;
  }
  if (str + dex + int !== 15) {
    await interaction.editReply({
      embeds: [buildErrorEmbed(`Attributes must total exactly 15 (got ${str + dex + int}).`)],
    });
    return;
  }

  try {
    const result = await chargenCreate(account.game_token, { name, str, dex, int });

    // Store chargen session
    chargenSessions.set(interaction.user.id, {
      chargenId: result.id,
      step: 2,
      adventurer: result.adventurer,
    });

    const embed = buildChargenStep2Embed(result.adventurer);

    // Build path buttons (max 5 per row, up to 3 rows = 15 paths supported)
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const chunks = chunkArray(PATHS, 4);
    for (const chunk of chunks) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...chunk.map((path) =>
          new ButtonBuilder()
            .setCustomId(`chargen:path:${path}`)
            .setLabel(`${PATH_EMOJI[path] ?? ''} ${path}`)
            .setStyle(ButtonStyle.Secondary),
        ),
      );
      rows.push(row);
    }

    await interaction.editReply({ embeds: [embed], components: rows });
  } catch (err) {
    await interaction.editReply({
      embeds: [buildErrorEmbed(`Chargen failed: ${(err as Error).message}`)],
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
