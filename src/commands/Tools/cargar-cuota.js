import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../../../models/Staff.js';
import StaffLog from '../../../models/StaffLog.js';
import { formatearHoras } from '../../utils/formatearTiempo.js';
import { programarRefreshClasificacion } from '../../utils/clasificacionStaffLive.js';

const ROLE_LOA = '1532459272690991318';
const CHANNEL_LOA = '1505015938544701490';

async function aplicarCambioCuota(interaction, signo) {
  try {
    const usuarioTarget = interaction.options.getUser('usuario');
    const horasEnterasOpt = interaction.options.getInteger('horas');
    const minutosOpt = interaction.options.getInteger('minutos');
    const sesionesOrgOpt = interaction.options.getInteger('sesiones_organizadas');
    const sesionesSupOpt = interaction.options.getInteger('sesiones_supervisadas');
    const ticketsOpt = interaction.options.getInteger('tickets');
    const motivo =
      interaction.options.getString('motivo') ||
      (signo > 0
        ? 'Carga manual de cuota por High Command'
        : 'Remoción manual de cuota (error / prueba / entrenamiento)');

    const h = horasEnterasOpt == null ? 0 : Number(horasEnterasOpt);
    const m = minutosOpt == null ? 0 : Number(minutosOpt);
    const horasDecimal = h + m / 60;

    const sesionesOrgRaw = sesionesOrgOpt == null ? 0 : Number(sesionesOrgOpt);
    const sesionesSupRaw = sesionesSupOpt == null ? 0 : Number(sesionesSupOpt);
    const ticketsRaw = ticketsOpt == null ? 0 : Number(ticketsOpt);

    const sinTiempo = horasEnterasOpt == null && minutosOpt == null;
    const sinSesiones =
      sesionesOrgOpt == null && sesionesSupOpt == null && ticketsOpt == null;

    if (sinTiempo && sinSesiones) {
      return interaction.editReply({
        content:
          'Debes especificar al menos un valor.\n' +
          'Ejemplo tiempo: `horas: 2` + `minutos: 41`  ·  sesiones: `1`'
      });
    }

    if (horasDecimal === 0 && sesionesOrgRaw === 0 && sesionesSupRaw === 0 && ticketsRaw === 0) {
      return interaction.editReply({
        content:
          'El valor debe ser mayor a **0**.\n' +
          'Ejemplo: `horas: 3` y `minutos: 56` para restar **3h 56 min**.'
      });
    }

    const horasToAdd = signo * Math.abs(horasDecimal);
    const sesionesOrgToAdd = signo * Math.abs(sesionesOrgRaw);
    const sesionesSupToAdd = signo * Math.abs(sesionesSupRaw);
    const ticketsToAdd = signo * Math.abs(ticketsRaw);

    const textoTiempoIngresado =
      h > 0 || m > 0
        ? `${h > 0 ? `${h}h` : ''}${h > 0 && m > 0 ? ' ' : ''}${m > 0 ? `${m} min` : ''}`.trim()
        : '0';

    const guildId = interaction.guild.id;
    let staffData = await Staff.findOne({ guildId, userId: usuarioTarget.id });

    if (!staffData) {
      if (signo < 0) {
        return interaction.editReply({
          content: `**${usuarioTarget.tag}** no tiene registro de Staff para restar cuota.`
        });
      }
      staffData = new Staff({
        guildId,
        userId: usuarioTarget.id,
        cuotas: {
          horasServicio: 0,
          sesionesOrganizadas: 0,
          sesionesSupervisadas: 0,
          ticketsCerrados: 0
        },
        estadisticasHistoricas: {
          horasTotales: 0,
          sesionesHosteadasTotales: 0,
          sesionesSupervisadasTotales: 0,
          ticketsCerradosTotales: 0
        }
      });
    }

    if (!staffData.cuotas) staffData.cuotas = {};
    if (!staffData.estadisticasHistoricas) staffData.estadisticasHistoricas = {};

    staffData.cuotas.horasServicio = Math.max(
      0,
      (Number(staffData.cuotas.horasServicio) || 0) + horasToAdd
    );
    staffData.cuotas.sesionesOrganizadas = Math.max(
      0,
      (Number(staffData.cuotas.sesionesOrganizadas) || 0) + sesionesOrgToAdd
    );
    staffData.cuotas.sesionesSupervisadas = Math.max(
      0,
      (Number(staffData.cuotas.sesionesSupervisadas) || 0) + sesionesSupToAdd
    );
    staffData.cuotas.ticketsCerrados = Math.max(
      0,
      (Number(staffData.cuotas.ticketsCerrados) || 0) + ticketsToAdd
    );

    staffData.estadisticasHistoricas.horasTotales = Math.max(
      0,
      (Number(staffData.estadisticasHistoricas.horasTotales) || 0) + horasToAdd
    );
    staffData.estadisticasHistoricas.sesionesHosteadasTotales = Math.max(
      0,
      (Number(staffData.estadisticasHistoricas.sesionesHosteadasTotales) || 0) +
        sesionesOrgToAdd
    );
    staffData.estadisticasHistoricas.sesionesSupervisadasTotales = Math.max(
      0,
      (Number(staffData.estadisticasHistoricas.sesionesSupervisadasTotales) || 0) +
        sesionesSupToAdd
    );
    staffData.estadisticasHistoricas.ticketsCerradosTotales = Math.max(
      0,
      (Number(staffData.estadisticasHistoricas.ticketsCerradosTotales) || 0) +
        ticketsToAdd
    );

    await staffData.save();
    try {
      programarRefreshClasificacion(interaction.client, interaction.guildId);
    } catch (_) {}

    try {
      await StaffLog.create({
        guildId,
        tipo: signo > 0 ? 'CUOTA_SUMADA' : 'CUOTA_REMOVIDA',
        targetUserId: usuarioTarget.id,
        executorId: interaction.user.id,
        detalles: {
          accion: signo > 0 ? 'sumar' : 'remover',
          horasEnteras: h,
          minutos: m,
          horasDecimal: horasToAdd,
          sesionesOrganizadas: sesionesOrgToAdd,
          sesionesSupervisadas: sesionesSupToAdd,
          tickets: ticketsToAdd,
          motivo
        }
      });
    } catch (logErr) {
      console.error('[cargar-cuota] StaffLog falló (cuota sí se guardó):', logErr.message);
    }

    const prefijo = signo > 0 ? '+' : '−';
    const titulo = signo > 0 ? 'Cuota Añadida' : 'Cuota Removida';
    const color = signo > 0 ? 0x2ecc71 : 0xed4245;

    const embed = new EmbedBuilder()
      .setTitle(titulo)
      .setColor(color)
      .setDescription(
        `Se ha **${signo > 0 ? 'añadido' : 'restado'}** cuota para **${usuarioTarget.tag}**.`
      )
      .addFields(
        {
          name: 'Tiempo',
          value: `> **${prefijo}${textoTiempoIngresado}** → Semana: **${formatearHoras(staffData.cuotas.horasServicio)}**`,
          inline: true
        },
        {
          name: 'Sesiones Organizadas',
          value: `> **${signo > 0 ? '+' : '−'}${Math.abs(sesionesOrgToAdd)}** → Semana: **${staffData.cuotas.sesionesOrganizadas}**`,
          inline: true
        },
        {
          name: 'Sesiones Supervisadas',
          value: `> **${signo > 0 ? '+' : '−'}${Math.abs(sesionesSupToAdd)}** → Semana: **${staffData.cuotas.sesionesSupervisadas}**`,
          inline: true
        },
        {
          name: 'Tickets',
          value: `> **${signo > 0 ? '+' : '−'}${Math.abs(ticketsToAdd)}** → Semana: **${staffData.cuotas.ticketsCerrados}**`,
          inline: true
        },
        {
          name: 'Motivo',
          value: `> ${motivo}`,
          inline: false
        }
      )
      .setFooter({
        text: `Por ${interaction.user.tag} · 00Y4n Comunidad SWFL`,
        iconURL: interaction.guild.iconURL()
      })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('[cargar-cuota] Error:', error);
    return interaction
      .editReply({
        content: `Error al modificar la cuota: \`${error.message}\``
      })
      .catch(() => null);
  }
}

