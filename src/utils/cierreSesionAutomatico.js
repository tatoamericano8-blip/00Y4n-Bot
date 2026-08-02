import { EmbedBuilder } from 'discord.js';
import Sesion from '../../models/Session.js';
import Historial from '../../models/Historial.js';
import { logger } from './logger.js';

const URL_IMAGEN_DEFAULT =
  'https://cdn.discordapp.com/attachments/1517331229303902432/1524843452494381146/Sesion_Concluida_NUEVO2_1.png';

/**
 * Cierra una sesión sin sumar cuota (mensaje de inicio borrado, timeout, etc.).
 */
export async function cerrarSesionSinCuota(sesion, {
  motivo = 'El mensaje de inicio fue eliminado.',
  channel = null,
  client = null
} = {}) {
  if (!sesion) return null;

  sesion.estado = 'cerrada';
  sesion.fechaCierre = new Date();
  sesion.cierreForzado = true;
  sesion.cuentaParaCuota = false;
  sesion.motivoCierreForzado = motivo;
  await sesion.save().catch(e => logger.warn(`[cierreAuto] save: ${e.message}`));

  // Limpiar memoria
  try {
    if (global.coleccionStartups?.has(sesion.idInicio)) {
      global.coleccionStartups.delete(sesion.idInicio);
    }
  } catch {}

  try {
    await Historial.create({
      evento: 'SESION_CERRADA_AUTO',
      mensajeId: sesion.idInicio,
      idInicio: sesion.idInicio,
      guildId: sesion.guildId,
      hostId: sesion.hostId,
      hostTag: 'auto',
      tipo: sesion.tipo,
      detalles: {
        motivo,
        sinCuota: true,
        automatico: true
      }
    });
  } catch (e) {
    logger.warn(`[cierreAuto] historial: ${e.message}`);
  }

  const tipoTxt = sesion.tipo === 'meet' ? 'Car Meet' : 'Roleplay';
  const embed = new EmbedBuilder()
    .setColor('#74d4fc')
    .setTitle(
      `<a:cadenacora:1523026520740724859> SWFL ${tipoTxt} | Sesión Concluida <a:cadenacora:1523026520740724859>`
    )
    .setDescription(
      `Esta sesión de **${tipoTxt}** fue **terminada automáticamente**.\n\n` +
        `**Motivo:** ${motivo}\n\n` +
        `> Host: <@${sesion.hostId}>\n` +
        `> *No se preocupe si no hay sesiones en ejecución en este momento; pronto se iniciará otra.*
`
    )
    .setImage(URL_IMAGEN_DEFAULT)
    .setFooter({ text: '00Y4n Comunidad Southwest Florida' })
    .setTimestamp();

  if (channel?.isTextBased?.()) {
    await channel.send({ embeds: [embed] }).catch(e =>
      logger.warn(`[cierreAuto] no se pudo enviar embed: ${e.message}`)
    );
  } else if (client && sesion.guildId) {
    try {
      const guild = await client.guilds.fetch(sesion.guildId).catch(() => null);
      // Sin canal conocido no enviamos
    } catch {}
  }

  logger.info(
    `[cierreAuto] Sesión ${sesion.idInicio} cerrada sin cuota. Motivo: ${motivo}`
  );
  return sesion;
}

/**
 * Si se borra el mensaje de /inicio_swfl y la sesión sigue abierta → cierre auto.
 */
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

/**
 * Limpia sesiones fantasma abiertas hace más de `horasMax` horas.
 * No suma cuota.
 */
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
