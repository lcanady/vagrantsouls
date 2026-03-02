import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJI } from '../constants.ts';
import type { AdventurerData } from '../api/adventurer.ts';

interface WBQuestRecord {
  code: string;
  name: string;
  hexId: string;
  rv: number;
  status: 'active' | 'complete' | 'failed';
  npcName?: string;
}

interface HexSheet {
  sheetId: number;
  quests: WBQuestRecord[];
  questsCompleted: number;
  continentName?: string;
}

interface WorldBuilderData {
  hexSheets: HexSheet[];
  currentSheetIndex: number;
  currentHexId: string;
}

export function buildQuestLogEmbed(adv: AdventurerData): EmbedBuilder {
  const wb = adv.worldBuilder as WorldBuilderData | null | undefined;

  const embed = new EmbedBuilder()
    .setColor(COLORS.ARCANE)
    .setTitle(`${EMOJI.scroll} Quest Log — ${adv.name}`);

  if (!wb || wb.hexSheets.length === 0) {
    embed.setDescription('_No World Builder journey started yet._');
    return embed;
  }

  const sheet = wb.hexSheets[wb.currentSheetIndex];
  if (!sheet) {
    embed.setDescription('_No current hex sheet._');
    return embed;
  }

  const continentLabel = sheet.continentName ? ` — ${sheet.continentName}` : '';
  embed.setDescription(
    `**Land ${sheet.sheetId}**${continentLabel} | ${sheet.questsCompleted}/25 quests complete`,
  );

  const active = sheet.quests.filter((q) => q.status === 'active');
  const completed = sheet.quests.filter((q) => q.status === 'complete');
  const failed = sheet.quests.filter((q) => q.status === 'failed');

  if (active.length > 0) {
    const lines = active.map((q) =>
      `**${q.code}** — ${q.name}\n  📍 Hex \`${q.hexId}\` | Reward: **${q.rv} gp**${q.npcName ? ` | _${q.npcName}_` : ''}`
    );
    embed.addFields({
      name: `📍 Active Quests (${active.length})`,
      value: lines.join('\n\n').slice(0, 1024),
    });
  } else {
    embed.addFields({
      name: `📍 Active Quests`,
      value: '_No active quests on this land._',
    });
  }

  if (completed.length > 0) {
    embed.addFields({
      name: `${EMOJI.check} Completed (${completed.length})`,
      value: completed.map((q) => `${q.code} — ${q.name}`).join('\n').slice(0, 512),
    });
  }

  if (failed.length > 0) {
    embed.addFields({
      name: `${EMOJI.cross} Failed (${failed.length})`,
      value: failed.map((q) => `${q.code} — ${q.name}`).join('\n').slice(0, 512),
    });
  }

  return embed;
}
