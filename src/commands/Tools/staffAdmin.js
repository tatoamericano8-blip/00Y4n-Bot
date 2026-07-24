import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Staff from '../models/Staff.js';
import { logger } from '../utils/logger.js';

// Rol permitido para gestionar al Staff (Alto Mando)
const ID_ROL_ALTO_MANDO = '1451956429345919008'; 

export default {
  data: new SlashCommandBuilder()
    .setName('staff-admin')
    .setDescription('Sistema de administración interna de Staff.')
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
        .setName('solicitar-loa')
        .setDescription('Solicita un permiso de ausencia (Leave of Absence).')
        .addIntegerOption(opt => opt.setName('dias').setDescription('Días de ausencia').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Razón del permiso').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('perfil')
        .setDescription('Consulta el expediente y registro de un Staff.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Miembro a consultar').setRequired(false))
    ),

  async execute(interaction) {
    try {
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guild.id;

      // 🔹 SUBCOMANDO: SOLICITAR LOA (Cualquier miembro de Staff)
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
            { name: '👤 Usuario', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📅 Duración', value: `${dias} días`, inline: true },
            { name: '📝 Motivo', value: motivo }
          )
          .setTimestamp();

        return await interaction.reply({ embeds: [embedLoa] });
      }

      // 🔒 VERIFICACIÓN DE ALTO MANDO PARA OTROS SUBCOMANDOS
      if (!interaction.member.roles.cache.has(ID_ROL_ALTO_MANDO)) {
        return await interaction.reply({
          content: '❌ **Acceso denegado:** Se requiere rango de Alto Mando para ejecutar esta acción.',
          ephemeral: true
        });
      }

      // 🔹 SUBCOMANDO: STRIKE
      if (sub === 'strike') {
        const usuario = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo');

        const staffData = await Staff.findOneAndUpdate(
          { userId: usuario.id, guildId },
          { 
            $push: { strikes: { motivo, aplicadoPor: interaction.user.id } } 
          },
          { upsert: true, new: true }
        );

        const totalStrikes = staffData.strikes.length;

        const embedStrike = new EmbedBuilder()
          .setTitle('⚠️ Sanción a Staff Aplicada')
          .setColor('#E74C3C')
          .addFields(
            { name: '👤 Miembro', value: `<@${usuario.id}>`, inline: true },
            { name: '📊 Total Strikes', value: `${totalStrikes}/3`, inline: true },
            { name: '📝 Motivo', value: motivo },
            { name: '🛡️ Sancionado por', value: `<@${interaction.user.id}>` }
          )
          .setTimestamp();

        return await interaction.reply({ embeds: [embedStrike] });
      }

      // 🔹 SUBCOMANDO: DESPEDIR (TERMINATE)
      if (sub === 'despedir') {
        const usuario = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo');

        await Staff.findOneAndDelete({ userId: usuario.id, guildId });

        const embedDespido = new EmbedBuilder()
          .setTitle('🛑 Despido de Staff (Terminate)')
          .setColor('#900C3F')
          .addFields(
            { name: '👤 Usuario Despedido', value: `<@${usuario.id}>`, inline: true },
            { name: '📝 Motivo del Despido', value: motivo },
            { name: '🛡️ Autorizado por', value: `<@${interaction.user.id}>` }
          )
          .setTimestamp();

        return await interaction.reply({ embeds: [embedDespido] });
      }

      // 🔹 SUBCOMANDO: PERFIL
      if (sub === 'perfil') {
        const objetivo = interaction.options.getUser('usuario') || interaction.user;
        const staffData = await Staff.findOne({ userId: objetivo.id, guildId });

        if (!staffData) {
          return await interaction.reply({ content: '❌ El usuario no tiene expediente de Staff registrado.', ephemeral: true });
        }

        const embedPerfil = new EmbedBuilder()
          .setTitle(`📂 Expediente de Staff: ${objetivo.username}`)
          .setColor('#2ECC71')
          .addFields(
            { name: '🎖️ Rango', value: staffData.rango, inline: true },
            { name: '⚠️ Strikes Activos', value: `${staffData.strikes.length}`, inline: true },
            { name: '🌴 Estado LOA', value: staffData.loa.activo ? '🟢 Ausente' : '🔴 Activo', inline: true },
            { name: '⏱️ Horas de Servicio', value: `${staffData.cuotas.horasServicio} hrs`, inline: true },
            { name: '📅 Sesiones Organizadas', value: `${staffData.cuotas.sesionesOrganizadas}`, inline: true }
          )
          .setTimestamp();

        return await interaction.reply({ embeds: [embedPerfil] });
      }

    } catch (error) {
      logger.error('Error en el comando staff-admin:', error);
      return await interaction.reply({ content: '❌ Ocurrió un error al ejecutar la acción de administración.', ephemeral: true });
    }
  }
};
