import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../../../models/Staff.js';
import StaffLog from '../../../models/StaffLog.js';
import { formatearHoras } from '../../utils/formatearTiempo.js';

async function aplicarCambio(interaction, signo) {
  // signo = 1 (añadir) o -1 (remover)
  const usuarioTarget = interaction.options.getUser('usuario');
  const horasRaw = interaction.options.getNumber('horas') || 0;
  const sesionesOrgRaw = interaction.options.getInteger('sesiones_organizadas') || 0;
  const sesionesSupRaw = interaction.options.getInteger('sesiones_supervisadas') || 0;
  const ticketsRaw = interaction.options.getInteger('tickets') || 0;
  const motivo =
    interaction.options.getString('motivo') ||
    (signo > 0
      ? 'Carga manual de cuota por High Command'
      : 'Remoción manual de cuota (error / prueba / entrenamiento)');

  const horasToAdd = signo * Math.abs(horasRaw);
  const sesionesOrgToAdd = signo * Math.abs(sesionesOrgRaw);
  const sesionesSupToAdd = signo * Math.abs(sesionesSupRaw);
  const ticketsToAdd = signo * Math.abs(ticketsRaw);

  if (
    horasRaw === 0 &&
    sesionesOrgRaw === 0 &&
    sesionesSupRaw === 0 &&
    ticketsRaw === 0
  ) {
    return interaction.editReply({
      content:
        '<:cruz00y4n:1523041302764191844> Debes especificar al menos un valor: **horas**, **sesiones_organizadas**, **sesiones_supervisadas** o **tickets**.'
    });
  }

  const guildId = interaction.guild.id;
  let staffData = await Staff.findOne({ guildId, userId: usuarioTarget.id });

  if (!staffData) {
    if (signo < 0) {
      return interaction.editReply({
        content: `<:cruz00y4n:1523041302764191844> **${usuarioTarget.tag}** no tiene registro de Staff para restar cuota.`
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
    (staffData.cuotas.horasServicio || 0) + horasToAdd
  );
  staffData.cuotas.sesionesOrganizadas = Math.max(
    0,
    (staffData.cuotas.sesionesOrganizadas || 0) + sesionesOrgToAdd
  );
  staffData.cuotas.sesionesSupervisadas = Math.max(
    0,
    (staffData.cuotas.sesionesSupervisadas || 0) + sesionesSupToAdd
  );
  staffData.cuotas.ticketsCerrados = Math.max(
    0,
    (staffData.cuotas.ticketsCerrados || 0) + ticketsToAdd
  );

  staffData.estadisticasHistoricas.horasTotales = Math.max(
    0,
    (staffData.estadisticasHistoricas.horasTotales || 0) + horasToAdd
  );
  staffData.estadisticasHistoricas.sesionesHosteadasTotales = Math.max(
    0,
    (staffData.estadisticasHistoricas.sesionesHosteadasTotales || 0) + sesionesOrgToAdd
  );
  staffData.estadisticasHistoricas.sesionesSupervisadasTotales = Math.max(
    0,
    (staffData.estadisticasHistoricas.sesionesSupervisadasTotales || 0) + sesionesSupToAdd
  );
  staffData.estadisticasHistoricas.ticketsCerradosTotales = Math.max(
    0,
    (staffData.estadisticasHistoricas.ticketsCerradosTotales || 0) + ticketsToAdd
  );

  await staffData.save();

  await StaffLog.create({
    guildId,
    tipo: signo > 0 ? 'SESION_LOG' : 'CUOTA_REMOVIDA',
    targetUserId: usuarioTarget.id,
    executorId: interaction.user.id,
    detalles: {
      accion: signo > 0 ? 'añadir' : 'remover',
      horas: horasToAdd,
      sesionesOrganizadas: sesionesOrgToAdd,
      sesionesSupervisadas: sesionesSupToAdd,
      tickets: ticketsToAdd,
      motivo
    }
  });

  const prefijo = signo > 0 ? '+' : '';
  const titulo =
    signo > 0
      ? '<a:verificacion:1523027148326047878> Cuota Añadida'
      : '🗑️ Cuota Removida';
  const color = signo > 0 ? 0x2ecc71 : 0xed4245;

  const embed = new EmbedBuilder()
    .setTitle(titulo)
    .setColor(color)
    .setDescription(
      `Se ha **${signo > 0 ? 'añadido' : 'restado'}** cuota para **${usuarioTarget.tag}**.`
    )
    .addFields(
      {
        name: '⏱️ Horas',
        value: `> **${prefijo}${horasToAdd}h** → Semana: **${formatearHoras(staffData.cuotas.horasServicio)}**`,
        inline: true
      },
      {
        name: '🚗 Sesiones Organizadas',
        value: `> **${prefijo}${sesionesOrgToAdd}** → Semana: **${staffData.cuotas.sesionesOrganizadas}**`,
        inline: true
      },
      {
        name: '👁️ Sesiones Supervisadas',
        value: `> **${prefijo}${sesionesSupToAdd}** → Semana: **${staffData.cuotas.sesionesSupervisadas}**`,
        inline: true
      },
      {
        name: '🎫 Tickets',
        value: `> **${prefijo}${ticketsToAdd}** → Semana: **${staffData.cuotas.ticketsCerrados}**`,
        inline: true
      },
      {
        name: '📝 Motivo',
        value: `> ${motivo}`,
        inline: false
      }
    )
    .setFooter({
      text: `Por ${interaction.user.tag} • 00Y4n Comunidad SWFL`,
      iconURL: interaction.guild.iconURL()
    })
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}

function opcionesComunes(sub) {
  return sub
    .addUserOption(o =>
      o.setName('usuario').setDescription('El miembro del Staff').setRequired(true)
    )
    .addNumberOption(o =>
      o.setName('horas').setDescription('Horas de servicio').setRequired(false)
    )
    .addIntegerOption(o =>
      o
        .setName('sesiones_organizadas')
        .setDescription('Sesiones organizadas (host)')
        .setRequired(false)
        .setMinValue(0)
    )
    .addIntegerOption(o =>
      o
        .setName('sesiones_supervisadas')
        .setDescription('Sesiones supervisadas')
        .setRequired(false)
        .setMinValue(0)
    )
    .addIntegerOption(o =>
      o
        .setName('tickets')
        .setDescription('Tickets cerrados/atendidos')
        .setRequired(false)
        .setMinValue(0)
    )
    .addStringOption(o =>
      o.setName('motivo').setDescription('Motivo del cambio').setRequired(false)
    );
}

export default {
  data: new SlashCommandBuilder()
    .setName('cargar-cuota')
    .setDescription('Añade o remueve horas, sesiones o tickets de la cuota semanal de un Staff.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      opcionesComunes(
        sub.setName('añadir').setDescription('Sumar horas, sesiones o tickets a la cuota.')
      )
    )
    .addSubcommand(sub =>
      opcionesComunes(
        sub
          .setName('remover')
          .setDescription('Restar horas, sesiones o tickets (error, prueba o entrenamiento).')
      )
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const signo = sub === 'remover' ? -1 : 1;
    return aplicarCambio(interaction, signo);
  }
};
