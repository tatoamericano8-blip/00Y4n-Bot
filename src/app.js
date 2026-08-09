import 'dotenv/config';
import './utils/parcheColorEmbed.js';
import './utils/parcheFooterEmbed.js';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { REST } from '@discordjs/rest';
import express from 'express';
import cron from 'node-cron';
import mongoose from 'mongoose';

import config from './config/application.js';
import { initializeDatabase } from './utils/database.js';
import { getGuildConfig } from './services/guildConfig.js';
import { getServerCounters, saveServerCounters, updateCounter } from './services/serverstatsService.js';
import { logger, startupLog, shutdownLog } from './utils/logger.js';
import { checkBirthdays } from './services/birthdayService.js';
import { checkGiveaways } from './services/giveawayService.js';
import { loadCommands, registerCommands as registerSlashCommands } from './handlers/commandLoader.js';

import { lanzarOportunidadEconomica } from './utils/gestorOportunidades.js';
import { procesarMensajeRecordatorio } from './utils/gestorRecordatorios.js';
import { procesarCiudadanoDelDia } from './utils/ciudadanoDelDia.js';
import { avisarAltoComando } from './utils/alertaHC.js';

class TitanBot extends Client {
  constructor() {
    const intents = [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildPresences,
    ].filter((x) => typeof x === 'number');

    super({
      intents,
      rest: { timeout: 20000 },
      failIfNotExists: false,
    });

    this.config = config;
    this.commands = new Collection();
    this.events = new Collection();
    this.buttons = new Collection();
    this.selectMenus = new Collection();
    this.modals = new Collection();
    this.cooldowns = new Collection();
    this.db = null;
    this.rest = new REST({ version: '10' }).setToken(config.bot.token);
  }

