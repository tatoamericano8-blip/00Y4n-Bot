import { EmbedBuilder } from 'discord.js';
import StaffLog from '../../../models/StaffLog.js';

export default {
  id: 'loa_rechazar',
  customId: 'loa_rechazar',
  name: 'loa_rechazar',
  async execute(interaction, client, args) {
    await interaction.deferUpdate();

    const guildId = interaction.guild.id;
    const embedOriginal = interaction.message.embeds[0];
    let userIdTarget = args ? args[0] : null;

    if (!userIdTarget && embedOriginal?.description) {
      const match = embedOriginal.description.match(/<@!?(\d+)>/) || embedOriginal.description.match(/(\d{17,19})/);
      if (match) userIdTarget = match[1];
    }

    try {
      if (userIdTarget) {
        await StaffLog.create({
          guildId,
          tipo: 'LOA_RECHAZADA',
          targetUserId: userIdTarget,
          executorId: interaction.user.id,
          detalles: { motivo: 'LOA Rechazada por Alto Comando' }
        });
      }

      const embedEditado = EmbedBuilder.from(embedOriginal)
        .setColor(0xE74C3C)
        .setTitle('❌ Solicitud de Ausencia (LOA) — RECHAZADA')
        .setFooter({ text: `Rechazada por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      await interaction.editReply({
        embeds: [embedEditado],
        components: []
      });
    } catch (error) {
      console.error('Error al rechazar LOA:', error);
      await interaction.followUp({
        content: '<:cruz00y4n:1523041302764191844> Ocurrió un error al procesar el rechazo en la base de datos.',
        ephemeral: true
      });
    }
  }
};
