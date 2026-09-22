import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import Staff from '../../../models/Staff.js';
import { programarRefreshClasificacion } from '../../utils/clasificacionStaffLive.js';
import { E } from '../../config/emojis.js';

/** Misma lista que /staff-remover (roles de staff relevantes) */
const ROLE_STAFF = '1512120103771050005';
const ROLE_LOA = '1532459272690991318';
const ROLE_BAJO_COMANDO = '1528870664612614184';
const CHANNEL_LOGS = '1505015805891579934';

const ROLES_A_QUITAR = [
  ROLE_STAFF,
  ROLE_LOA,
  ROLE_BAJO_COMANDO,
  '1525910197934100510',
  '1511139104912441434',
  '1498822180920889436',
  '1523834523077447811',
  '1528871575581884477',
  '1532457181696364544',
  '1532457243315011806',
  '1532457348818272506'
];

export default {
  data: new SlashCommandBuilder()
    .setName('renunciar')
    .setDescription('Permite renunciar voluntariamente al equipo administrativo.')
    .addStringOption((opt) =>
      opt.setName('motivo').setDescription('Motivo de tu renuncia.').setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ROLE_STAFF)) {
      return interaction.reply({
        content: E.cruz + ' No tienes el rol de Staff para realizar esta acción.',
        flags: MessageFlags.Ephemeral
      });
    }

    const motivo = interaction.options.getString('motivo');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const rolesQuitados = [];
      for (const roleId of ROLES_A_QUITAR) {
        if (interaction.member.roles.cache.has(roleId)) {
          try {
            await interaction.member.roles.remove(roleId, `Renuncia staff: ${motivo}`.slice(0, 512));
            rolesQuitados.push(roleId);
          } catch (_) {}
        }
      }

      let staffData = await Staff.findOne({
        guildId: interaction.guildId,
        userId: interaction.user.id
      });
      if (staffData) {
        staffData.estado = 'RENUNCIADO';
        staffData.renuncia = {
          fecha: new Date(),
          motivo
        };
        if (staffData.loa) {
          staffData.loa.activo = false;
          staffData.loa.fin = new Date();
        }
        await staffData.save();
      }

      try {
        programarRefreshClasificacion(interaction.client, interaction.guildId);
      } catch (_) {}

      const embedLog = new EmbedBuilder()
        .setTitle(E.staff_icon + ' Renuncia de Staff')
        .setColor('#fee75c')
        .setDescription(
          `> **Usuario:** <@${interaction.user.id}> (\`${interaction.user.id}\`)\n` +
            `> **Motivo:** ${motivo}\n` +
            `> **Roles quitados:** ${
              rolesQuitados.length
                ? rolesQuitados.map((id) => `<@&${id}>`).join(', ')
                : '_ninguno (o sin permisos)_'
            }\n` +
            `> **Fecha:** <t:${Math.floor(Date.now() / 1000)}:F>`
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);
      if (logsChannel) await logsChannel.send({ embeds: [embedLog] });

      await interaction.editReply({
        content:
          `${E.tilde} Tu renuncia ha sido procesada correctamente. Agradecemos tu trabajo en el equipo.` +
          (rolesQuitados.length
            ? `\nSe removieron **${rolesQuitados.length}** rol(es) de staff.`
            : '')
      });
    } catch (error) {
      console.error('Error en /renunciar:', error);
      await interaction.editReply({
        content: E.cruz + ' Ocurrió un error al procesar tu renuncia.'
      });
    }
  }
};
