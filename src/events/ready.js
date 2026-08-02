import { Events } from 'discord.js';
import cron from 'node-cron';
import { logger, startupLog } from '../utils/logger.js';
import config from '../config/application.js';
import { reconcileReactionRoleMessages } from '../services/reactionRoleService.js';
import {
  reiniciarCuotasTodosLosGuilds,
  recordatorioCuotaMidWeek
} from '../utils/reinicioCuotas.js';
import { limpiarSuspensionesVencidas } from '../utils/gestorSesionesRestricciones.js';
import { limpiarSesionesFantasma } from '../utils/cierreSesionAutomatico.js';

const ROLE_SUSPEND_SESIONES = '1533180544630788166';

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

      // Limpieza inmediata de sesiones fantasma (abiertas > 8h)
      try {
        const n = await limpiarSesionesFantasma(client, 8);
        if (n > 0) startupLog(`✅ Sesiones fantasma cerradas al arrancar: ${n}`);
      } catch (e) {
        logger.warn('Limpieza inicial de sesiones fantasma falló:', e.message);
      }

      // Reinicio + informe semanal — Domingos 22:00 AR
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

      // Recordatorio mid-week — Miércoles 18:00 AR
      if (!client._cuotaReminderCron) {
        client._cuotaReminderCron = true;
        cron.schedule(
          '0 18 * * 3',
          () => {
            recordatorioCuotaMidWeek(client).catch(err =>
              logger.error('Error en recordatorio mid-week de cuotas:', err)
            );
          },
          { timezone: 'America/Argentina/Buenos_Aires' }
        );
        startupLog('✅ Recordatorio de cuota mid-week iniciado (Miércoles 18:00 hs Argentina).');
      }

      // Limpieza de sesiones fantasma cada hora
      if (!client._sesionesFantasmaCron) {
        client._sesionesFantasmaCron = true;
        cron.schedule('0 * * * *', () => {
          limpiarSesionesFantasma(client, 8).catch(err =>
            logger.error('Error limpiando sesiones fantasma:', err)
          );
        });
        startupLog('✅ Limpieza de sesiones fantasma iniciada (cada 1h, umbral 8h).');
      }

      // Limpiar suspensiones de sesión vencidas cada 15 minutos
      if (!client._suspendCronScheduled) {
        client._suspendCronScheduled = true;
        cron.schedule('*/15 * * * *', () => {
          limpiarSuspensionesVencidas(client, ROLE_SUSPEND_SESIONES).catch(err =>
            logger.error('Error limpiando suspensiones de sesión:', err)
          );
        });
        limpiarSuspensionesVencidas(client, ROLE_SUSPEND_SESIONES).catch(() => null);
        startupLog('✅ Limpieza de suspensiones de sesión iniciada (cada 15 min).');
      }
    } catch (error) {
      logger.error('Error in ready event:', error);
    }
  }
};
