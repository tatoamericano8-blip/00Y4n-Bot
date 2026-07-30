import { EmbedBuilder } from 'discord.js';
import Staff from '../../../models/Staff.js';
import StaffLog from '../../../models/StaffLog.js';

export default {
  customId: 'loa_aprobar',
  async execute(interaction, client, args) {
    await interaction.deferUpdate();

    const guildId = interaction.guild.id;
    // Extraer userId desde args o buscando la mención/ID en el Embed
    const embedOriginal = interaction.message.embeds[0];
    let userIdTarget = args[0];

    if (!userIdTarget && embedOriginal?.description) {
      const match = embedOriginal.description.match(/<@!?(\d+)>/) || embedOriginal.description.match(/(\d{17,19})/);
      if (match) userIdTarget = match[1];
    }

    if (!userIdTarget) {
      return await interaction.followUp({
        content: '<:cruz00y4n:1523041302764191844> No se pudo determinar el ID del solicitante de la LOA.',
        ephemeral: true
      });
    }

    // Actualizar o Crear perfiles de Staff (upsert seguro)
    const staffData = await Staff.findOneAndUpdate(
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

    // Registrar en auditoría StaffLog
    await StaffLog.create({
      guildId,
      tipo: 'LOA_APROBADA',
      targetUserId: userIdTarget,
      executorId: interaction.user.id,
      detalles: { motivo: 'LOA Aprobada por Alto Comando' }
    });

    // Actualizar el Embed original a Aprobado
    const embedEditado = EmbedBuilder.from(embedOriginal)
      .setColor(0x2ECC71)
      .setTitle('✅ Solicitud de Ausencia (LOA) — APROBADA')
      .setFooter({ text: `Aprobada por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.editReply({
      embeds: [embedEditado],
      components: [] // Elimina los botones tras resolver
    });
  }
};
