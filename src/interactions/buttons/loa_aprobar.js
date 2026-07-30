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
  id: 'loa_approve',
  customId: 'loa_approve',
  name: 'loa_approve',
  async execute(interaction, client, args) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate().catch(() => {});
    }

    const guildId = interaction.guildId;
    const embedOriginal = interaction.message?.embeds?.[0];
    let userIdTarget = args && args.length > 0 ? args[0] : null;

    if (!userIdTarget && embedOriginal?.description) {
      const match = embedOriginal.description.match(/<@!?(\d+)>/) || embedOriginal.description.match(/(\d{17,19})/);
      if (match) userIdTarget = match[1];
    }

    if (!userIdTarget) {
      return await interaction.followUp({
        content: '<:cruz00y4n:1523041302764191844> No se pudo determinar el ID del usuario solicitante.',
        ephemeral: true
      });
    }

    try {
      const Staff = await cargarModelo('Staff', '../models/Staff.js', '../../models/Staff.js');
      const StaffLog = await cargarModelo('StaffLog', '../models/StaffLog.js', '../../models/StaffLog.js');

      if (Staff) {
        await Staff.findOneAndUpdate(
          { guildId, userId: userIdTarget },
          { 
            $set: { 
              estado: 'LOA',
              'loa.activo': true,
              'loa.fechaInicio': new Date()
            }
          },
          { upsert: true, new: true }
        );
      }

      if (StaffLog) {
        await StaffLog.create({
          guildId,
          tipo: 'LOA_APROBADA',
          targetUserId: userIdTarget,
          executorId: interaction.user.id,
          detalles: { motivo: 'LOA Aprobada por Alto Comando' }
        }).catch(() => {});
      }

      const embedEditado = EmbedBuilder.from(embedOriginal || {})
        .setColor(0x2ECC71)
        .setTitle('✅ Solicitud de Ausencia (LOA) — APROBADA')
        .setFooter({ text: `Aprobada por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      await interaction.editReply({
        embeds: [embedEditado],
        components: []
      });
    } catch (error) {
      console.error('Error procesando aprobación LOA:', error);
      await interaction.followUp({
        content: '<:cruz00y4n:1523041302764191844> Ocurrió un error al procesar la aprobación.',
        ephemeral: true
      });
    }
  }
};
