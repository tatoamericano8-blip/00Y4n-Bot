import { Events } from 'discord.js';
import cron from 'node-cron';
import { logger, startupLog } from '../utils/logger.js';
import config from '../config/application.js';
import { reconcileReactionRoleMessages } from '../services/reactionRoleService.js';
import { reiniciarCuotasTodosLosGuilds } from '../utils/reinicioCuotas.js';

export default {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    try {
      client.user.setPresence(config.bot.presence);

      startupLog(`Ready! Logged in as ${client.user.tag}`);
      startupLog(`Serving ${client.guilds.cache.size} guild(s)`);
      startupLog(`Loaded ${client.commands.size} commands`);

      const reconciliationSummary = await reconcileReactionRoleMessages(client);
      startupLog(
        `Reaction role reconciliation: scanned ${reconciliationSummary.scannedMessages}, removed ${reconciliationSummary.removedMessages}, errors ${reconciliationSummary.errors}`
      );

      // Reinicio automático de cuotas: Domingos 22:00 (hora Argentina)
      if (!client._cuotasCronScheduled) {
        client._cuotasCronScheduled = true;
        cron.schedule(
          '0 22 * * 0',
          () => {
            reiniciarCuotasTodosLosGuilds(client).catch(err =>
              logger.error('Error en reinicio automático de cuotas:', err)
            );
          },
          { timezone: 'America/Argentina/Buenos_Aires' }
        );
        startupLog('✅ Sistema de Reinicio de Cuotas iniciado (Domingos 22:00 hs Argentina).');
      }
    } catch (error) {
      logger.error('Error in ready event:', error);
    }
  }
};
