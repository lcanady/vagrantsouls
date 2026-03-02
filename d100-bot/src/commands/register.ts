import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { getAccount, saveAccount } from '../db/store.ts';
import { register } from '../api/auth.ts';
import { COLORS, EMOJI } from '../constants.ts';
import { buildErrorEmbed } from '../embeds/error.ts';
import { createLogoAttachment, LOGO_ATTACHMENT_NAME } from '../utils/logo.ts';

export const data = new SlashCommandBuilder()
  .setName('register')
  .setDescription('Create a D100 Dungeon account and link it to your Discord profile.');

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const discordId = interaction.user.id;

  // Already registered?
  const existing = await getAccount(discordId);
  if (existing) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.DEFAULT)
      .setTitle(`${EMOJI.check} Already Registered`)
      .setDescription(
        existing.adventurer_id
          ? `You already have an account. Use \`/status\` or \`/enter\` to continue your adventure!`
          : `You already have an account. Use \`/create\` to build your adventurer!`,
      );
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Generate credentials
  const username = `d_${discordId.slice(0, 10)}`;
  const password = crypto.randomUUID();

  try {
    const result = await register(username, password);
    await saveAccount(discordId, username, result.token);

    const embed = new EmbedBuilder()
      .setColor(COLORS.DEFAULT)
      .setTitle(`${EMOJI.star} Welcome to D100 Dungeon!`)
      .setDescription(
        `Your account has been created.\n\n` +
          `Run \`/create\` to build your adventurer and begin your quest!`,
      )
      .setImage(`attachment://${LOGO_ATTACHMENT_NAME}`)
      .setFooter({ text: 'Your credentials are stored securely.' });

    await interaction.editReply({ embeds: [embed], files: [createLogoAttachment()] });

    // DM the user
    try {
      await interaction.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.DEFAULT)
            .setTitle(`${EMOJI.guild} Your D100 Account`)
            .setDescription(
              `Your account is ready!\n\n` +
                `Head to the server and use \`/create\` to forge your adventurer.`,
            ),
        ],
      });
    } catch {
      // DMs may be closed — not a fatal error
    }
  } catch (err) {
    await interaction.editReply({
      embeds: [buildErrorEmbed(`Registration failed: ${(err as Error).message}`)],
    });
  }
}
