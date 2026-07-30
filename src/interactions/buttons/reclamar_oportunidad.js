import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

export default {
  id: 'reclamar_oportunidad',
  customId: 'reclamar_oportunidad',
  async execute(interaction, client) {
    try {
      // 1. Obtener el embed original del mensaje
      const embedOriginal = interaction.message.embeds[0];
      if (!embedOriginal) return;

      // 2. Control por si alguien intenta reclamar una ya tomada
      if (embedOriginal.description?.includes('Claimed By:')) {
        return await interaction.reply({
          content: '❌ Esta oportunidad ya ha sido reclamada por otra persona.',
          flags: MessageFlags.Ephemeral
        });
      }

      // 3. Modificar la descripción para agregar la línea "➔ Claimed By: <@ID>"
      const descripcionActualizada = `${embedOriginal.description}\n\n➔ **Claimed By:** <@${interaction.user.id}>`;

      // 4. Reconstruir el embed conservando imagen, título y formato original
      const embedModificado = EmbedBuilder.from(embedOriginal)
        .setDescription(descripcionActualizada);

      // 5. Crear el nuevo botón deshabilitado "🔒 Claimed"
      const botonReclamado = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('claimed_disabled')
          .setLabel('Claimed')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      // 6. Actualizar el mensaje original de forma atómica en Discord
      await interaction.update({
        embeds: [embedModificado],
        components: [botonReclamado]
      });

      // 7. (Opcional) Notificar al usuario que lo logró
      await interaction.followUp({
        content: '✨ ¡Has reclamado la oportunidad económica con éxito!',
        flags: MessageFlags.Ephemeral
      }).catch(() => {});

    } catch (error) {
      console.error('Error al procesar el reclamo de oportunidad:', error);
    }
  }
};
