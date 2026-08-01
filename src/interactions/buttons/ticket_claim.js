import { MessageFlags } from 'discord.js';
import { claimTicket } from '../../services/ticket.js';

export default {
  name: 'ticket_claim',

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const result = await claimTicket(interaction.channel, interaction.user);

    if (!result.success) {
      return interaction.editReply({
        content: `❌ ${result.error || 'No se pudo reclamar el ticket.'}`
      });
    }

    return interaction.editReply({
      content: '✅ Reclamaste este ticket.'
    });
  }
};
