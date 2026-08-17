import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';

const ROL_STAFF = '1512120103771050005';

const IMAGEN_DEFAULT =
  'https://cdn.discordapp.com/attachments/1529288674091466805/1535400100820549712/Link_regenerado_1.png';

export default {
  data: {
    name: 'regenerar_swfl',
    description: 'Anuncia que el link del servidor fue regenerado (RP o Car Meet).',
    options: [
      {
        name: 'usuario',
        description: 'Host/staff que regeneró el link (si lo dejás vacío, sos vos).',
        type: ApplicationCommandOptionType.User,
        required: false
      },
      {
        name: 'imagen',
        description: 'Banner de Link Regenerado (opcional).',
        type: ApplicationCommandOptionType.Attachment,
        required: false
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

    const usuarioStaff = interaction.options.getUser('usuario') || interaction.user;
    const fotoAdjunta = interaction.options.getAttachment('imagen');

    await interaction.reply({
      content: '🔄 Bloqueando el link anterior y publicando el aviso…',
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
                (typeof c.customId === 'string' && c.customId.startsWith('link_'))
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
      `<:dot:1534938142665084938> <@${usuarioStaff.id}> ha **regenerado el link del servidor**.\n` +
      `Sean pacientes: las re-invitaciones se harán en los próximos **30 minutos**.\n` +
      `Molestar al host para pedir el link resultará en un **timeout**.`;

    const embedRegen = new EmbedBuilder()
      .setTitle('Southwest Florida 00Y4n — Link del Servidor Regenerado')
      .setDescription(textoDescripcion)
      .setColor('#74d4fc')
      .setImage(fotoAdjunta?.url || IMAGEN_DEFAULT)
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    const filaStaff = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('staff_link_regenerar')
        .setLabel('Staff Link')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.channel.send({
      content: '@everyone',
      embeds: [embedRegen],
      components: [filaStaff]
    });
  }
};
