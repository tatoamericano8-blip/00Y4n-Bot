import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { reiniciarCuotasGuild, CANAL_STAFF_ANUNCIOS } from '../../utils/reinicioCuotas.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resetear-cuotas')
    .setDescription('Reinicia las cuotas semanales de todo el Staff (también se hace solo los domingos 22:00).')
    .setDefaultMemberPermissions(null),

  async execute(interaction) {
    const ROL_GERENTE_STAFF = '1452684893850177587';
    if (!interaction.member.roles.cache.has(ROL_GERENTE_STAFF)) {
      return interaction.reply({
        content: '❌ **Acceso denegado.** Este comando es exclusivo del rol **Gerente de Staff**.',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    try {
      const { afectados } = await reiniciarCuotasGuild(interaction.client, interaction.guild.id, {
        anunciosChannelId: CANAL_STAFF_ANUNCIOS,
        executorId: interaction.user.id,
        automatico: false
      });

      if (afectados === 0) {
        return await interaction.editReply({
          content: '<:cruz00y4n:1523041302764191844> No se modificó ningún registro de Staff (puede que ya estuvieran en 0).'
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔄 Cuotas Semanales Reiniciadas')
        .setColor(0x3498db)
        .setDescription(
          `Se han reseteado con éxito las cuotas semanales de **${afectados}** miembros del Staff.\n\n` +
            `*Las estadísticas históricas acumuladas se mantienen intactas.*\n` +
            `*También se publicó el aviso en el canal de anuncios de staff.*`
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
