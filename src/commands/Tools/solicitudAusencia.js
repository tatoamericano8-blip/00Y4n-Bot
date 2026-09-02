import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';

const ROLE_STAFF = '1512120103771050005';
const CHANNEL_LOA = '1505015938544701490';

function normalizarFechaId(str) {
  return String(str || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/\//g, '-');
}

export default {
  data: new SlashCommandBuilder()
    .setName('solicitud-ausencia')
    .setDescription('Solicita una licencia de ausencia (LOA) para revisión de Alto Comando.')
    .addStringOption(opt =>
      opt
        .setName('inicio')
        .setDescription('Fecha de inicio (ej. 02/09 o 02-09).')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('fin')
        .setDescription('Fecha de regreso (ej. 12/09 o 12-09).')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('motivo')
        .setDescription('Motivo detallado de la ausencia.')
        .setRequired(true)
        .setMaxLength(500)
    ),

  async execute(interaction) {
    try {
      if (!interaction.guild) {
        return interaction.reply({
          content: 'Este comando solo se puede usar dentro del servidor.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (!interaction.member.roles.cache.has(ROLE_STAFF)) {
        return interaction.reply({
          content: 'Solo el personal con rol de **Staff** puede solicitar licencias.',
          flags: MessageFlags.Ephemeral
        });
      }

      const fechaInicio = interaction.options.getString('inicio', true).trim();
      const fechaFin = interaction.options.getString('fin', true).trim();
      const motivo = interaction.options.getString('motivo', true).trim();

      if (!fechaInicio || !fechaFin || !motivo) {
        return interaction.reply({
          content: 'Debés completar **inicio**, **fin** y **motivo**.',
          flags: MessageFlags.Ephemeral
        });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      let loaChannel =
        interaction.guild.channels.cache.get(CHANNEL_LOA) ||
        (await interaction.guild.channels.fetch(CHANNEL_LOA).catch(() => null));

      if (!loaChannel || !loaChannel.isTextBased?.()) {
        return interaction.editReply({
          content:
            `No se encontró el canal de solicitudes de LOA (\`${CHANNEL_LOA}\`).\n` +
            `Avisá a un administrador para revisar la configuración del bot.`
        });
      }

      const me = interaction.guild.members.me;
      if (me) {
        const perms = loaChannel.permissionsFor(me);
        if (perms && !perms.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
          return interaction.editReply({
            content:
              `No tengo permisos para enviar mensajes en <#${CHANNEL_LOA}>.\n` +
              `Necesito: Ver canal, Enviar mensajes y Insertar enlaces.`
          });
        }
      }

      const embedSolicitud = new EmbedBuilder()
        .setTitle('Solicitud de Ausencia (LOA)')
        .setColor('#f1c40f')
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
        .setDescription(
          `> **Solicitante:** <@${interaction.user.id}> (\`${interaction.user.id}\`)\n` +
            `> **Inicio:** \`${fechaInicio}\` | **Fin:** \`${fechaFin}\`\n` +
            `> **Motivo:** ${motivo}\n\n` +
            `*Un miembro de Alto Comando debe revisar esta solicitud.*`
        )
        .setFooter({ text: '00Y4n Comunidad SWFL \u00b7 Sistema de Ausencias' })
        .setTimestamp();

      const inicioId = normalizarFechaId(fechaInicio);
      const finId = normalizarFechaId(fechaFin);
      const botones = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`loa_approve:${interaction.user.id}:${inicioId}:${finId}`)
          .setLabel('Aprobar LOA')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`loa_reject:${interaction.user.id}`)
          .setLabel('Rechazar')
          .setStyle(ButtonStyle.Danger)
      );

      await loaChannel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [embedSolicitud],
        components: [botones]
      });

      return interaction.editReply({
        content: `Tu solicitud de LOA fue enviada a <#${CHANNEL_LOA}> para revisión.`
      });
    } catch (error) {
      console.error('[solicitud-ausencia] Error:', error);
      const msg =
        'No se pudo enviar la solicitud de LOA. Revisá permisos del bot en el canal de ausencias o contactá a un administrador.\n' +
        `Detalle: \`${error?.message || 'error desconocido'}\``;
      try {
        if (interaction.deferred || interaction.replied) {
          return interaction.editReply({ content: msg });
        }
        return interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
      } catch (_) {
        return null;
      }
    }
  }
};
