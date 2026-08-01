import { MessageFlags } from 'discord.js';
import { closeTicket } from '../../services/ticket.js';
import { sumarCuotaStaff } from '../../utils/gestorCuotas.js';
import { logger } from '../../utils/logger.js';

const ROLE_STAFF = '1512120103771050005';

export default {
  name: 'ticket_close',

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const reason = 'Cerrado por el staff';
    const result = await closeTicket(interaction.channel, interaction.user, reason);

    if (!result.success) {
      return interaction.editReply({
        content: `❌ No se pudo cerrar el ticket: ${result.error || 'error desconocido'}`
      });
    }

    // Auto-cuota: solo si es staff y no es el creador del ticket
    try {
      const ticketData = result.ticketData;
      const esStaff =
        interaction.member.roles.cache.has(ROLE_STAFF) ||
        interaction.member.permissions.has('ModerateMembers');

      if (esStaff && ticketData?.userId !== interaction.user.id) {
        await sumarCuotaStaff(interaction.guildId, interaction.user.id, {
          ticketsCerrados: 1,
          motivo: `Ticket cerrado: ${interaction.channel.name}`,
          executorId: interaction.user.id
        });
      }
    } catch (err) {
      logger.warn(`No se pudo registrar cuota de ticket: ${err.message}`);
    }

    return interaction.editReply({
      content: '✅ Ticket cerrado correctamente. Se registró en tu cuota de staff (si aplica).'
    });
  }
};
