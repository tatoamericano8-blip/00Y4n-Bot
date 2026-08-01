import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../../../models/Staff.js';
import StaffLog from '../../../models/StaffLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resetear-cuotas')
    .setDescription('Reinicia las cuotas semanales de todo el Staff (Ejecutar al final de la semana).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    const guildId = interaction.guild.id;

    try {
      const listaStaff = await Staff.find({ guildId });

      if (!listaStaff || listaStaff.length === 0) {
        return await interaction.editReply({
          content: '<:cruz00y4n:1523041302764191844> No hay registros de Staff para reinicio.'
        });
      }

      const resultado = await Staff.updateMany(
        { guildId },
        {
          $set: {
            'cuotas.horasServicio': 0,
            'cuotas.sesionesOrganizadas': 0,
            'cuotas.sesionesSupervisadas': 0,
            'cuotas.ticketsCerrados': 0
          }
        }
      );

      await StaffLog.create({
        guildId,
        tipo: 'CUOTA_RESET',
        targetUserId: interaction.user.id,
        executorId: interaction.user.id,
        detalles: {
          motivo: 'Reinicio semanal de cuotas',
          usuariosAfectados: resultado.modifiedCount
        }
      });

      const embed = new EmbedBuilder()
        .setTitle('🔄 Cuotas Semanales Reiniciadas')
        .setColor(0x3498DB)
        .setDescription(
          `Se han reseteado con éxito las cuotas semanales de **${resultado.modifiedCount}** miembros del Staff.\n\n` +
            `*Las estadísticas históricas acumuladas se mantienen intactas.*`
        )
        .setFooter({ text: `Ejecutado por ${interaction.user.tag}` })
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error al resetear cuotas:', error);
      return await interaction.editReply({
        content: '<:cruz00y4n:1523041302764191844> Ocurrió un error al intentar reinicializar las cuotas.'
      });
    }
  }
};
