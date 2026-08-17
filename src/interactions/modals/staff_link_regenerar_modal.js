import { EmbedBuilder, MessageFlags } from 'discord.js';
import Sesion from '../../../models/Sesion.js';

const ROL_STAFF = '1512120103771050005';

function normalizarLink(raw) {
  let link = String(raw || '').trim();
  if (!link) return null;
  if (!link.startsWith('http://') && !link.startsWith('https://')) {
    link = `https://${link}`;
  }
  try {
    new URL(link);
    return link;
  } catch {
    return null;
  }
}

export default {
  name: 'staff_link_regenerar_modal',

  async execute(interaction) {
    const esStaff =
      interaction.member?.roles?.cache?.has(ROL_STAFF) ||
      interaction.memberPermissions?.has('ManageMessages');

    if (!esStaff) {
      return interaction.reply({
        content: '🔒 Solo el **Staff** puede cargar el link.',
        flags: MessageFlags.Ephemeral
      });
    }

    const raw = interaction.fields.getTextInputValue('link_privado');
    const linkSesion = normalizarLink(raw);

    if (!linkSesion) {
      return interaction.reply({
        content: '❌ El link no es válido. Pegá la URL completa del servidor privado de Roblox.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    global.coleccionSesiones = global.coleccionSesiones || new Map();
    global.coleccionReinvites = global.coleccionReinvites || new Map();
    global.coleccionReinvitesMeet = global.coleccionReinvitesMeet || new Map();

    let actualizadosMem = 0;

    for (const [msgId, data] of global.coleccionSesiones.entries()) {
      if (data?.guildId && data.guildId !== interaction.guildId) continue;
      global.coleccionSesiones.set(msgId, { ...data, linkSesion });
      actualizadosMem += 1;
    }

    const msgIdAviso = interaction.message?.id;
    if (msgIdAviso) {
      global.coleccionSesiones.set(msgIdAviso, {
        linkSesion,
        guildId: interaction.guildId,
        tipo: 'regenerado',
        actualizadoPor: interaction.user.id,
        actualizadoEn: Date.now()
      });
      global.coleccionReinvites.set(msgIdAviso, linkSesion);
      global.coleccionReinvitesMeet.set(msgIdAviso, linkSesion);
    }

    let actualizadosDb = 0;
    try {
      const res = await Sesion.updateMany(
        {
          guildId: interaction.guildId,
          estado: { $in: ['activa', 'lanzada', 'abierta'] },
          linkSesion: { $exists: true }
        },
        { $set: { linkSesion, linkRegeneradoEn: new Date(), linkRegeneradoPor: interaction.user.id } }
      );
      actualizadosDb = res?.modifiedCount || res?.nModified || 0;

      if (actualizadosDb === 0) {
        const ultima = await Sesion.findOne({ guildId: interaction.guildId })
          .sort({ fechaLanzamiento: -1, updatedAt: -1 })
          .exec();
        if (ultima) {
          ultima.linkSesion = linkSesion;
          ultima.linkRegeneradoEn = new Date();
          ultima.linkRegeneradoPor = interaction.user.id;
          await ultima.save();
          actualizadosDb = 1;
        }
      }
    } catch (e) {
      console.error('[staff_link_regenerar] DB:', e?.message || e);
    }

    const embed = new EmbedBuilder()
      .setTitle('🔒 Staff Link actualizado')
      .setDescription(
        `El link privado quedó cargado.\n\n` +
          `**Link:** ${linkSesion}\n\n` +
          `Memoria: **${actualizadosMem}** sesión(es) · DB: **${actualizadosDb}** registro(s).\n` +
          `Los jugadores lo recibirán en la próxima re-invitación o al usar el botón de link de sesión.`
      )
      .setColor('#74d4fc')
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    return interaction.editReply({ embeds: [embed] });
  }
};
