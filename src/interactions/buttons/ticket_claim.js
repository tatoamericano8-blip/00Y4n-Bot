import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { claimTicket } from '../../services/ticket.js';
import { getTicketData } from '../../utils/database.js';
import { E } from '../../config/emojis.js';

const ROLE_STAFF = '1512120103771050005';
/** Solo aplica en Servicios Públicos — no afecta 00Y4n principal */
const GUILD_SP = '1497012276329451581';
const ROLE_STAFF_SP = '1524139038251159602';

export default {
  name: 'ticket_claim',

  async execute(interaction) {
    const guildId = interaction.guildId;
    let ticketMeta = null;
    try {
      ticketMeta = await getTicketData(guildId, interaction.channelId);
    } catch {
      /* ignore */
    }

    const esTicketSP =
      guildId === GUILD_SP || ticketMeta?.origen === 'servicios_publicos';

    if (esTicketSP) {
      if (!interaction.member.roles.cache.has(ROLE_STAFF_SP)) {
        return interaction.reply({
          content: '❌ Solo el **Staff de Servicios Públicos** puede reclamar estos tickets.',
          flags: MessageFlags.Ephemeral
        });
      }
    } else {
      const esStaff =
        interaction.member.roles.cache.has(ROLE_STAFF) ||
        interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) ||
        interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);

      if (!esStaff) {
        return interaction.reply({
          content: E.cruz + ' Solo el staff puede reclamar tickets.',
          flags: MessageFlags.Ephemeral
        });
      }
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const result = await claimTicket(interaction.channel, interaction.user);

    if (!result.success) {
      return interaction.editReply({
        content: `${E.cruz} ${result.error || 'No se pudo reclamar el ticket.'}`
      });
    }

    return interaction.editReply({
      content: E.tilde + ' Reclamaste este ticket.'
    });
  }
};
