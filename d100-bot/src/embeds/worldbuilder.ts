import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJI } from '../constants.ts';
import type { AdventurerData } from '../api/adventurer.ts';

const MONTH_NAMES = [
  '', 'Frostwatch', 'Thawmere', 'Bloomrise', 'Sunpeak',
  'Highsummer', 'Goldensow', 'Harvestfall', 'Duskmantle',
  'Ashveil', 'Frostcall', 'Winterdeep', 'Yulecrown',
];

const TERRAIN_EMOJI: Record<string, string> = {
  Forests:    '🌲',
  Mountains:  '⛰️',
  Deserts:    '🏜️',
  Jungles:    '🌴',
  Hills:      '🏔️',
  Tundras:    '❄️',
  Marshlands: '🌿',
  Swamps:     '🌫️',
  Seas:       '🌊',
  Grasslands: '🌾',
};

interface WBMount {
  name: string;
  type: string;
  hp: number;
  currentHp: number;
}

interface HexData {
  terrain: string;
  name: string;
  settlement?: { type: string; name: string };
}

interface HexSheet {
  sheetId: number;
  hexes: Record<string, HexData>;
  quests: { status: string }[];
  questsCompleted: number;
  continentName?: string;
}

interface WBCalendar {
  year: number;
  month: number;
  day: number;
  rations: number;
  fatigue: number;
}

interface WorldBuilderData {
  hexSheets: HexSheet[];
  currentSheetIndex: number;
  currentHexId: string;
  calendar: WBCalendar;
  mounts: WBMount[];
  lawlessPoints: number;
  witchSuspicion: number;
}

export function buildWorldBuilderEmbed(adv: AdventurerData): EmbedBuilder {
  const wb = adv.worldBuilder as WorldBuilderData | null | undefined;

  const embed = new EmbedBuilder()
    .setColor(COLORS.ROOM_GREEN)
    .setTitle(`${EMOJI.map} World Builder — ${adv.name}`);

  if (!wb) {
    embed.setDescription('_No World Builder journey active._');
    return embed;
  }

  const sheet = wb.hexSheets[wb.currentSheetIndex];
  const currentHex = sheet?.hexes[wb.currentHexId];
  const terrainIcon = currentHex ? (TERRAIN_EMOJI[currentHex.terrain] ?? '🗺️') : '🗺️';
  const cal = wb.calendar;
  const monthName = MONTH_NAMES[cal.month] ?? `Month ${cal.month}`;
  const continentLabel = sheet?.continentName ?? `Land ${sheet?.sheetId ?? '?'}`;

  const hexLine = currentHex
    ? `${terrainIcon} **${currentHex.name}** (${currentHex.terrain}) — Hex \`${wb.currentHexId}\``
    : `Hex \`${wb.currentHexId}\``;
  const settlementLine = currentHex?.settlement
    ? `🏘️ **${currentHex.settlement.name}** (${currentHex.settlement.type})`
    : '';

  embed.setDescription([hexLine, settlementLine].filter(Boolean).join('\n'));

  // Calendar
  const fatigueFilled = Math.min(cal.fatigue, 10);
  const fatigueBars = '█'.repeat(fatigueFilled) + '░'.repeat(10 - fatigueFilled);
  embed.addFields({
    name: '📅 Calendar',
    value: [
      `**${cal.day} ${monthName}, ${cal.year}**`,
      `Rations: **${cal.rations}/30** | Fatigue: **${cal.fatigue}/10** ${fatigueBars}`,
    ].join('\n'),
  });

  // Quest progress
  const activeCount = sheet?.quests.filter((q) => q.status === 'active').length ?? 0;
  const completedCount = sheet?.questsCompleted ?? 0;
  embed.addFields({
    name: `${EMOJI.scroll} Quests`,
    value: `Active: **${activeCount}** | Completed: **${completedCount}/25** on ${continentLabel}`,
  });

  // Mounts
  if (wb.mounts.length > 0) {
    embed.addFields({
      name: '🐴 Mounts',
      value: wb.mounts
        .map((m) => `**${m.name}** (${m.type}) — HP: ${m.currentHp}/${m.hp}`)
        .join('\n'),
    });
  }

  // Status flags
  const miscParts: string[] = [];
  if (wb.lawlessPoints > 0) miscParts.push(`⚖️ Lawless: **${wb.lawlessPoints}**`);
  if (wb.witchSuspicion > 0) miscParts.push(`🔮 Witch Suspicion: **${wb.witchSuspicion}**`);
  if (miscParts.length > 0) {
    embed.addFields({
      name: `${EMOJI.warn} Flags`,
      value: miscParts.join(' | '),
    });
  }

  return embed;
}
