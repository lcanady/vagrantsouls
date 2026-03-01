import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJI, ROOM_COLOR_MAP } from '../constants.ts';
import type { RoomData, TimeTrack } from '../api/dungeon.ts';

export type { RoomData, TimeTrack };

export function buildRoomEmbed(
  room: RoomData,
  narrative: string,
  timeTrack?: TimeTrack,
  upkeepMessages?: string[],
): EmbedBuilder {
  const color = ROOM_COLOR_MAP[room.color] ?? COLORS.DEFAULT;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${EMOJI.door} Room ${room.roll}`)
    .setDescription(narrative);

  embed.addFields(
    {
      name: `${EMOJI.map} Room`,
      value: `Color: **${room.color}** | Exits: **${room.exits}** | Searched: **${room.searched ? 'Yes' : 'No'}**`,
    },
  );

  if (timeTrack) {
    embed.addFields({
      name: `${EMOJI.time} Time`,
      value: `Day **${timeTrack.day}** — ${timeTrack.phase}`,
      inline: true,
    });
  }

  if (upkeepMessages && upkeepMessages.length > 0) {
    embed.addFields({
      name: `${EMOJI.warn} Upkeep`,
      value: upkeepMessages.join('\n'),
    });
  }

  return embed;
}

export function buildSearchEmbed(
  findName: string,
  findValue: number | undefined,
  narrative: string,
): EmbedBuilder {
  const found = findName !== 'Nothing';
  return new EmbedBuilder()
    .setColor(found ? COLORS.RARE_LOOT : COLORS.DEATH)
    .setTitle(`${EMOJI.search} Search Result`)
    .setDescription(narrative)
    .addFields({
      name: found ? `${EMOJI.star} Found` : `${EMOJI.skull} Found`,
      value: found
        ? `**${findName}**${findValue ? ` (+${findValue}${EMOJI.gold})` : ''}`
        : '_Nothing of value._',
    });
}
