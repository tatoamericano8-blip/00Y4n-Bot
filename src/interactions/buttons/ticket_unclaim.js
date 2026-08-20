import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { unclaimTicket } from '../../services/ticket.js';
import { getTicketData } from '../../utils/database.js';

const ROLE_STAFF = '1512120103771050005';
const ROLE_ALTO_COMANDO = '1528870731629465752';

export default {
  name: 'ticket_unclaim',

  async execute(interaction) {
    const esStaff =
      interaction.member.roles.cache.has(ROLE_STAFF) ||
      interaction.member.roles.cache.has(ROLE_ALTO_COMANDO) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!esStaff) {
      return interaction.reply({
        content: '<:cruz00y4n:1534937767652495360> Solo el staff puede dejar de reclamar.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let ticketData = null;
    try {
      ticketData = await getTicketData(interaction.guildId, interaction.channelId);
    } catch {}

    const claimedBy = ticketData?.claimedBy || null;
    const esClaimer = claimedBy && String(claimedBy) === String(interaction.user.id);
    const esAltoComando =
      interaction.member.roles.cache.has(ROLE_ALTO_COMANDO) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!esClaimer && !esAltoComando) {
      return interaction.editReply({
        content:
          '<:cruz00y4n:1534937767652495360> Solo quien **reclamó** el ticket o **Alto Comando** puede quitar el reclamo.\n' +
          (claimedBy ? `> Reclamado por: <@${claimedBy}>` : '> Este ticket no tiene reclamo activo.')
      });
    }

    const result = await unclaimTicket(interaction.channel, interaction.user, {
      force: esAltoComando && !esClaimer
    });

    if (!result.success) {
      return interaction.editReply({
        content: `<:cruz00y4n:1534937767652495360> ${result.error || 'No se pudo quitar el reclamo.'}`
      });
    }

    return interaction.editReply({
      content: esClaimer
        ? '<:tilde:1534937809733812286> Ya no reclamás este ticket.'
        : '<:tilde:1534937809733812286> Alto Comando quitó el reclamo de este ticket.'
    });
  }
};
