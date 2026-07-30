import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import crypto from 'crypto';
import Staff from '../../../models/Staff.js';
import { logger } from '../../utils/logger.js';

// -------------------------------------------------------------
// 🔑 CONFIGURACIÓN DE ROLES DE STAFF
// -------------------------------------------------------------
const ID_ROL_STAFF_BAJO_MANDO = '1528870664612614184'; // ID Staff Junior / Bajo Mando
const ID_ROL_ALTO_MANDO = '1528870731629465752';       // ID Alto Mando

export default {
  data: new SlashCommandBuilder()
    .setName('staff-admin')
    .setDescription('Sistema de administración e historial interno de Staff.')
    // Subcomandos generales
    .addSubcommand(sub =>
      sub
        .setName('perfil')
        .setDescription('Consulta el expediente y registro de un Staff.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Miembro a consultar').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('solicitar-loa')
        .setDescription('Solicita un permiso de ausencia temporal (Leave of Absence).')
        .addIntegerOption(opt => opt.setName('dias').setDescription('Días de ausencia').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Razón del permiso').setRequired(true))
    )
    // Subcomandos de Alto Mando
    .addSubcommand(sub =>
      sub
        .setName('strike')
        .setDescription('Aplica una sanción / strike a un miembro del Staff.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Miembro del Staff').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Razón del strike').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('despedir')
        .setDescription('Despide definitivamente a un miembro del Staff (Terminate).')
        .addUserOption(opt => opt.setName('usuario').setDescription('Miembro a despedir').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Razón del despido').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('log-cuota')
        .setDescription('Suma horas de servicio o sesiones trabajadas a un Staff.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Miembro del Staff').setRequired(true))
        .addStringOption(opt =>
          opt
            .setName('tipo')
            .setDescription('Tipo de actividad a registrar')
            .setRequired(true)
            .addChoices(
              { name: '⏱️ Horas de Servicio', value: 'horas' },
              { name: '🚗 Sesiones Organizadas', value: 'sesiones' }
            )
        )
        .addNumberOption(opt => opt.setName('cantidad').setDescription('Cantidad a sumar (ej: 1, 1.5, 2)').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('set-metas')
        .setDescription('Establece las metas mínimas de cuota para un Staff.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Miembro del Staff').setRequired(true))
        .addNumberOption(opt => opt.setName('horas_meta').setDescription('Mínimo de horas semanales').setRequired(true))
        .addIntegerOption(opt => opt.setName('sesiones_meta').setDescription('Mínimo de sesiones semanales').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('reset-cuotas')
        .setDescription('Reinicia los contadores de horas y sesiones de todo el Staff (Inicio de semana).')
    ),

  async execute(interaction) {
    try {
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guild.id;
      const memberRoles = interaction.member.roles.cache;

      // =========================================================
      // 🛡️ CANDADO 1: VERIFICACIÓN GENERAL DE PERTENENCIA A STAFF
      // =========================================================
      const esBajoMando = memberRoles.has(ID_ROL_STAFF_BAJO_MANDO);
      const esAltoMando = memberRoles.has(ID_ROL_ALTO_MANDO) || interaction.member.permissions.has(PermissionFlagsBits.Administrator);

      if (!esBajoMando && !esAltoMando) {
        return await interaction.reply({
          content: '❌ **Acceso denegado:** No formás parte del equipo de Staff.',
          ephemeral: true
        });
      }

      // =========================================================
      // 🟢 SUBCOMANDOS PARA TODO EL STAFF (Bajo y Alto Mando)
      // =========================================================

      // 🔹 SOLICITAR LOA
      if (sub === 'solicitar-loa') {
        const dias = interaction.options.getInteger('dias');
        const motivo = interaction.options.getString('motivo');

        const inicio = new Date();
        const fin = new Date();
        fin.setDate(inicio.getDate() + dias);

        const loaObj = { inicio, fin, motivo };

        await Staff.findOneAndUpdate(
          { userId: interaction.user.id, guildId },
          {
            $set: {
              estado: 'LOA',
              'loa.activo': true,
              'loa.inicio': inicio,
              'loa.fin': fin,
              'loa.motivo': motivo
            },
            $push: { 'loa.historial': loaObj }
          },
          { upsert: true, new: true }
        );

        const embedLoa = new EmbedBuilder()
          .setTitle('🌴 Permiso de Ausencia (LOA) Registrado')
          .setColor('#F1C40F')
          .addFields(
            { name: '👤 Staff', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📅 Duración', value: `${dias} días`, inline: true },
            { name: '📝 Motivo', value: motivo },
            { name: '📆 Reincorporación', value: `<t:${Math.floor(fin.getTime() / 1000)}:R>` }
          )
          .setFooter({ text: 'Notificado al Alto Mando.' })
          .setTimestamp();

        return await interaction.reply({ embeds: [embedLoa] });
      }

      // 🔹 CONSULTAR PERFIL / EXPEDIENTE
      if (sub === 'perfil') {
        const objetivo = interaction.options.getUser('usuario') || interaction.user;
        let staffData = await Staff.findOne({ userId: objetivo.id, guildId });

        if (!staffData) {
          return await interaction.reply({
            content: '❌ El usuario no tiene un expediente de Staff registrado.',
            ephemeral: true
          });
        }

        // Auto-expiración de LOA si ya pasó la fecha de fin
        if (staffData.loa?.activo && new Date() > new Date(staffData.loa.fin)) {
          staffData.loa.activo = false;
          staffData.estado = 'ACTIVO';
          await staffData.save();
        }

        const horas = staffData.cuotas?.horasServicio || 0;
        const sesiones = staffData.cuotas?.sesionesOrganizadas || 0;
        const horasMeta = staffData.cuotas?.horasMeta || 3;
        const sesionesMeta = staffData.cuotas?.sesionesMeta || 2;

        const cumpleCuota = horas >= horasMeta && sesiones >= sesionesMeta;
        const strikesActivos = staffData.strikes ? staffData.strikes.filter(s => s.activo).length : 0;

        let estadoTexto = '🟢 ACTIVO';
        if (staffData.estado === 'LOA') estadoTexto = '🌴 EN LICENCIA (LOA)';
        if (staffData.estado === 'DESPEDIDO') estadoTexto = '🔴 DESPEDIDO';
        if (staffData.estado === 'RENUNCIADO') estadoTexto = '⚪ RENUNCIADO';

        const embedPerfil = new EmbedBuilder()
          .setTitle(`📂 Expediente de Staff — ${objetivo.username}`)
          .setThumbnail(objetivo.displayAvatarURL())
          .setColor(staffData.estado === 'DESPEDIDO' ? '#900C3F' : cumpleCuota ? '#2ECC71' : '#E74C3C')
          .addFields(
            { name: '🎖️ Rango', value: staffData.rango || 'Staff Trainee', inline: true },
            { name: '📌 Estado General', value: estadoTexto, inline: true },
            { name: '⚠️ Strikes Activos', value: `${strikesActivos}/3`, inline: true },
            { name: '⏱️ Horas Trabajadas', value: `${horas} / ${horasMeta} hrs`, inline: true },
            { name: '🚗 Sesiones Hosteadas', value: `${sesiones} / ${sesionesMeta}`, inline: true },
            { name: '📊 Cumplimiento', value: cumpleCuota ? '✅ **CUMPLIDA**' : '❌ **INCOMPLETA**', inline: true },
            { name: '🌐 Histórico Total', value: `⏱️ ${staffData.estadisticasHistoricas?.horasTotales || 0} hrs | 🚗 ${staffData.estadisticasHistoricas?.sesionesHosteadasTotales || 0} sesiones`, inline: false }
          )
          .setTimestamp();

        return await interaction.reply({ embeds: [embedPerfil] });
      }

      // =========================================================
      // 🔴 CANDADO 2: SUBCOMANDOS EXCLUSIVOS DE ALTO MANDO
      // =========================================================
      if (!esAltoMando) {
        return await interaction.reply({
          content: '❌ **Acceso denegado:** Este subcomando requiere rango de **Alto Mando**.',
          ephemeral: true
        });
      }

      // 🔹 APLICAR STRIKE
      if (sub === 'strike') {
        const usuario = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo');

        const nuevoStrike = {
          idStrike: `STK-${crypto.randomUUID().substring(0, 5).toUpperCase()}`,
          motivo,
          aplicadoPor: interaction.user.id,
          fecha: new Date(),
          activo: true
        };

        const staffData = await Staff.findOneAndUpdate(
          { userId: usuario.id, guildId },
          { $push: { strikes: nuevoStrike } },
          { upsert: true, new: true }
        );

        const strikesActivos = staffData.strikes.filter(s => s.activo).length;
        const riesgoExpulsion = strikesActivos >= 3 ? '\n⚠️ **¡ATENCIÓN! El usuario alcanzó el límite máximo de 3 strikes activos.**' : '';

        const embedStrike = new EmbedBuilder()
          .setTitle('⚠️ Sanción a Staff Aplicada')
          .setColor('#E74C3C')
          .setDescription(`Se ha registrado una sanción oficial con ID \`${nuevoStrike.idStrike}\`.${riesgoExpulsion}`)
          .addFields(
            { name: '👤 Staff Sancionado', value: `<@${usuario.id}>`, inline: true },
            { name: '📊 Strikes Activos', value: `${strikesActivos}/3`, inline: true },
            { name: '📝 Motivo', value: motivo },
            { name: '🛡️ Aplicado por', value: `<@${interaction.user.id}>` }
          )
          .setTimestamp();

        return await interaction.reply({ embeds: [embedStrike] });
      }

      // 🔹 DESPEDIR (TERMINATE)
      if (sub === 'despedir') {
        const usuario = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo');

        await Staff.findOneAndUpdate(
          { userId: usuario.id, guildId },
          {
            $set: {
              estado: 'DESPEDIDO',
              despido: {
                fecha: new Date(),
                motivo,
                realizadoPor: interaction.user.id
              }
            }
          },
          { upsert: true }
        );

        const embedDespido = new EmbedBuilder()
          .setTitle('🛑 Despido de Staff (Terminate)')
          .setColor('#900C3F')
          .setDescription(`El usuario ha sido desvinculado del equipo de Staff. Se conserva su registro para auditorías futuras.`)
          .addFields(
            { name: '👤 Usuario Despedido', value: `<@${usuario.id}>`, inline: true },
            { name: '📝 Motivo del Despido', value: motivo },
            { name: '🛡️ Autorizado por', value: `<@${interaction.user.id}>` }
          )
          .setTimestamp();

        return await interaction.reply({ embeds: [embedDespido] });
      }

      // 🔹 REGISTRAR CUOTA (LOG-CUOTA)
      if (sub === 'log-cuota') {
        const usuario = interaction.options.getUser('usuario');
        const tipo = interaction.options.getString('tipo');
        const cantidad = interaction.options.getNumber('cantidad');

        const campoSemanal = tipo === 'horas' ? 'cuotas.horasServicio' : 'cuotas.sesionesOrganizadas';
        const campoHistorico = tipo === 'horas' ? 'estadisticasHistoricas.horasTotales' : 'estadisticasHistoricas.sesionesHosteadasTotales';

        const staffActualizado = await Staff.findOneAndUpdate(
          { userId: usuario.id, guildId },
          { 
            $inc: { 
              [campoSemanal]: cantidad,
              [campoHistorico]: cantidad
            } 
          },
          { upsert: true, new: true }
        );

        const horas = staffActualizado.cuotas.horasServicio;
        const sesiones = staffActualizado.cuotas.sesionesOrganizadas;

        const embedLog = new EmbedBuilder()
          .setTitle('📊 Registro de Cuota Actualizado')
          .setColor('#3498DB')
          .setDescription(`Se añadieron **+${cantidad} ${tipo}** al expediente de <@${usuario.id}>.`)
          .addFields(
            { name: '⏱️ Horas Semanales', value: `${horas} / ${staffActualizado.cuotas.horasMeta || 3} hrs`, inline: true },
            { name: '🚗 Sesiones Semanales', value: `${sesiones} / ${staffActualizado.cuotas.sesionesMeta || 2}`, inline: true }
          )
          .setTimestamp();

        return await interaction.reply({ embeds: [embedLog] });
      }

      // 🔹 AJUSTAR METAS DE CUOTA (SET-METAS)
      if (sub === 'set-metas') {
        const usuario = interaction.options.getUser('usuario');
        const horasMeta = interaction.options.getNumber('horas_meta');
        const sesionesMeta = interaction.options.getInteger('sesiones_meta');

        await Staff.findOneAndUpdate(
          { userId: usuario.id, guildId },
          {
            $set: {
              'cuotas.horasMeta': horasMeta,
              'cuotas.sesionesMeta': sesionesMeta
            }
          },
          { upsert: true, new: true }
        );

        return await interaction.reply({
          content: `✅ Metas de cuota para <@${usuario.id}> actualizadas: **${horasMeta} hrs de servicio** y **${sesionesMeta} sesiones** semanales.`
        });
      }

      // 🔹 REINICIAR CUOTAS SEMANALES (RESET-CUOTAS)
      if (sub === 'reset-cuotas') {
        await Staff.updateMany(
          { guildId },
          { $set: { 'cuotas.horasServicio': 0, 'cuotas.sesionesOrganizadas': 0, 'cuotas.sesionesSupervisadas': 0 } }
        );

        const embedReset = new EmbedBuilder()
          .setTitle('🔄 Reinicio de Cuotas Semanales')
          .setColor('#2ECC71')
          .setDescription('Se han reiniciado los contadores semanales de **horas de servicio** y **sesiones** de todo el equipo de Staff.')
          .setFooter({ text: 'Las estadísticas históricas se mantuvieron intactas.' })
          .setTimestamp();

        return await interaction.reply({ embeds: [embedReset] });
      }

    } catch (error) {
      logger.error('Error en el comando staff-admin:', error);
      return await interaction.reply({
        content: '❌ Ocurrió un error al procesar la solicitud de administración de Staff.',
        ephemeral: true
      });
    }
  }
};
