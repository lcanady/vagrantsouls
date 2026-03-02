import { REST, Routes } from 'discord.js';

import * as registerCmd from './commands/register.ts';
import * as createCmd from './commands/create.ts';
import * as enterCmd from './commands/enter.ts';
import * as statusCmd from './commands/status.ts';
import * as helpCmd from './commands/help.ts';
import * as inventoryCmd from './commands/inventory.ts';
import * as questsCmd from './commands/quests.ts';
import * as worldbuilderCmd from './commands/worldbuilder.ts';
import * as charsheetCmd from './commands/charsheet.ts';

const commands = [
  registerCmd.data,
  createCmd.data,
  enterCmd.data,
  statusCmd.data,
  helpCmd.data,
  inventoryCmd.data,
  questsCmd.data,
  worldbuilderCmd.data,
  charsheetCmd.data,
].map((c) => c.toJSON());

const token = Deno.env.get('DISCORD_TOKEN');
const clientId = Deno.env.get('DISCORD_CLIENT_ID');
const guildId = Deno.env.get('DISCORD_GUILD_ID');

if (!token || !clientId) {
  console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID');
  Deno.exit(1);
}

const safeToken = token as string;
const safeClientId = clientId as string;
const rest = new REST({ version: '10' }).setToken(safeToken);

async function deploy() {
  try {
    console.log(`Registering ${commands.length} slash commands...`);

    if (guildId) {
      // Guild-scoped (instant, dev only)
      await rest.put(Routes.applicationGuildCommands(safeClientId, guildId), {
        body: commands,
      });
      console.log(`Registered to guild ${guildId}`);
    } else {
      // Global (up to 1hr propagation)
      await rest.put(Routes.applicationCommands(safeClientId), { body: commands });
      console.log('Registered globally');
    }
  } catch (err) {
    console.error('Deploy failed:', err);
    Deno.exit(1);
  }
}

deploy();
