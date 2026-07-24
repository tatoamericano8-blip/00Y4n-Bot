import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Staff from '../../../models/Staff.js';
import { logger } from '../utils/logger.js';

// -------------------------------------------------------------
// 🔑 CONFIGURACIÓN DE ROLES DE STAFF
// -------------------------------------------------------------
const ID_ROL_STAFF_BAJO_MANDO = '1528870664612614184'; // Coloca aquí la ID del rol de Staff Junior / Bajo Mando
const ID_ROL_ALTO_MANDO = '1528870731629465752'; // ID del rol de Alto Mando

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
      const esAltoMando = memberRoles.has(ID_ROL_ALTO_MANDO);

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

        await Staff.findOneAndUpdate(
          { userId: interaction.user.id, guildId },
          { loa: { activo: true, inicio, fin, motivo } },
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
        const staffData = await Staff.findOne({ userId: objetivo.id, guildId });

        if (!staffData) {
          return await interaction.reply({
            content: '❌ El usuario no tiene un expediente de Staff registrado.',
            ephemeral: true
          });
        }

        const horas = staffData.cuotas?.horasServicio || 0;
        const sesiones = staffData.cuotas?.sesionesOrganizadas || 0;
        const horasMeta = staffData.cuotas?.horasMeta || 3;
        const sesionesMeta = staffData.cuotas?.sesionesMeta || 2;

        const cumpleCuota = horas >= horasMeta && sesiones >= sesionesMeta;

        const embedPerfil = new EmbedBuilder()
          .setTitle(`📂 Expediente de Staff — ${objetivo.username}`)
          .setThumbnail(objetivo.displayAvatarURL())
          .setColor(cumpleCuota ? '#2ECC71' : '#E74C3C')
          .addFields(
            { name: '🎖️ Rango', value: staffData.rango || 'Staff Trainee', inline: true },
            { name: '⚠️ Strikes Activos', value: `${staffData.strikes ? staffData.strikes.length : 0}/3`, inline: true },
            { name: '🌴 Estado LOA', value: staffData.loa?.activo ? '🟢 Ausente' : '🔴 Activo', inline: true },
            { name: '⏱️ Horas Trabajadas', value: `${horas} / ${horasMeta} hrs`, inline: true },
            { name: '🚗 Sesiones Hosteadas', value: `${sesiones} / ${sesionesMeta}`, inline: true },
            { name: '📌 Estado de Cuota', value: cumpleCuota ? '✅ **CUMPLIDA**' : '❌ **INCOMPLETA**', inline: true }
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

        const staffData = await Staff.findOneAndUpdate(
          { userId: usuario.id, guildId },
          { 
            $push: { strikes: { motivo, aplicadoPor: interaction.user.id, fecha: new Date() } } 
          },
          { upsert: true, new: true }
        );

        const totalStrikes = staffData.strikes.length;
        const riesgoExpulsion = totalStrikes >= 3 ? '\n⚠️ **¡ATENCIÓN! El usuario alcanzó el límite máximo de 3 strikes.**' : '';

        const embedStrike = new EmbedBuilder()
          .setTitle('⚠️ Sanción a Staff Aplicada')
          .setColor('#E74C3C')
          .setDescription(`Se ha registrado una sanción oficial.${riesgoExpulsion}`)
          .addFields(
            { name: '👤 Staff Sancionado', value: `<@${usuario.id}>`, inline: true },
            { name: '📊 Total Strikes', value: `${totalStrikes}/3`, inline: true },
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

        await Staff.findOneAndDelete({ userId: usuario.id, guildId });

        const embedDespido = new EmbedBuilder()
          .setTitle('🛑 Despido de Staff (Terminate)')
          .setColor('#900C3F')
          .setDescription(`El usuario ha sido desvinculado del equipo de Staff y su expediente fue archivado.`)
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

        const campoActualizar = tipo === 'horas' ? 'cuotas.horasServicio' : 'cuotas.sesionesOrganizadas';

        const staffActualizado = await Staff.findOneAndUpdate(
          { userId: usuario.id, guildId },
          { $inc: { [campoActualizar]: cantidad } },
          { upsert: true, new: true }
        );

        const horas = staffActualizado.cuotas.horasServicio;
        const sesiones = staffActualizado.cuotas.sesionesOrganizadas;

        const embedLog = new EmbedBuilder()
          .setTitle('📊 Registro de Cuota Actualizado')
          .setColor('#3498DB')
          .setDescription(`Se añadieron **+${cantidad} ${tipo}** al historial de <@${usuario.id}>.`)
          .addFields(
            { name: '⏱️ Horas Totales', value: `${horas} / ${staffActualizado.cuotas.horasMeta || 3} hrs`, inline: true },
            { name: '🚗 Sesiones Totales', value: `${sesiones} / ${staffActualizado.cuotas.sesionesMeta || 2}`, inline: true }
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
            'cuotas.horasMeta': horasMeta,
            'cuotas.sesionesMeta': sesionesMeta
          },
          { upsert: true, new: true }
        );

        return await interaction.reply({
          content: `✅ Metas de cuota para <@${usuario.id}> actualizadas: **${horasMeta} hrs de servicio** y **${sesionesMeta} sesiones** por semana.`
        });
      }

      // 🔹 REINICIAR CUOTAS SEMANALES (RESET-CUOTAS)
      if (sub === 'reset-cuotas') {
        await Staff.updateMany(
          { guildId },
          { $set: { 'cuotas.horasServicio': 0, 'cuotas.sesionesOrganizadas': 0 } }
        );

        const embedReset = new EmbedBuilder()
          .setTitle('🔄 Reinicio de Cuotas Semanales')
          .setColor('#2ECC71')
          .setDescription('Se han reiniciado los contadores de **horas de servicio** y **sesiones organizadas** de todo el equipo de Staff.')
          .setFooter({ text: 'Semana limpia iniciada correctamente.' })
          .setTimestamp();

        return await interaction.reply({ embeds: [embedReset] });
      }

    } catch (error) {
      logger.error('Error en el comando staff-admin:', error);
      return await interaction.reply({
        content: '❌ Ocurrió un error al procesar la solicitud de administración.',
        ephemeral: true
      });
    }
  }
};
