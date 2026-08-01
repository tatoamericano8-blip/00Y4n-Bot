import { EmbedBuilder } from 'discord.js';
import Staff from '../../models/Staff.js';
import StaffLog from '../../models/StaffLog.js';
import { logger } from './logger.js';

export const CANAL_STAFF_ANUNCIOS = '1505015531793678466';

/**
 * Reinicia cuotas semanales de todos los staff de un guild y anuncia.
 */
export async function reiniciarCuotasGuild(client, guildId, {
  anunciosChannelId = CANAL_STAFF_ANUNCIOS,
  executorId = null,
  automatico = true
} = {}) {
  const resultado = await Staff.updateMany(
    { guildId },
    {
      $set: {
        'cuotas.horasServicio': 0,
        'cuotas.sesionesOrganizadas': 0,
        'cuotas.sesionesSupervisadas': 0,
        'cuotas.ticketsCerrados': 0
      }
    }
  );

  const afectados = resultado.modifiedCount || 0;

  try {
    await StaffLog.create({
      guildId,
      tipo: 'CUOTA_RESET',
      targetUserId: executorId || client.user?.id || 'SYSTEM',
      executorId: executorId || client.user?.id || 'SYSTEM',
      detalles: {
        motivo: automatico ? 'Reinicio automático semanal (Domingo 22:00)' : 'Reinicio manual',
        usuariosAfectados: afectados,
        automatico
      }
    });
  } catch (e) {
    logger.warn(`StaffLog CUOTA_RESET falló: ${e.message}`);
  }

  try {
    const channel =
      client.channels.cache.get(anunciosChannelId) ||
      (await client.channels.fetch(anunciosChannelId).catch(() => null));

    if (channel?.isTextBased?.()) {
      const embed = new EmbedBuilder()
        .setTitle('🔄 Reinicio Semanal de Cuotas')
        .setColor('#74d4fc')
        .setDescription(
          automatico
            ? (
                'Se reiniciaron automáticamente las **cuotas semanales** de todo el Staff.\n\n' +
                '📅 Programado: **Domingos a las 22:00** (hora Argentina).\n' +
                '📈 El **histórico total** se mantiene intacto.\n\n' +
                `> Staff afectados: **${afectados}**\n` +
                '> Nueva semana: ¡a cumplir las metas de nuevo!'
              )
            : `Reinicio manual de cuotas.\n> Staff afectados: **${afectados}**`
        )
        .setFooter({
          text: '00Y4n Comunidad SWFL • Sistema de Cuotas',
          iconURL: channel.guild?.iconURL?.() || undefined
        })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } else {
      logger.warn(`Canal de anuncios staff no encontrado: ${anunciosChannelId}`);
    }
  } catch (e) {
    logger.error(`Error anunciando reinicio de cuotas: ${e.message}`);
  }

  return { afectados };
}

/**
 * Reinicia cuotas en todos los guilds donde está el bot.
 */
export async function reiniciarCuotasTodosLosGuilds(client) {
  let total = 0;
  for (const [guildId] of client.guilds.cache) {
    try {
      const r = await reiniciarCuotasGuild(client, guildId, { automatico: true });
      total += r.afectados;
      logger.info(`Cuotas reiniciadas en guild ${guildId}: ${r.afectados} staff`);
    } catch (e) {
      logger.error(`Error reiniciando cuotas en guild ${guildId}: ${e.message}`);
    }
  }
  return total;
}
