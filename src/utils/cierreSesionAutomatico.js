import { EmbedBuilder } from 'discord.js';
import Sesion from '../../models/Session.js';
import Historial from '../../models/Historial.js';
import { logger } from './logger.js';

const URL_IMAGEN_DEFAULT =
  'https://cdn.discordapp.com/attachments/1505017301089652898/1534978855423574146/Sesion_Concluida_1.png';

/**
 * Cierra una sesión SIN sumar cuota ni horas (mensaje de inicio borrado, timeout, etc.).
 * No cuenta como sesión hecha.
 */
export async function cerrarSesionSinCuota(sesion, {
  motivo = 'El mensaje de inicio fue eliminado.',
  channel = null,
  client = null
} = {}) {
  if (!sesion) return null;

  const idInicio = String(sesion.idInicio || sesion._id || '');
  const tipo = sesion.tipo === 'meet' ? 'meet' : 'rp';
  const guildId =
    sesion.guildId ||
    channel?.guildId ||
    channel?.guild?.id ||
    null;
  const hostId = sesion.hostId || '0';

  const setPayload = {
    estado: 'cerrada',
    fechaCierre: new Date(),
    cierreForzado: true,
    cuentaParaCuota: false,
    motivoCierreForzado: motivo,
    duracionMinutos: 0,
    tipo,
    hostId
  };
  if (guildId) setPayload.guildId = guildId;

  let cerradoOk = false;

  try {
    if (sesion._id) {
      const res = await Sesion.updateOne(
        { _id: sesion._id, estado: { $in: ['esperando_reacciones', 'activa'] } },
        { $set: setPayload },
        { runValidators: false }
      );
      cerradoOk = (res.modifiedCount || 0) > 0 || (res.matchedCount || 0) > 0;

      if (!cerradoOk) {
        const res2 = await Sesion.updateOne(
          { _id: sesion._id },
          { $set: setPayload },
          { runValidators: false }
        );
        cerradoOk = (res2.modifiedCount || 0) > 0 || (res2.matchedCount || 0) > 0;
      }
    } else if (idInicio) {
      const res = await Sesion.updateOne(
        { idInicio, estado: { $in: ['esperando_reacciones', 'activa'] } },
        { $set: setPayload },
        { runValidators: false }
      );
      cerradoOk = (res.modifiedCount || 0) > 0 || (res.matchedCount || 0) > 0;
    }

    if (idInicio) {
      const check = await Sesion.findOne({ idInicio }).lean();
      if (check && check.estado !== 'cerrada') {
        await Sesion.updateOne(
          { idInicio },
          { $set: setPayload },
          { runValidators: false }
        );
        cerradoOk = true;
      } else if (check?.estado === 'cerrada') {
        cerradoOk = true;
      }
    }
  } catch (e) {
    logger.warn(`[cierreAuto] save: ${e.message}`);
    try {
      if (sesion._id) {
        await Sesion.collection.updateOne({ _id: sesion._id }, { $set: setPayload });
        cerradoOk = true;
      } else if (idInicio) {
        await Sesion.collection.updateOne({ idInicio }, { $set: setPayload });
        cerradoOk = true;
      }
    } catch (e2) {
      logger.warn(`[cierreAuto] save raw: ${e2.message}`);
    }
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
          sinHoras: true,
          cerradoOk
        }
      });
    } catch (e) {
      logger.warn(`[cierreAuto] historial: ${e.message}`);
    }
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
        `> *No cuenta para cuota ni horas de staff.*\n` +
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

  logger.info(
    `[cierreAuto] Sesión ${idInicio} cerrada sin cuota (ok=${cerradoOk}). Motivo: ${motivo}`
  );
  return sesion;
}

/**
 * Cuando se borra el mensaje de /inicio_swfl → cerrar sesión abierta ligada a ese id.
 * Funciona aunque el mensaje sea parcial (sin message.guild hidratado).
 */
export async function manejarBorradoMensajeInicio(message) {
  if (!message?.id) return false;

  const msgId = String(message.id);

  let sesion = await Sesion.findOne({
    idInicio: msgId,
    estado: { $in: ['esperando_reacciones', 'activa'] }
  });

  if (!sesion) {
    sesion = await Sesion.findOne({ idInicio: msgId });
    if (sesion && sesion.estado === 'cerrada') return false;
  }

  if (!sesion) return false;

  const channel =
    message.channel ||
    (message.channelId && message.client
      ? await message.client.channels.fetch(message.channelId).catch(() => null)
      : null);

  await cerrarSesionSinCuota(sesion, {
    motivo: 'El mensaje de inicio (/inicio_swfl) fue eliminado.',
    channel,
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