  async start() {
    try {
      startupLog('Starting TitanBot...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      startupLog('Initializing PostgreSQL database...');
      const dbInstance = await initializeDatabase();
      this.db = dbInstance.db;

      const dbStatus = this.db.getStatus();
      if (dbStatus.isDegraded) {
        logger.warn('DATABASE RUNNING IN DEGRADED MODE');
      } else {
        startupLog(`✅ PostgreSQL Status: ${dbStatus.connectionType} (fully operational)`);
      }

      startupLog('Initializing MongoDB (Mongoose)...');
      const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
      if (mongoUri) {
        try {
          await mongoose.connect(mongoUri);
          startupLog('✅ MongoDB Atlas connected via Mongoose successfully');
        } catch (mongoErr) {
          logger.error('❌ Failed to connect to MongoDB Atlas:', mongoErr.message);
        }
      } else {
        logger.warn('⚠️ MONGO_URI missing. Mongoose features may fail.');
      }

      startupLog('Starting web server...');
      this.startWebServer();

      startupLog('Loading commands...');
      await loadCommands(this);
      startupLog(`Commands loaded: ${this.commands.size}`);

      startupLog('Loading handlers...');
      await this.loadHandlers();
      startupLog('Handlers loaded');

      startupLog('Logging into Discord...');
      if (!this.config.bot.token) {
        throw new Error('DISCORD_TOKEN/TOKEN vacío en variables de entorno de Render');
      }
      const tok = String(this.config.bot.token).trim().replace(/^[\'"]|[\'"]$/g, '');
      startupLog('Token presente (len=' + tok.length + ', prefix=' + tok.slice(0, 5) + '…)');

      this.on('debug', (msg) => {
        if (/Identifying|WebSocket|READY|Session|4014|4004|Gateway|Rate|429|blocked/i.test(msg)) {
          logger.info('[discord-ws] ' + msg);
        }
      });
      this.on('error', (err) => logger.error('[discord-error] ' + (err?.message || err)));
      this.on('warn', (msg) => logger.warn('[discord-warn] ' + msg));

      let loggedIn = false;
      let attempt = 0;
      while (!loggedIn) {
        attempt += 1;
        try {
          if (attempt === 1 || attempt % 3 === 0) {
            try {
              const ctrl = new AbortController();
              const to = setTimeout(() => ctrl.abort(), 12000);
              const res = await fetch('https://discord.com/api/v10/gateway/bot', {
                headers: {
                  Authorization: 'Bot ' + tok,
                  'User-Agent': 'DiscordBot (00Y4n, 1.0)'
                },
                signal: ctrl.signal
              });
              clearTimeout(to);
              const bodyText = await res.text();
              startupLog('Preflight HTTP ' + res.status + ' (attempt ' + attempt + ')');
              if (res.status === 429) {
                let waitSec = 600;
                try {
                  const j = JSON.parse(bodyText);
                  if (j.retry_after) waitSec = Math.ceil(Number(j.retry_after)) + 10;
                } catch (_) {}
                const ra = res.headers.get('retry-after');
                if (ra) waitSec = Math.max(waitSec, Math.ceil(Number(ra)) + 10);
                startupLog('Discord rate-limit 429. Esperando ' + waitSec + 's SIN reiniciar...');
                await new Promise(r => setTimeout(r, waitSec * 1000));
                continue;
              }
              if (!res.ok) {
                startupLog('Preflight no OK: ' + bodyText.slice(0, 150));
              }
            } catch (pfErr) {
              logger.warn('Preflight error: ' + (pfErr?.message || pfErr));
            }
          }

          startupLog('Login attempt ' + attempt + '...');
          await this.login(tok);
          loggedIn = true;
          startupLog('Discord login successful');
        } catch (loginErr) {
          const msg = String(loginErr?.message || loginErr);
          logger.error('Login FAILED: ' + msg);
          let waitSec = 180;
          if (/429|rate|blocked|timeout/i.test(msg)) waitSec = 600;
          if (/token|401|invalid/i.test(msg)) waitSec = 900;
          startupLog('Reintentando login en ' + waitSec + 's (proceso vivo)...');
          await new Promise(r => setTimeout(r, waitSec * 1000));
        }
      }

      startupLog('Registering slash commands...');
      await this.registerCommands();
      startupLog('Slash commands registration complete');

      try {
        const st = this.db?.getStatus?.();
        if (st?.isDegraded) {
          await avisarAltoComando(
            this,
            'Base de datos en modo degradado',
            'MongoDB no esta plenamente operativo. El bot sigue en linea pero puede perder datos. Revisa MongoDB Atlas.'
          );
        }
        if (mongoose.connection.readyState !== 1) {
          await avisarAltoComando(
            this,
            'MongoDB (Mongoose) desconectado',
            'mongoose.connection.readyState != 1 tras el arranque. Sesiones/staff pueden fallar.'
          );
        }
      } catch (_) {}

      const databaseMode = dbStatus.isDegraded
        ? 'Optional in-memory mode (data resets after restart)'
        : 'Connected (persistent data enabled)';
      const handlerSummary = `${this.buttons.size} buttons, ${this.selectMenus.size} menus, ${this.modals.size} modals`;
      startupLog(
        `ONLINE ✅ | ${this.commands.size} commands loaded | ${handlerSummary} | Database: ${databaseMode}`
      );

      this.setupCronJobs();
      this.setupOportunidades();
      this.setupRecordatorioEstado();
      this.setupCiudadanoDelDia();
    } catch (error) {
      logger.error('Failed to start bot:', error);
      startupLog('Proceso en modo espera (web server activo). Discord offline temporalmente.');
      setTimeout(() => {
        startupLog('Reintentando arranque en 10 min...');
        this.start().catch(e => logger.error(e));
      }, 10 * 60 * 1000);
    }
  }

  startWebServer() {
    const app = express();
    const configuredPort = Number(this.config.api?.port || process.env.PORT || 3000);
    const maxPortRetryAttempts = Number(process.env.PORT_RETRY_ATTEMPTS || 5);
    const host = process.env.WEB_HOST || '0.0.0.0';
    const corsOrigin = this.config.api?.cors?.origin || '*';

    app.use((req, res, next) => {
      const allowedOrigins = Array.isArray(corsOrigin) ? corsOrigin : [corsOrigin];
      const origin = req.headers.origin;
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
      }
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      next();
    });

    app.get('/health', (req, res) => {
      const dbStatus = this.db?.getStatus?.() || { isDegraded: 'unknown' };
      res.status(200).json({
        status: 'healthy',
        online: this.isReady?.() || false,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: dbStatus.connectionType !== 'none',
          degraded: dbStatus.isDegraded,
          type: dbStatus.connectionType
        },
        mongoose: { connected: mongoose.connection.readyState === 1 }
      });
    });

    app.get('/ready', (req, res) => {
      if (this.isReady?.()) return res.status(200).json({ ready: true });
      res.status(503).json({ ready: false, reason: 'Bot not Ready' });
    });

    app.get('/', (req, res) => {
      res.status(200).json({
        message: 'TitanBot System Online',
        version: '2.0.0',
        discordReady: this.isReady?.() || false,
        timestamp: new Date().toISOString()
      });
    });

    const startServer = (port, attempt = 0) => {
      let hasStartedListening = false;
      const server = app.listen(port, host, () => {
        hasStartedListening = true;
        this.webServer = server;
        startupLog(`✅ Web Server running on ${host}:${port}`);
      });

      server.on('error', (error) => {
        const errorCode = error?.code || 'UNKNOWN_ERROR';
        if (!hasStartedListening && errorCode === 'EADDRINUSE' && attempt < maxPortRetryAttempts) {
          setTimeout(() => startServer(port + 1, attempt + 1), 250);
          return;
        }
        logger.error(`❌ Web server error on port ${port}: ${error?.message}`);
        if (!hasStartedListening) process.exit(1);
      });
    };

    startServer(configuredPort, 0);
  }

  setupCronJobs() {
    cron.schedule('0 6 * * *', () => checkBirthdays(this));
    cron.schedule('* * * * *', () => checkGiveaways(this));
    cron.schedule('*/15 * * * *', () => this.updateAllCounters());
  }

  setupOportunidades() {
    const CANAL_GENERAL_ID = '1451939726230683753';
    const programarSiguiente = () => {
      const minutosAleatorios = Math.floor(Math.random() * (180 - 60 + 1)) + 60;
      setTimeout(() => {
        lanzarOportunidadEconomica(this, CANAL_GENERAL_ID);
        programarSiguiente();
      }, minutosAleatorios * 60 * 1000);
    };
    programarSiguiente();
    startupLog('✅ Sistema de Oportunidades Económicas iniciado.');
  }

  setupRecordatorioEstado() {
    this.on('messageCreate', (message) => {
      procesarMensajeRecordatorio(message);
    });
    startupLog('✅ Sistema de Recordatorio de Estado (/00Y4n) por conteo de mensajes iniciado.');
  }

  setupCiudadanoDelDia() {
    cron.schedule('0 0 * * *', () => {
      procesarCiudadanoDelDia(this);
    });
    startupLog('✅ Sistema de Ciudadano del Día iniciado (programado diariamente a las 00:00 hs).');
  }

  async updateAllCounters() {
    if (!this.db) return;
    for (const [guildId, guild] of this.guilds.cache) {
      try {
        const counters = await getServerCounters(this, guildId);
        const validCounters = [];
        for (const counter of counters) {
          if (counter && counter.type && counter.channelId && counter.enabled !== false) {
            const channel = guild.channels.cache.get(counter.channelId);
            if (channel) {
              validCounters.push(counter);
              await updateCounter(this, guild, counter);
            }
          }
        }
        if (validCounters.length !== counters.length) {
          await saveServerCounters(this, guildId, validCounters);
        }
      } catch (error) {
        logger.error(`Error updating counters for guild ${guildId}:`, error);
      }
    }
  }

  async loadHandlers() {
    const handlers = [
      { path: 'events', type: 'default', required: true },
      { path: 'interactions', type: 'default', required: true }
    ];
    for (const handler of handlers) {
      try {
        const module = await import(`./handlers/${handler.path}.js`);
        const loaderFn = handler.type.startsWith('named:')
          ? module[handler.type.split(':')[1]]
          : module.default;
        if (typeof loaderFn === 'function') {
          await loaderFn(this);
          logger.info(`✅ Loaded ${handler.path}`);
        } else {
          throw new Error(`Invalid loader export from ${handler.path}`);
        }
      } catch (error) {
        if (handler.required) {
          logger.error(`❌ Failed to load required handler ${handler.path}:`, error.message);
          throw error;
        }
      }
    }
  }

  async registerCommands() {
    try {
      await registerSlashCommands(this, this.config.bot.guildId);
    } catch (error) {
      logger.error('Error registering commands:', error);
      try {
        await avisarAltoComando(
          this,
          'Fallo al registrar comandos slash',
          String(error?.message || error).slice(0, 1500)
        );
      } catch (_) {}
    }
  }

  async shutdown(reason = 'UNKNOWN') {
    shutdownLog(`Bot is shutting down (${reason})...`);
    try {
      cron.getTasks().forEach(task => task.stop());
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
      if (this.isReady()) {
        try { this.destroy(); } catch (_) {}
      }
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

try {
  const bot = new TitanBot();
  process.on('SIGTERM', () => bot.shutdown('SIGTERM'));
  process.on('SIGINT', () => bot.shutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    try {
      avisarAltoComando(bot, 'Error critico (uncaughtException)', String(error?.stack || error).slice(0, 1800));
    } catch (_) {}
  });
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  bot.start();
} catch (error) {
  logger.error('Fatal error during bot startup:', error);
}

export default TitanBot;
