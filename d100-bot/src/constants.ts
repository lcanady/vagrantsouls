/** Embed accent colors — palette from discord-design.md */
export const COLORS = {
  DEFAULT:     0xf0c040,  // LUNAR gold (onboarding, finalize)
  ROOM_GREEN:  0x27ae60,  // Forest green
  ROOM_RED:    0xc0392b,  // Blood red
  ROOM_BLUE:   0x2980b9,  // Sapphire
  ROOM_YELLOW: 0xf39c12,  // Amber
  COMBAT:      0xc0392b,  // Blood red
  DEATH:       0x2c2c2c,  // Ash grey
  DOWNTIME:    0x27ae60,  // Forest green
  RARE_LOOT:   0x8e44ad,  // Arcane purple
  PARTY:       0x1a1a2e,  // Deep navy
  ARCANE:      0x8e44ad,  // Arcane purple
  ARTISAN:     0xf39c12,  // Amber
  ERROR:       0xe74c3c,  // Red
  NAVY:        0x1a1a2e,  // Deep navy
  MAGIC:       0x5b2d8e,  // Deep purple — arcanist / witchery screens
} as const;

export const ROOM_COLOR_MAP: Record<string, number> = {
  Green:  COLORS.ROOM_GREEN,
  Red:    COLORS.ROOM_RED,
  Blue:   COLORS.ROOM_BLUE,
  Yellow: COLORS.ROOM_YELLOW,
};

export const EMOJI = {
  hp:      '❤️',
  str:     '⚡',
  dex:     '🎯',
  int:     '🧠',
  fate:    '🎲',
  life:    '💫',
  gold:    '🪙',
  oil:     '🕯️',
  food:    '🍖',
  time:    '⏱️',
  backpack:'🎒',
  sword:   '⚔️',
  shield:  '🛡️',
  skull:   '💀',
  map:     '🗺️',
  door:    '🚪',
  camp:    '🏕️',
  search:  '🔍',
  move:    '➡️',
  run:     '🏃',
  star:    '✨',
  warn:    '⚠️',
  check:   '✅',
  cross:   '❌',
  beast:   '🐾',
  arcane:  '🔮',
  artisan: '⚒️',
  guild:   '🏰',
  scroll:  '📜',
  book:    '📚',
  stats:   '📊',
} as const;

export const GUILD_EMOJI: Record<string, string> = {
  'iron-vanguard':   '⚔️',
  'arcane-circle':   '🔮',
  'shadow-step':     '🗡️',
  'silver-wanderers':'🌙',
};

export const PATH_EMOJI: Record<string, string> = {
  Warrior:        '⚔️',
  Rogue:          '🗡️',
  Sorcerer:       '🔮',
  Knight:         '🛡️',
  Paladin:        '✨',
  Assassin:       '🌙',
  Scoundrel:      '🎲',
  Warlock:        '👁️',
  Druid:          '🌿',
  Barbarian:      '💪',
  Hunter:         '🏹',
  'Arcane Wizard':'🌀',
};

export const RACE_EMOJI: Record<string, string> = {
  Dwarf:           '⛏️',
  Elf:             '🌿',
  Human:           '🌟',
  Halfling:        '🍀',
  'Half Elf':      '🌙',
  'Half Giant':    '🏔️',
  'High Elf':      '⭐',
  'Mountain Dwarf':'🪨',
};
