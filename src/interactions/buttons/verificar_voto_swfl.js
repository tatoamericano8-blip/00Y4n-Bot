import Sesion from '../../../models/Session.js';
import { puedeUsarSesiones, mensajeBloqueoSesiones } from '../../utils/gestorSesionesRestricciones.js';

async function resolverDatosSesion(messageId, guildId) {
  global.coleccionSesiones = global.coleccionSesiones || new Map();
  const mem = global.coleccionSesiones.get(messageId);
  if (mem?.linkSesion) {
    return { linkSesion: mem.linkSesion, idInicio: mem.idInicio || null, source: 'memory' };
  }

  try {
    let sesion = await Sesion.findOne({ idLanzamiento: messageId }).lean();
    if (!sesion && guildId) {
      sesion = await Sesion.findOne({
        guildId,
        estado: 'activa',
        linkSesion: { $nin: [null, ''] }
      })
        .sort({ fechaLanzamiento: -1 })
        .lean();
    }
    if (sesion?.linkSesion) {
      global.coleccionSesiones.set(messageId, {
        idInicio: sesion.idInicio,
        linkSesion: sesion.linkSesion,
        guildId: sesion.guildId,
        tipo: sesion.tipo
      });
      return {
        linkSesion: sesion.linkSesion,
        idInicio: sesion.idInicio || null,
        source: 'db'
      };
    }
  } catch (err) {
    console.error('[verificar_voto] Error DB:', err?.message || err);
  }

  return null;
}

async function usuarioReaccionoEnInicio(interaction, idInicio) {
  if (!idInicio) return { ok: false, sinMensaje: true };
  try {
    let msgInicio = null;
    try {
      msgInicio = await interaction.channel.messages.fetch(idInicio);
    } catch (_) {}
    if (!msgInicio && interaction.guild) {
      for (const ch of interaction.guild.channels.cache.values()) {
        if (!ch.isTextBased?.() || ch.id === interaction.channelId) continue;
        try {
          msgInicio = await ch.messages.fetch(idInicio);
          if (msgInicio) break;
        } catch (_) {}
      }
    }
    if (!msgInicio) return { ok: false, sinMensaje: true };

    if (msgInicio.partial) {
      try { await msgInicio.fetch(); } catch (_) {}
    }

    for (const reaction of msgInicio.reactions.cache.values()) {
      try {
        const users = await reaction.users.fetch();
        if (users.has(interaction.user.id)) return { ok: true, msgInicio };
      } catch (_) {}
    }
    return { ok: false, msgInicio };
  } catch {
    return { ok: false, sinMensaje: true };
  }
}

export default {
  name: 'verificar_voto_swfl',

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const checkSesion = await puedeUsarSesiones(interaction.guildId, interaction.user.id);
    if (!checkSesion.ok) {
      return interaction.editReply({ content: mensajeBloqueoSesiones(checkSesion) });
    }

    const datos = await resolverDatosSesion(interaction.message.id, interaction.guildId);
    if (!datos?.linkSesion) {
      return interaction.editReply({
        content:
          '❌ **Error de sincronización:** No se encontró el enlace de esta sesión.\nPedile al staff que vuelva a lanzar con `/lanzar_rp` o `/lanzar_meet`.'
      });
    }

    const voto = await usuarioReaccionoEnInicio(interaction, datos.idInicio);
    if (!voto.ok) {
      const linkMsg = voto.msgInicio?.url
        ? `\n\n👉 Votá acá: ${voto.msgInicio.url}`
        : '\n\n👉 Buscá el mensaje de **`/inicio_swfl`** y reaccioná.';
      return interaction.editReply({
        content:
          '❌ **No podés obtener el link todavía.**\nNo se detectó tu reacción en el mensaje de inicio (Startup).' +
          linkMsg
      });
    }

    return interaction.editReply({
      content:
        `🎉 **¡Voto verificado!** Acá tenés el acceso a la sesión:\n🔗 ${datos.linkSesion}\n\n` +
        `*Respetá las reglas y no compartas el link.*`
    });
  }
};
