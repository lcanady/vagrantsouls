import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJI } from '../constants.ts';

export function buildErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.ERROR)
    .setTitle(`${EMOJI.cross} Error`)
    .setDescription(message);
}
