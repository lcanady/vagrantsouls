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
import * as inventoryCmd from './commands/inventory.ts';
import * as questsCmd from './commands/quests.ts';
import * as worldbuilderCmd from './commands/worldbuilder.ts';
import * as charsheetCmd from './commands/charsheet.ts';

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

// Camp sub-flow interactions
import * as campHeal from './interactions/dungeon/camp/heal.ts';
import * as campRepair from './interactions/dungeon/camp/repair.ts';
import * as campTrade from './interactions/dungeon/camp/trade.ts';
import * as campTrain from './interactions/dungeon/camp/train.ts';
import * as campEmpire from './interactions/dungeon/camp/empire.ts';
import * as campWitchery from './interactions/dungeon/camp/witchery.ts';
import * as campBeast from './interactions/dungeon/camp/beast.ts';
import * as campArcanist from './interactions/dungeon/camp/arcanist.ts';
import * as campArtisan from './interactions/dungeon/camp/artisan.ts';

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
        case 'inventory':
          await inventoryCmd.execute(i);
          break;
        case 'quests':
          await questsCmd.execute(i);
          break;
        case 'worldbuilder':
          await worldbuilderCmd.execute(i);
          break;
        case 'charsheet':
          await charsheetCmd.execute(i);
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
      } else if (i.customId === 'camp:heal:submit') {
        await campHeal.handleModal(i, dungeonSessions);
      } else if (i.customId === 'camp:repair:submit') {
        await campRepair.handleModal(i, dungeonSessions);
      } else if (i.customId.startsWith('camp:trade:') && i.customId.endsWith(':submit')) {
        await campTrade.handleModal(i, dungeonSessions);
      } else if (i.customId === 'camp:train:submit') {
        await campTrain.handleModal(i, dungeonSessions);
      } else if (i.customId === 'camp:empire:submit') {
        await campEmpire.handleModal(i, dungeonSessions);
      } else if (i.customId === 'camp:witchery:brew:submit') {
        await campWitchery.handleModal(i, dungeonSessions);
      } else if (i.customId.startsWith('camp:beast:') && i.customId.endsWith(':submit')) {
        await campBeast.handleModal(i, dungeonSessions);
      } else if (i.customId.startsWith('camp:arcanist:') && i.customId.endsWith(':submit')) {
        await campArcanist.handleModal(i, dungeonSessions);
      } else if (i.customId.startsWith('camp:artisan:') && i.customId.endsWith(':submit')) {
        await campArtisan.handleModal(i, dungeonSessions);
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
      // ── Camp sub-flows ─────────────────────────────────────────────────────
      } else if (id === 'camp:heal') {
        await campHeal.handleButton(i, dungeonSessions);
      } else if (id === 'camp:repair') {
        await campRepair.handleButton(i, dungeonSessions);
      } else if (id === 'camp:trade' || id.startsWith('camp:trade:')) {
        await campTrade.handleButton(i, dungeonSessions);
      } else if (id === 'camp:train') {
        await campTrain.handleButton(i, dungeonSessions);
      } else if (id === 'camp:empire') {
        await campEmpire.handleButton(i, dungeonSessions);
      } else if (id === 'camp:witchery' || id === 'camp:witchery:brew') {
        await campWitchery.handleButton(i, dungeonSessions);
      } else if (id === 'camp:witchery:clear') {
        await campWitchery.handleClearButton(i, dungeonSessions);
      } else if (id === 'camp:beast' || id.startsWith('camp:beast:')) {
        await campBeast.handleButton(i, dungeonSessions);
      } else if (id === 'camp:arcanist' || id.startsWith('camp:arcanist:')) {
        await campArcanist.handleButton(i, dungeonSessions);
      } else if (id === 'camp:artisan' || id.startsWith('camp:artisan:')) {
        await campArtisan.handleButton(i, dungeonSessions);
      // ── Combat ─────────────────────────────────────────────────────────────
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
