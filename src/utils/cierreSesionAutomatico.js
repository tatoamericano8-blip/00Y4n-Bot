import { EmbedBuilder } from 'discord.js';
import Sesion from '../../models/Session.js';
import Historial from '../../models/Historial.js';
import { logger } from './logger.js';

const URL_IMAGEN_DEFAULT =
  'https://cdn.discordapp.com/attachments/1505017301089652898/1534978855423574146/Sesion_Concluida_1.png';

/**
 * Cierra una sesión sin sumar cuota (mensaje de inicio borrado, timeout, etc.).
 * Tolera documentos viejos incompletos (sin tipo / guildId).
 */
export async function cerrarSesionSinCuota(sesion, {
  motivo = 'El mensaje de inicio fue eliminado.',
  channel = null,
  client = null
} = {}) {
  if (!sesion) return null;

  const idInicio = sesion.idInicio || String(sesion._id || '');
  const tipo = sesion.tipo === 'meet' ? 'meet' : 'rp';
  const guildId = sesion.guildId || channel?.guildId || channel?.guild?.id || null;
  const hostId = sesion.hostId || '0';

  try {
    if (sesion._id) {
      await Sesion.updateOne(
        { _id: sesion._id },
        {
          $set: {
            estado: 'cerrada',
            fechaCierre: new Date(),
            cierreForzado: true,
            cuentaParaCuota: false,
            motivoCierreForzado: motivo,
            ...(sesion.tipo ? {} : { tipo }),
            ...(sesion.guildId ? {} : guildId ? { guildId } : {}),
            ...(sesion.hostId ? {} : { hostId })
          }
        }
      );
    } else {
      sesion.estado = 'cerrada';
      sesion.fechaCierre = new Date();
      sesion.cierreForzado = true;
      sesion.cuentaParaCuota = false;
      sesion.motivoCierreForzado = motivo;
      if (!sesion.tipo) sesion.tipo = tipo;
      if (!sesion.guildId && guildId) sesion.guildId = guildId;
      if (!sesion.hostId) sesion.hostId = hostId;
      await sesion.save();
    }
  } catch (e) {
    logger.warn(`[cierreAuto] save: ${e.message}`);
  }

  try {
    if (global.coleccionStartups?.has(idInicio)) {
      global.coleccionStartups.delete(idInicio);
    }
  } catch {}

  if (guildId && idInicio) {
    try {
      await Historial.create({
        evento: 'SESION_CERRADA_AUTO',
        mensajeId: idInicio,
        idInicio,
        guildId,
        hostId,
        hostTag: 'auto',
        tipo,
        detalles: {
          motivo,
          sinCuota: true,
          automatico: true,
          docIncompleto: !sesion.tipo || !sesion.guildId
        }
      });
    } catch (e) {
      logger.warn(`[cierreAuto] historial: ${e.message}`);
    }
  } else {
    logger.warn(
      `[cierreAuto] historial omitido (faltan guildId/idInicio) sesión=${idInicio || '?'}`
    );
  }

  const tipoTxt = tipo === 'meet' ? 'Car Meet' : 'Roleplay';
  const embed = new EmbedBuilder()
    .setColor('#74d4fc')
    .setTitle(
      `<a:cadenacora:1534954014335172729> SWFL ${tipoTxt} | Sesión Concluida <a:cadenacora:1534954014335172729>`
    )
    .setDescription(
      `Esta sesión de **${tipoTxt}** fue **terminada automáticamente**.\n\n` +
        `**Motivo:** ${motivo}\n\n` +
        `> Host: <@${hostId}>\n` +
        `> *No se preocupe si no hay sesiones en ejecución en este momento; pronto se iniciará otra.*`
    )
    .setImage(URL_IMAGEN_DEFAULT)
    .setFooter({ text: '00Y4n Comunidad Southwest Florida' })
    .setTimestamp();

  if (channel?.isTextBased?.()) {
    await channel.send({ embeds: [embed] }).catch(e =>
      logger.warn(`[cierreAuto] no se pudo enviar embed: ${e.message}`)
    );
  }

  logger.info(`[cierreAuto] Sesión ${idInicio} cerrada sin cuota. Motivo: ${motivo}`);
  return sesion;
}

export async function manejarBorradoMensajeInicio(message) {
  if (!message?.id || !message.guild) return false;

  const sesion = await Sesion.findOne({
    idInicio: message.id,
    estado: { $in: ['esperando_reacciones', 'activa'] }
  });

  if (!sesion) return false;

  await cerrarSesionSinCuota(sesion, {
    motivo: 'El mensaje de inicio (/inicio_swfl) fue eliminado.',
    channel: message.channel,
    client: message.client
  });

  return true;
}

export async function limpiarSesionesFantasma(client, horasMax = 8) {
  const limite = new Date(Date.now() - horasMax * 60 * 60 * 1000);
  const viejas = await Sesion.find({
    estado: { $in: ['esperando_reacciones', 'activa'] },
    fechaInicio: { $lt: limite }
  });

  let cerradas = 0;
  for (const sesion of viejas) {
    await cerrarSesionSinCuota(sesion, {
      motivo: `Sesión abandonada (abierta más de ${horasMax}h sin /cerrar_swfl).`,
      client
    });
    cerradas++;
  }

  if (cerradas > 0) {
    logger.info(`[cierreAuto] Limpieza fantasma: ${cerradas} sesión(es) cerradas (>${horasMax}h).`);
  }
  return cerradas;
}
