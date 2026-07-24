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
    .setName('cuota')
    .setDescription('Consulta tu progreso de cuotas semanales de Staff.'),

  async execute(interaction) {
    try {
      const memberRoles = interaction.member.roles.cache;

      // =========================================================
      // 🛡️ VERIFICACIÓN DE SEGURIDAD: SOLO PERSONAL DE STAFF
      // =========================================================
      const esBajoMando = memberRoles.has(ID_ROL_STAFF_BAJO_MANDO);
      const esAltoMando = memberRoles.has(ID_ROL_ALTO_MANDO);

      if (!esBajoMando && !esAltoMando) {
        return await interaction.reply({
          content: '❌ **Acceso denegado:** Este comando es exclusivo para miembros del Staff.',
          ephemeral: true
        });
      }

      // Buscar el expediente en MongoDB
      const staff = await Staff.findOne({ 
        userId: interaction.user.id, 
        guildId: interaction.guild.id 
      });

      if (!staff) {
        return await interaction.reply({
          content: '❌ No tenés un expediente registrado en la base de datos de Staff.',
          ephemeral: true
        });
      }

      // Obtener datos reales y metas
      const horas = staff.cuotas?.horasServicio || 0;
      const sesiones = staff.cuotas?.sesionesOrganizadas || 0;
      const horasMeta = staff.cuotas?.horasMeta || 3;
      const sesionesMeta = staff.cuotas?.sesionesMeta || 2;

      // Evaluaciones
      const cumpleHoras = horas >= horasMeta ? '✅' : '❌';
      const cumpleSesiones = sesiones >= sesionesMeta ? '✅' : '❌';
      const cuotaCumplida = horas >= horasMeta && sesiones >= sesionesMeta;

      const embed = new EmbedBuilder()
        .setTitle(`📊 Cuota Semanal — ${interaction.user.username}`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setColor(cuotaCumplida ? '#2ECC71' : '#E74C3C')
        .addFields(
          { name: `${cumpleHoras} Horas de Servicio`, value: `${horas} de ${horasMeta} hrs`, inline: true },
          { name: `${cumpleSesiones} Sesiones Organizadas`, value: `${sesiones} de ${sesionesMeta}`, inline: true },
          { name: '📌 Estado General', value: cuotaCumplida ? '🟢 **CUOTA CUMPLIDA**' : '🔴 **INCOMPLETA**', inline: false }
        )
        .setFooter({ text: 'Rendimiento semanal del Staff' })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      logger.error('Error en el comando cuota:', error);
      return await interaction.reply({
        content: '❌ Ocurrió un error al consultar tu cuota semanal.',
        ephemeral: true
      });
    }
  }
};