async function cambiarEstadoLoa(interaction) {
  try {
    const usuarioTarget = interaction.options.getUser('usuario');
    const accion = interaction.options.getString('accion');
    const motivo =
      interaction.options.getString('motivo') ||
      (accion === 'finalizar'
        ? 'Regreso anticipado de LOA'
        : 'LOA aplicada manualmente por High Command');

    const guildId = interaction.guild.id;
    let staffData = await Staff.findOne({ guildId, userId: usuarioTarget.id });

    if (!staffData) {
      staffData = new Staff({
        guildId,
        userId: usuarioTarget.id,
        estado: 'ACTIVO',
        loa: { activo: false, historial: [] }
      });
    }

    if (!staffData.loa) staffData.loa = { activo: false, historial: [] };
    if (!Array.isArray(staffData.loa.historial)) staffData.loa.historial = [];

    const member = await interaction.guild.members.fetch(usuarioTarget.id).catch(() => null);
    const canalLoa = await interaction.guild.channels.fetch(CHANNEL_LOA).catch(() => null);

    if (accion === 'finalizar') {
      if (staffData.estado !== 'LOA' && !staffData.loa.activo) {
        return interaction.editReply({
          content: `**${usuarioTarget.tag}** no está en LOA actualmente (estado: \`${staffData.estado || 'ACTIVO'}\`).`
        });
      }

      const inicioAnterior = staffData.loa.inicio || staffData.loa.fechaInicio || null;

      staffData.estado = 'ACTIVO';
      staffData.loa.activo = false;
      staffData.loa.fin = new Date();
      staffData.loa.historial.push({
        inicio: inicioAnterior || new Date(),
        fin: new Date(),
        motivo,
        solicitadoEn: inicioAnterior || new Date()
      });

      await staffData.save();
      try {
        programarRefreshClasificacion(interaction.client, interaction.guildId);
      } catch (_) {}

      if (member) {
        await member.roles.remove(ROLE_LOA).catch(() => null);
      }

      try {
        await StaffLog.create({
          guildId,
          tipo: 'LOA_FIN',
          targetUserId: usuarioTarget.id,
          executorId: interaction.user.id,
          detalles: { motivo, anticipado: true }
        });
      } catch (e) {
        console.error('[cargar-cuota loa] StaffLog:', e.message);
      }

      const embed = new EmbedBuilder()
        .setTitle('LOA Finalizada — Staff Activo')
        .setColor(0x57f287)
        .setThumbnail(usuarioTarget.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `> **Staff:** <@${usuarioTarget.id}>\n` +
            `> **Estado nuevo:** \`ACTIVO\`\n` +
            `> **Motivo:** ${motivo}\n` +
            `> **Finalizado por:** <@${interaction.user.id}>`
        )
        .setFooter({ text: '00Y4n Comunidad SWFL · Sistema de Ausencias' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      if (canalLoa?.isTextBased()) {
        await canalLoa
          .send({
            content: `<@${usuarioTarget.id}>`,
            embeds: [embed]
          })
          .catch(() => null);
      }

      return;
    }

    if (staffData.estado === 'LOA' && staffData.loa.activo) {
      return interaction.editReply({
        content: `**${usuarioTarget.tag}** ya está en LOA.`
      });
    }

    staffData.estado = 'LOA';
    staffData.loa.activo = true;
    staffData.loa.inicio = new Date();
    staffData.loa.fin = null;
    staffData.loa.motivo = motivo;

    await staffData.save();
    try {
      programarRefreshClasificacion(interaction.client, interaction.guildId);
    } catch (_) {}

    if (member) {
      await member.roles.add(ROLE_LOA).catch(() => null);
    }

    try {
      await StaffLog.create({
        guildId,
        tipo: 'LOA_INICIO',
        targetUserId: usuarioTarget.id,
        executorId: interaction.user.id,
        detalles: { motivo, manual: true }
      });
    } catch (e) {
      console.error('[cargar-cuota loa] StaffLog:', e.message);
    }

    const embed = new EmbedBuilder()
      .setTitle('LOA Activada')
      .setColor(0xf1c40f)
      .setThumbnail(usuarioTarget.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `> **Staff:** <@${usuarioTarget.id}>\n` +
          `> **Estado nuevo:** \`LOA\`\n` +
          `> **Motivo:** ${motivo}\n` +
          `> **Activado por:** <@${interaction.user.id}>`
      )
      .setFooter({ text: '00Y4n Comunidad SWFL · Sistema de Ausencias' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    if (canalLoa?.isTextBased()) {
      await canalLoa
        .send({
          content: `<@${usuarioTarget.id}>`,
          embeds: [embed]
        })
        .catch(() => null);
    }
  } catch (error) {
    console.error('[cargar-cuota loa] Error:', error);
    return interaction
      .editReply({
        content: `Error al cambiar LOA: \`${error.message}\``
      })
      .catch(() => null);
  }
}

function opcionesCuota(sub) {
  return sub
    .addUserOption(o =>
      o.setName('usuario').setDescription('El miembro del Staff').setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName('horas')
        .setDescription('Cantidad de horas exactas (ej: 2)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(168)
    )
    .addIntegerOption(o =>
      o
        .setName('minutos')
        .setDescription('Cantidad de minutos exactos (ej: 41)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(59)
    )
    .addIntegerOption(o =>
      o
        .setName('sesiones_organizadas')
        .setDescription('Sesiones organizadas (host)')
        .setRequired(false)
        .setMinValue(1)
    )
    .addIntegerOption(o =>
      o
        .setName('sesiones_supervisadas')
        .setDescription('Sesiones supervisadas')
        .setRequired(false)
        .setMinValue(1)
    )
    .addIntegerOption(o =>
      o
        .setName('tickets')
        .setDescription('Tickets cerrados/atendidos')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption(o =>
      o.setName('motivo').setDescription('Motivo del cambio').setRequired(false)
    );
}

export default {
  data: new SlashCommandBuilder()
    .setName('cargar-cuota')
    .setDescription('Gestiona cuota semanal y estado LOA del Staff.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      opcionesCuota(
        sub.setName('sumar').setDescription('Sumar tiempo, sesiones o tickets a la cuota.')
      )
    )
    .addSubcommand(sub =>
      opcionesCuota(
        sub
          .setName('remover')
          .setDescription('Restar tiempo, sesiones o tickets (error, prueba o entrenamiento).')
      )
    )
    .addSubcommand(sub =>
      sub
        .setName('loa')
        .setDescription('Activar o finalizar LOA de un miembro del Staff.')
        .addUserOption(o =>
          o.setName('usuario').setDescription('El miembro del Staff').setRequired(true)
        )
        .addStringOption(o =>
          o
            .setName('accion')
            .setDescription('Qué querés hacer con la LOA?')
            .setRequired(true)
            .addChoices(
              { name: 'Finalizar LOA (volver a Activo)', value: 'finalizar' },
              { name: 'Activar LOA', value: 'activar' }
            )
        )
        .addStringOption(o =>
          o.setName('motivo').setDescription('Motivo del cambio de estado').setRequired(false)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();

    if (sub === 'loa') {
      return cambiarEstadoLoa(interaction);
    }

    const signo = sub === 'remover' ? -1 : 1;
    return aplicarCambioCuota(interaction, signo);
  }
};
