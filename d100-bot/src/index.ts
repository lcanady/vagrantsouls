import {
  Client,
  GatewayIntentBits,
  Interaction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';

// Commands
import * as registerCmd from './commands/register.ts';
import * as createCmd from './commands/create.ts';
import * as enterCmd from './commands/enter.ts';
import * as statusCmd from './commands/status.ts';
import * as helpCmd from './commands/help.ts';

// Chargen interactions
import * as step1Modal from './interactions/chargen/step1-modal.ts';
import * as step2Path from './interactions/chargen/step2-path.ts';
import * as step3Race from './interactions/chargen/step3-race.ts';
import * as step4Skills from './interactions/chargen/step4-skills.ts';
import * as step5Finalize from './interactions/chargen/step5-finalize.ts';

// Dungeon interactions
import * as dungeonMove from './interactions/dungeon/move.ts';
import * as dungeonSearch from './interactions/dungeon/search.ts';
import * as dungeonCamp from './interactions/dungeon/camp.ts';

// Combat interactions
import * as combatAttack from './interactions/combat/attack.ts';
import * as combatDefend from './interactions/combat/defend.ts';
import * as combatFlee from './interactions/combat/flee.ts';

// ─── Session types ────────────────────────────────────────────────────────────

export interface ChargenSession {
  chargenId: string;
  step: number;
  adventurer: Record<string, unknown>;
}

export interface LastRoom {
  roll: number;
  color: string;
  exits: number;
  searched: boolean;
  narrative: string;
  timeTrack?: { day: number; phase: string };
  upkeepMessages?: string[];
}

export interface DungeonSession {
  adventurerId: string;
  kvAdventurerId: string;
  stateAdventurerId: string;
  partyId: string;
  messageId: string;
  channelId: string;
  roomSearched: boolean;
  inCombat: boolean;
  beastAbilityUses: number;
  combatMonsterId?: string;
  lastRoom?: LastRoom;
}

// ─── In-memory state ──────────────────────────────────────────────────────────

const chargenSessions = new Map<string, ChargenSession>();
const dungeonSessions = new Map<string, DungeonSession>();

// ─── Discord client ───────────────────────────────────────────────────────────

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', () => {
  console.log(`D100 Bot ready — logged in as ${client.user?.tag}`);
});

// ─── Interaction router ───────────────────────────────────────────────────────

client.on('interactionCreate', async (interaction: Interaction) => {
  try {
    // ── Slash commands ────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const i = interaction as ChatInputCommandInteraction;
      switch (i.commandName) {
        case 'register':
          await registerCmd.execute(i);
          break;
        case 'create':
          await createCmd.execute(i);
          break;
        case 'enter':
          await enterCmd.execute(i, dungeonSessions);
          break;
        case 'status':
          await statusCmd.execute(i);
          break;
        case 'help':
          await helpCmd.execute(i);
          break;
        default:
          await i.reply({ content: 'Unknown command.', ephemeral: true });
      }
      return;
    }

    // ── Modal submissions ────────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const i = interaction as ModalSubmitInteraction;
      if (i.customId === step1Modal.customIdPrefix) {
        await step1Modal.execute(i, chargenSessions);
      }
      return;
    }

    // ── Button interactions ──────────────────────────────────────────────────
    if (interaction.isButton()) {
      const i = interaction as ButtonInteraction;
      const id = i.customId;

      if (id.startsWith('chargen:path:')) {
        await step2Path.execute(i, chargenSessions);
      } else if (id.startsWith('chargen:race:')) {
        await step3Race.execute(i, chargenSessions);
      } else if (id === 'chargen:finalize') {
        await step5Finalize.execute(i, chargenSessions);
      } else if (id === 'dungeon:move') {
        await dungeonMove.execute(i, dungeonSessions);
      } else if (id === 'dungeon:search') {
        await dungeonSearch.execute(i, dungeonSessions);
      } else if (id === 'dungeon:camp' || id === 'camp:back') {
        await dungeonCamp.execute(i, dungeonSessions);
      } else if (id.startsWith('camp:')) {
        // Camp sub-flow stubs — coming in Phase 4 sub-flows
        await i.reply({ content: '⚙️ This camp action is coming in the next update!', ephemeral: true });
      } else if (id.startsWith('combat:attack:')) {
        await combatAttack.execute(i, dungeonSessions);
      } else if (id === 'combat:defend') {
        await combatDefend.execute(i, dungeonSessions);
      } else if (id === 'combat:flee') {
        await combatFlee.execute(i, dungeonSessions);
      }
      return;
    }

    // ── Select menus ─────────────────────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      const i = interaction as StringSelectMenuInteraction;
      if (i.customId === 'chargen:skills') {
        await step4Skills.execute(i, chargenSessions);
      }
      return;
    }
  } catch (err) {
    console.error('Unhandled interaction error:', err);
    try {
      const msg = { content: 'An unexpected error occurred.', ephemeral: true };
      if ('replied' in interaction && interaction.replied) {
        await (interaction as ChatInputCommandInteraction).followUp(msg);
      } else if ('deferred' in interaction && interaction.deferred) {
        await (interaction as ChatInputCommandInteraction).editReply(msg);
      } else if ('reply' in interaction) {
        await (interaction as ChatInputCommandInteraction).reply(msg);
      }
    } catch {
      // swallow secondary error
    }
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────

const token = Deno.env.get('DISCORD_TOKEN');
if (!token) {
  console.error('Missing DISCORD_TOKEN in environment');
  Deno.exit(1);
}

client.login(token);
