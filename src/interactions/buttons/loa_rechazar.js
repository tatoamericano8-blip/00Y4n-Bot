import { EmbedBuilder } from 'discord.js';
import StaffLog from '../../../models/StaffLog.js';

export default {
  customId: 'loa_rechazar',
  async execute(interaction, client, args) {
    await interaction.deferUpdate();

    const guildId = interaction.guild.id;
    const embedOriginal = interaction.message.embeds[0];
    let userIdTarget = args[0];

    if (!userIdTarget && embedOriginal?.description) {
      const match = embedOriginal.description.match(/<@!?(\d+)>/) || embedOriginal.description.match(/(\d{17,19})/);
      if (match) userIdTarget = match[1];
    }

    // Registrar rechazo en auditoría
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
  }
};
