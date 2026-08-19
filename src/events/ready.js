import '../utils/parcheColorEmbed.js'; // Color centralizado
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
import { limpiarLoaVencidas } from '../utils/gestorLoa.js';
import { procesarCobrosSeguros } from '../utils/gestorTienda.js';
import { procesarMultasVencidas } from '../utils/gestorMultas.js';

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

      try {
        const n = await limpiarSesionesFantasma(client, 8);
        if (n > 0) startupLog(`✅ Sesiones fantasma cerradas al arrancar: ${n}`);
      } catch (e) {
        logger.warn('Limpieza inicial de sesiones fantasma falló:', e.message);
      }

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

      if (!client._sesionesFantasmaCron) {
        client._sesionesFantasmaCron = true;
        cron.schedule('0 * * * *', () => {
          limpiarSesionesFantasma(client, 8).catch(err =>
            logger.error('Error limpiando sesiones fantasma:', err)
          );
        });
        startupLog('✅ Limpieza de sesiones fantasma iniciada (cada 1h, umbral 8h).');
      }

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

      if (!client._loaCronScheduled) {
        client._loaCronScheduled = true;
        cron.schedule('15 * * * *', () => {
          limpiarLoaVencidas(client).catch(err =>
            logger.error('Error limpiando LOAs vencidas:', err)
          );
        });
        limpiarLoaVencidas(client).catch(() => null);
        startupLog('✅ Limpieza de LOAs vencidas iniciada (cada 1h).');
      }

      if (!client._tiendaSeguroCron) {
        client._tiendaSeguroCron = true;
        cron.schedule('20 * * * *', () => {
          procesarCobrosSeguros(client).catch(err =>
            logger.error('Error cobrando seguros de tienda:', err)
          );
        });
        startupLog('✅ Sistema de cobro de seguros de tienda iniciado (cada 1h).');
      }

      if (!client._multasWarrantCron) {
        client._multasWarrantCron = true;
        const runMultas = () =>
          procesarMultasVencidas(client)
            .then((n) => {
              if (n > 0) logger.info(`[WARRANT] Órdenes aplicadas por multas vencidas: ${n}`);
            })
            .catch((err) => logger.error('Error procesando multas vencidas:', err));
        cron.schedule('5 * * * *', runMultas);
        runMultas();
        startupLog('✅ Sistema de órdenes por multas vencidas iniciado (cada 1h + al arrancar).');
      }
    } catch (error) {
      logger.error('Error in ready event:', error);
    }
  }
};
