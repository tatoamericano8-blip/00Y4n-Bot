import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';
import Staff from '../../../models/Staff.js';
import StaffLog from '../../../models/StaffLog.js';
import { agregarBlacklistStaff } from '../../utils/gestorBlacklistStaff.js';
import { programarRefreshClasificacion } from '../../utils/clasificacionStaffLive.js';

const ROLE_HIGH_COMMAND = '1528870731629465752';
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
    .setName('staff-remover')
    .setDescription(
      'Remueve a un integrante del Staff: roles, estado en DB, clasificación, DM y blacklist opcional.'
    )
    .addUserOption((opt) =>
      opt
        .setName('usuario')
        .setDescription('Miembro a remover del equipo de Staff.')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('motivo')
        .setDescription('Motivo de la remoción (se envía al MD y queda en logs).')
        .setRequired(true)
        .setMaxLength(500)
    )
    .addStringOption((opt) =>
      opt
        .setName('tipo')
        .setDescription('Tipo de salida en el registro de Staff.')
        .setRequired(true)
        .addChoices(
          { name: 'Despedido', value: 'DESPEDIDO' },
          { name: 'Renunciado', value: 'RENUNCIADO' }
        )
    )
    .addBooleanOption((opt) =>
      opt
        .setName('blacklist')
        .setDescription('Agregarlo a la blacklist de Staff (no podrá ser recontratado)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (
      !interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: 'Solo **Alto Comando** puede remover miembros del Staff.',
        flags: MessageFlags.Ephemeral
      });
    }

    const targetUser = interaction.options.getUser('usuario', true);
    const motivo = interaction.options.getString('motivo', true).trim();
    const tipo = interaction.options.getString('tipo', true);
    const ponerBlacklist = interaction.options.getBoolean('blacklist') ?? false;

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        content: 'No podés removerte a vos mismo con este comando.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (targetUser.bot) {
      return interaction.reply({
        content: 'No podés usar este comando con un bot.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild;
    const guildId = interaction.guildId;
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    const rolesQuitados = [];
    if (targetMember) {
      for (const roleId of ROLES_A_QUITAR) {
        if (targetMember.roles.cache.has(roleId)) {
          try {
            await targetMember.roles.remove(roleId);
            rolesQuitados.push(roleId);
          } catch (_) {}
        }
      }
    }

    const ahora = new Date();
    let staffData = await Staff.findOne({ guildId, userId: targetUser.id });
    if (!staffData) {
      staffData = new Staff({
        guildId,
        userId: targetUser.id,
        estado: tipo,
        rango: 'Sin rango'
      });
    }

    staffData.estado = tipo;
    if (staffData.loa) {
      staffData.loa.activo = false;
      staffData.loa.fin = ahora;
    }
    if (typeof staffData.markModified === 'function') {
      staffData.markModified('loa');
    }
    await staffData.save();

    if (ponerBlacklist) {
      await agregarBlacklistStaff(guildId, {
        userId: targetUser.id,
        motivo,
        tipo,
        por: interaction.user.id,
        fecha: ahora.toISOString()
      });
    }

    try {
      await StaffLog.create({
        guildId,
        tipo: tipo === 'DESPEDIDO' ? 'DESPIDO' : 'RENUNCIA',
        targetUserId: targetUser.id,
        executorId: interaction.user.id,
        detalles: {
          motivo,
          blacklist: ponerBlacklist,
          rolesRemovidos: rolesQuitados.length
        }
      });
    } catch (_) {}

    try {
      programarRefreshClasificacion(interaction.client, guildId);
    } catch (_) {}

    const tipoTxt = tipo === 'DESPEDIDO' ? 'Despedido' : 'Renunciado';
    const embed = new EmbedBuilder()
      .setColor('#ed4245')
      .setTitle('Remoción de Staff')
      .setDescription(
        `> **Usuario:** <@${targetUser.id}> (\`${targetUser.id}\`)\n` +
          `> **Tipo:** **${tipoTxt}**\n` +
          `> **Motivo:** ${motivo}\n` +
          `> **Ejecutado por:** <@${interaction.user.id}>\n` +
          `> **Blacklist:** ${ponerBlacklist ? 'Sí \u2014 no podrá ser recontratado' : 'No'}\n` +
          `> **Roles removidos:** \`${rolesQuitados.length}\`\n` +
          `> **Fecha:** <t:${Math.floor(ahora.getTime() / 1000)}:F>`
      )
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setFooter({
        text: '00Y4n Comunidad SWFL \u00b7 Gestión de Staff',
        iconURL: guild.iconURL({ size: 64 }) || undefined
      })
      .setTimestamp();

    const logsChannel =
      guild.channels.cache.get(CHANNEL_LOGS) ||
      (await guild.channels.fetch(CHANNEL_LOGS).catch(() => null));
    if (logsChannel && logsChannel.isTextBased && logsChannel.isTextBased()) {
      await logsChannel.send({ embeds: [embed] }).catch(() => null);
    }

    let dmOk = false;
    try {
      await targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#ed4245')
            .setTitle('Actualización de tu estado en el Staff')
            .setDescription(
              `Tu vínculo con el equipo de Staff de **${guild.name}** fue cerrado.\n\n` +
                `**Tipo:** ${tipoTxt}\n` +
                `**Motivo:** ${motivo}\n` +
                (ponerBlacklist
                  ? '**Blacklist:** Sí. No podrás volver a formar parte del Staff de este servidor.\n'
                  : '**Blacklist:** No. Si las aplicaciones están abiertas, podrías postularte de nuevo según las normas del servidor.\n') +
                `\n**Fecha:** <t:${Math.floor(ahora.getTime() / 1000)}:F>`
            )
            .setFooter({ text: '00Y4n Comunidad SWFL' })
            .setTimestamp()
        ]
      });
      dmOk = true;
    } catch (_) {
      dmOk = false;
    }

    await interaction.editReply({
      content:
        `<@${targetUser.id}> fue removido del Staff (**${tipoTxt}**).` +
        (ponerBlacklist ? ' Quedó en **blacklist**.' : '') +
        (dmOk ? ' DM enviado.' : ' No se pudo enviar DM (cerrados o bloqueado).'),
      embeds: [embed]
    });
  }
};
