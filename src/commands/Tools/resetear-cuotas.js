import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { reiniciarCuotasSemanales } from '../../utils/reinicioCuotas.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resetear-cuotas')
    .setDescription('Reinicia manualmente las cuotas semanales de todo el staff.')
    .setDefaultMemberPermissions(null),

  async execute(interaction) {
    const ROL_GERENTE_STAFF = '1452684893850177587';
    if (!interaction.member.roles.cache.has(ROL_GERENTE_STAFF)) {
        return interaction.reply({
            content: '❌ **Acceso denegado.** Este comando es exclusivo del rol **Gerente de Staff**.',
            ephemeral: true
        });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const resultado = await reiniciarCuotasSemanales(interaction.client);
      const embed = new EmbedBuilder()
        .setColor('#74d4fc')
        .setTitle('Cuotas reiniciadas')
        .setDescription(
          resultado?.mensaje ||
            'Se reiniciaron las cuotas semanales del staff.'
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en /resetear-cuotas:', error);
      await interaction.editReply({
        content: 'Ocurrió un error al reiniciar las cuotas.'
      });
    }
  }
};
