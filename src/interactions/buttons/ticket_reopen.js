import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { reopenTicket } from '../../services/ticket.js';

const ROLE_STAFF = '1512120103771050005';

export default {
  name: 'ticket_reopen',

  async execute(interaction) {
    const esStaff =
      interaction.member.roles.cache.has(ROLE_STAFF) ||
      interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) ||
      interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);

    if (!esStaff) {
      return interaction.reply({
        content: '<:cruz00y4n:1534937767652495360> Solo el staff puede reabrir tickets.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const result = await reopenTicket(interaction.channel, interaction.user);

    if (!result.success) {
      return interaction.editReply({
        content: `<:cruz00y4n:1534937767652495360> ${result.error || 'No se pudo reabrir el ticket.'}`
      });
    }

    return interaction.editReply({
      content: '<:tilde:1534937809733812286> Ticket reabierto.'
    });
  }
};
