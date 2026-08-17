import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import Sesion from '../../../models/Session.js';

const ROL_STAFF = '1512120103771050005';

const IMAGEN_DEFAULT =
  'https://cdn.discordapp.com/attachments/1529288674091466805/1535400100820549712/Link_regenerado_1.png';

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
  data: {
    name: 'regenerar_swfl',
    description: 'Anuncia que el link del servidor fue regenerado (RP o Car Meet).',
    options: [
      {
        name: 'link',
        description: 'Link privado de Roblox (Staff Link del embed).',
        type: ApplicationCommandOptionType.String,
        required: true
      }
    ]
  },

  async execute(interaction) {
    const esStaff =
      interaction.member.roles.cache.has(ROL_STAFF) ||
      interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

    if (!esStaff) {
      return interaction.reply({
        content: '❌ **Sin permisos:** solo el Staff puede regenerar el link del servidor.',
        flags: MessageFlags.Ephemeral
      });
    }

    const linkSesion = normalizarLink(interaction.options.getString('link'));
    if (!linkSesion) {
      return interaction.reply({
        content: '❌ El link no es válido. Pegá la URL completa del servidor privado de Roblox.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.reply({
      content: '🔄 Link regenerado. Bloqueando el acceso anterior y publicando el aviso…',
      flags: MessageFlags.Ephemeral
    });

    try {
      const mensajesRecientes = await interaction.channel.messages.fetch({ limit: 100 });
      const ultimoAnuncioConBotones = mensajesRecientes.find(
        (m) =>
          m.author.id === interaction.client.user.id &&
          m.components?.length > 0 &&
          m.components.some((row) =>
            row.components?.some(
              (c) =>
                c.customId === 'verificar_voto_swfl' ||
                c.customId === 'verificar_reinvite_swfl' ||
                c.customId === 'verificar_reinvite_meet_swfl' ||
                (typeof c.customId === 'string' &&
                  (c.customId.startsWith('link_') || c.customId === 'staff_link_regenerar'))
            )
          )
      );

      if (ultimoAnuncioConBotones) {
        const botonBloqueado = new ButtonBuilder()
          .setCustomId(`link_bloqueado_${Date.now()}`)
          .setLabel('Link Regenerado')
          .setEmoji('1534938648665915577')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true);

        await ultimoAnuncioConBotones.edit({
          components: [new ActionRowBuilder().addComponents(botonBloqueado)]
        });
      }
    } catch (error) {
      console.error('[regenerar] Error al bloquear botón viejo:', error);
    }

    const textoDescripcion =
      `<:dot:1534938142665084938> Se ha **regenerado el link del servidor**.\n` +
      `Sean pacientes: las re-invitaciones se harán en los próximos **30 minutos**.\n` +
      `Molestar al host para pedir el link resultará en un **timeout**.`;

    const embedRegen = new EmbedBuilder()
      .setTitle('Southwest Florida 00Y4n — Link del Servidor Regenerado')
      .setDescription(textoDescripcion)
      .setColor('#74d4fc')
      .setImage(IMAGEN_DEFAULT)
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    const filaStaff = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('staff_link_regenerar')
        .setLabel('Staff Link')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Secondary)
    );

    const msgAviso = await interaction.channel.send({
      embeds: [embedRegen],
      components: [filaStaff]
    });

    global.coleccionSesiones = global.coleccionSesiones || new Map();
    global.coleccionReinvites = global.coleccionReinvites || new Map();
    global.coleccionReinvitesMeet = global.coleccionReinvitesMeet || new Map();
    global.coleccionStaffLinks = global.coleccionStaffLinks || new Map();

    global.coleccionStaffLinks.set(msgAviso.id, linkSesion);
    global.coleccionReinvites.set(msgAviso.id, linkSesion);
    global.coleccionReinvitesMeet.set(msgAviso.id, linkSesion);

    for (const [msgId, data] of global.coleccionSesiones.entries()) {
      if (data?.guildId && data.guildId !== interaction.guildId) continue;
      global.coleccionSesiones.set(msgId, { ...data, linkSesion });
    }

    global.coleccionSesiones.set(msgAviso.id, {
      linkSesion,
      guildId: interaction.guildId,
      tipo: 'regenerado',
      actualizadoEn: Date.now()
    });

    try {
      const res = await Sesion.updateMany(
        {
          guildId: interaction.guildId,
          estado: { $in: ['activa', 'esperando_reacciones'] }
        },
        { $set: { linkSesion, linkRegeneradoEn: new Date() } }
      );
      if (!(res?.modifiedCount || res?.nModified)) {
        const ultima = await Sesion.findOne({ guildId: interaction.guildId })
          .sort({ fechaLanzamiento: -1, updatedAt: -1 })
          .exec();
        if (ultima) {
          ultima.linkSesion = linkSesion;
          ultima.linkRegeneradoEn = new Date();
          await ultima.save();
        }
      }
    } catch (e) {
      console.error('[regenerar] DB:', e?.message || e);
    }
  }
};
