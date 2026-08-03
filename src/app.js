import 'dotenv/config';
import './utils/parcheColorEmbed.js'; // Color centralizado PRIMARIO
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { REST } from '@discordjs/rest';
import express from 'express';
import cron from 'node-cron';
import mongoose from 'mongoose'; // 👈 Importamos Mongoose para MongoDB

import config from './config/application.js';
import { initializeDatabase } from './utils/database.js';
import { getGuildConfig } from './services/guildConfig.js';
import { getServerCounters, saveServerCounters, updateCounter } from './services/serverstatsService.js';
import { logger, startupLog, shutdownLog } from './utils/logger.js';
import { checkBirthdays } from './services/birthdayService.js';
import { checkGiveaways } from './services/giveawayService.js';
import { loadCommands, registerCommands as registerSlashCommands } from './handlers/commandLoader.js';

// 💸 Importamos el sistema de Oportunidades Económicas
import { lanzarOportunidadEconomica } from './utils/gestorOportunidades.js';
// 🔸 Importamos el procesador de recordatorios por conteo de mensajes
import { procesarMensajeRecordatorio } from './utils/gestorRecordatorios.js';
// 🏅 Importamos la función para procesar el Ciudadano del Día
import { procesarCiudadanoDelDia } from './utils/ciudadanoDelDia.js';

class TitanBot extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,                        
        GatewayIntentBits.GuildMembers,                  
        GatewayIntentBits.GuildMessages,                 
        GatewayIntentBits.MessageContent,                
        GatewayIntentBits.GuildMessageReactions,         
        GatewayIntentBits.GuildVoiceStates,              
        GatewayIntentBits.GuildPresences,                
        GatewayIntentBits.GuildModeration,               
      ],
    });

    this.commands = new Collection();
    this.events = new Collection();
    this.buttons = new Collection();
    this.selectMenus = new Collection();
    this.modals = new Collection();
    this.cooldowns = new Collection();
  }
}

const client = new TitanBot();

async function start() {
  try {
    startupLog('Starting TitanBot...');

    startupLog('Initializing PostgreSQL database...');
    await initializeDatabase();

    startupLog('Initializing MongoDB (Mongoose)...');
    // Mongo already handled inside initializeDatabase typically

    startupLog('Starting web server...');
    const app = express();
    const PORT = process.env.PORT || 3000;
    app.get('/health', (req, res) => res.json({ status: 'ok' }));
    app.get('/ready', (req, res) => res.json({ status: 'ready' }));
    app.listen(PORT, '0.0.0.0', () => {
      startupLog(`✅ Web Server running on 0.0.0.0:${PORT}`);
      startupLog(`Health endpoint: http://localhost:${PORT}/health`);
      startupLog(`Ready endpoint: http://localhost:${PORT}/ready`);
    });

    startupLog('Loading commands...');
    await loadCommands(client);
    startupLog(`Commands loaded: ${client.commands.size}`);

    startupLog('Loading handlers...');
    const { loadEvents } = await import('./handlers/eventLoader.js');
    const { loadInteractions } = await import('./handlers/interactionLoader.js');
    await loadEvents(client);
    await loadInteractions(client);
    startupLog('Handlers loaded');

    startupLog('Logging into Discord...');
    await client.login(process.env.DISCORD_TOKEN || process.env.TOKEN);
    startupLog('Discord login successful');

    startupLog('Registering slash commands...');
    await registerSlashCommands(client);
  } catch (error) {
    logger.error('Fatal startup error:', error);
    process.exit(1);
  }
}

start();

export default client;
