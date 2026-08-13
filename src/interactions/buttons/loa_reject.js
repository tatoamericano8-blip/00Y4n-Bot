import { EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';

async function cargarModelo(nombre, ruta1, ruta2) {
  if (mongoose.models[nombre]) return mongoose.models[nombre];
  try {
    const mod = await import(ruta1);
    return mod.default || mod;
  } catch {
    try {
      const mod = await import(ruta2);
      return mod.default || mod;
    } catch {
      return null;
    }
  }
}

export default {
  id: 'loa_reject',
  customId: 'loa_reject',
  name: 'loa_reject',
  async execute(interaction, client, args) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate().catch(() => {});
    }

    const guildId = interaction.guildId;
    const embedOriginal = interaction.message?.embeds?.[0];
    let userIdTarget = args && args.length > 0 ? args[0] : null;

    if (!userIdTarget && embedOriginal?.description) {
      const match =
        embedOriginal.description.match(/<@!?(\d+)>/) ||
        embedOriginal.description.match(/(\d{17,19})/);
      if (match) userIdTarget = match[1];
    }

    try {
      const StaffLog = await cargarModelo(
        'StaffLog',
        '../../../models/StaffLog.js',
        '../../../models/StaffLog.js'
      );

      if (StaffLog && userIdTarget) {
        await StaffLog.create({
          guildId,
          tipo: 'LOA_RECHAZADA',
          targetUserId: userIdTarget,
          executorId: interaction.user.id,
          detalles: { motivo: 'LOA Rechazada por Alto Comando' }
        }).catch(() => {});
      }

      const embedEditado = EmbedBuilder.from(embedOriginal || {})
        .setColor(0xe74c3c)
        .setTitle('❌ Solicitud de Ausencia (LOA) — RECHAZADA')
        .setFooter({
          text: `Rechazada por ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        });

      await interaction.editReply({
        embeds: [embedEditado],
        components: []
      });
    } catch (error) {
      console.error('Error procesando rechazo LOA:', error);
      await interaction.followUp({
        content:
          '<:cruz00y4n:1523041302764191844> Ocurrió un error al procesar el rechazo.',
        ephemeral: true
      });
    }
  }
};
