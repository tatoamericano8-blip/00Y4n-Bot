import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../../../models/Staff.js';
import StaffLog from '../../../models/StaffLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cargar-cuota')
    .setDescription('Carga o añade horas, sesiones o tickets a la cuota semanal de un miembro del Staff.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(option =>
      option.setName('usuario').setDescription('El miembro del Staff').setRequired(true)
    )
    .addNumberOption(option =>
      option.setName('horas').setDescription('Horas de servicio a añadir').setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('sesiones_organizadas')
        .setDescription('Cantidad de sesiones organizadas a sumar')
        .setRequired(false)
        .setMinValue(0)
    )
    .addIntegerOption(option =>
      option
        .setName('sesiones_supervisadas')
        .setDescription('Cantidad de sesiones supervisadas a sumar')
        .setRequired(false)
        .setMinValue(0)
    )
    .addIntegerOption(option =>
      option
        .setName('tickets')
        .setDescription('Cantidad de tickets cerrados/atendidos a sumar (tickets.bot)')
        .setRequired(false)
        .setMinValue(0)
    )
    .addStringOption(option =>
      option.setName('motivo').setDescription('Motivo de la carga de cuota').setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const usuarioTarget = interaction.options.getUser('usuario');
    const horasToAdd = interaction.options.getNumber('horas') || 0;
    const sesionesOrgToAdd = interaction.options.getInteger('sesiones_organizadas') || 0;
    const sesionesSupToAdd = interaction.options.getInteger('sesiones_supervisadas') || 0;
    const ticketsToAdd = interaction.options.getInteger('tickets') || 0;
    const motivo =
      interaction.options.getString('motivo') || 'Carga manual de cuota por High Command';

    if (
      horasToAdd === 0 &&
      sesionesOrgToAdd === 0 &&
      sesionesSupToAdd === 0 &&
      ticketsToAdd === 0
    ) {
      return await interaction.editReply({
        content:
          '<:cruz00y4n:1523041302764191844> Debes especificar al menos un valor: **horas**, **sesiones_organizadas**, **sesiones_supervisadas** o **tickets**.'
      });
    }

    const guildId = interaction.guild.id;

    let staffData = await Staff.findOne({ guildId, userId: usuarioTarget.id });

    if (!staffData) {
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

    // Asegurar objetos
    if (!staffData.cuotas) staffData.cuotas = {};
    if (!staffData.estadisticasHistoricas) staffData.estadisticasHistoricas = {};

    // Cuotas semanales
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

    // Histórico
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

    const tipoLog = ticketsToAdd > 0 && horasToAdd === 0 && sesionesOrgToAdd === 0 && sesionesSupToAdd === 0
      ? 'TICKET_CERRADO'
      : 'SESION_LOG';

    await StaffLog.create({
      guildId,
      tipo: tipoLog,
      targetUserId: usuarioTarget.id,
      executorId: interaction.user.id,
      detalles: {
        horasAñadidas: horasToAdd,
        sesionesOrganizadasAñadidas: sesionesOrgToAdd,
        sesionesSupervisadasAñadidas: sesionesSupToAdd,
        ticketsAñadidos: ticketsToAdd,
        motivo
      }
    });

    const embed = new EmbedBuilder()
      .setTitle('<a:verificacion:1523027148326047878> Cuota Actualizada Exitosamente')
      .setColor(0x2ecc71)
      .setDescription(`Se ha registrado la carga de cuota para **${usuarioTarget.tag}**.`)
      .addFields(
        {
          name: '⏱️ Horas Añadidas',
          value: `> **+${horasToAdd}h** (Total semana: ${staffData.cuotas.horasServicio}h)`,
          inline: true
        },
        {
          name: '🚗 Sesiones Organizadas',
          value: `> **+${sesionesOrgToAdd}** (Total semana: ${staffData.cuotas.sesionesOrganizadas})`,
          inline: true
        },
        {
          name: '👁️ Sesiones Supervisadas',
          value: `> **+${sesionesSupToAdd}** (Total semana: ${staffData.cuotas.sesionesSupervisadas})`,
          inline: true
        },
        {
          name: '🎫 Tickets Atendidos',
          value: `> **+${ticketsToAdd}** (Total semana: ${staffData.cuotas.ticketsCerrados})`,
          inline: true
        },
        {
          name: '📝 Motivo',
          value: `> ${motivo}`,
          inline: false
        }
      )
      .setFooter({
        text: `Modificado por ${interaction.user.tag} • 00Y4n Comunidad SWFL`,
        iconURL: interaction.guild.iconURL()
      })
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }
};
