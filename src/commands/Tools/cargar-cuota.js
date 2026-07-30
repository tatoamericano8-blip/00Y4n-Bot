import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../../../models/Staff.js';
import StaffLog from '../../../models/StaffLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cargar-cuota')
    .setDescription('Carga o añade horas/sesiones a la cuota semanal de un miembro del Staff.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(option =>
      option.setName('usuario').setDescription('El miembro del Staff').setRequired(true)
    )
    .addNumberOption(option =>
      option.setName('horas').setDescription('Horas de servicio a añadir').setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('sesiones_organizadas').setDescription('Cantidad de sesiones organizadas a sumar').setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('sesiones_supervisadas').setDescription('Cantidad de sesiones supervisadas a sumar').setRequired(false)
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
    const motivo = interaction.options.getString('motivo') || 'Carga manual de cuota por High Command';

    if (horasToAdd === 0 && sesionesOrgToAdd === 0 && sesionesSupToAdd === 0) {
      return await interaction.editReply({
        content: '<:cruz00y4n:1523041302764191844> Debes especificar al menos un valor para añadir (horas, sesiones organizadas o supervisadas).'
      });
    }

    const guildId = interaction.guild.id;

    // Buscar o crear perfil del Staff
    let staffData = await Staff.findOne({ guildId, userId: usuarioTarget.id });

    if (!staffData) {
      staffData = new Staff({
        guildId,
        userId: usuarioTarget.id,
        cuotas: { horasServicio: 0, sesionesOrganizadas: 0, sesionesSupervisadas: 0 }
      });
    }

    // Actualizar Cuotas Semanales
    staffData.cuotas.horasServicio = Math.max(0, (staffData.cuotas.horasServicio || 0) + horasToAdd);
    staffData.cuotas.sesionesOrganizadas = Math.max(0, (staffData.cuotas.sesionesOrganizadas || 0) + sesionesOrgToAdd);
    staffData.cuotas.sesionesSupervisadas = Math.max(0, (staffData.cuotas.sesionesSupervisadas || 0) + sesionesSupToAdd);

    // Actualizar Estadísticas Históricas Totales
    staffData.estadisticasHistoricas.horasTotales = Math.max(0, (staffData.estadisticasHistoricas.horasTotales || 0) + horasToAdd);
    staffData.estadisticasHistoricas.sesionesHosteadasTotales = Math.max(0, (staffData.estadisticasHistoricas.sesionesHosteadasTotales || 0) + sesionesOrgToAdd);
    staffData.estadisticasHistoricas.sesionesSupervisadasTotales = Math.max(0, (staffData.estadisticasHistoricas.sesionesSupervisadasTotales || 0) + sesionesSupToAdd);

    await staffData.save();

    // Registrar la auditoría en StaffLog
    await StaffLog.create({
      guildId,
      tipo: 'SESION_LOG',
      targetUserId: usuarioTarget.id,
      executorId: interaction.user.id,
      detalles: {
        horasAñadidas: horasToAdd,
        sesionesOrganizadasAñadidas: sesionesOrgToAdd,
        sesionesSupervisadasAñadidas: sesionesSupToAdd,
        motivo
      }
    });

    const embed = new EmbedBuilder()
      .setTitle('<a:verificacion:1523027148326047878> Cuota Actualizada Exitosamente')
      .setColor(0x2ECC71)
      .setDescription(`Se ha registrado la carga de cuota para **${usuarioTarget.tag}**.`)
      .addFields(
        { name: '⏱️ Horas Añadidas', value: `> **+${horasToAdd}h** (Total semana: ${staffData.cuotas.horasServicio}h)`, inline: true },
        { name: '🚗 Sesiones Organizadas', value: `> **+${sesionesOrgToAdd}** (Total semana: ${staffData.cuotas.sesionesOrganizadas})`, inline: true },
        { name: '👁️ Sesiones Supervisadas', value: `> **+${sesionesSupToAdd}** (Total semana: ${staffData.cuotas.sesionesSupervisadas})`, inline: true },
        { name: '📝 Motivo', value: `> ${motivo}`, inline: false }
      )
      .setFooter({ text: `Modificado por ${interaction.user.tag}` })
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }
};
