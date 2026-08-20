import { EmbedBuilder, MessageFlags } from 'discord.js';
import { closeTicket } from '../../services/ticket.js';
import { sumarCuotaStaff } from '../../utils/gestorCuotas.js';
import { logger } from '../../utils/logger.js';

const ROLE_STAFF = '1512120103771050005';
const LOG_CUOTA_TICKETS = '1505015805891579934';

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

    let cuotaOk = false;
    let motivoNoCuota = null;

    try {
      const ticketData = result.ticketData;
      const esStaff = interaction.member.roles.cache.has(ROLE_STAFF);
      const claimedBy = ticketData?.claimedBy ? String(ticketData.claimedBy) : null;
      const closerId = String(interaction.user.id);
      const esCreador = ticketData?.userId && String(ticketData.userId) === closerId;

      if (!esStaff) {
        motivoNoCuota = 'Quien cerró no tiene el rol de Staff.';
      } else if (esCreador) {
        motivoNoCuota = 'No suma cuota cerrar tu propio ticket.';
      } else if (!claimedBy) {
        motivoNoCuota = 'El ticket no estaba reclamado; no suma cuota.';
      } else if (claimedBy !== closerId) {
        motivoNoCuota = `Reclamado por <@${claimedBy}>, cerrado por otro staff; no suma cuota.`;
      } else {
        await sumarCuotaStaff(interaction.guildId, interaction.user.id, {
          ticketsCerrados: 1,
          motivo: `Ticket cerrado (reclamo propio): ${interaction.channel.name}`,
          executorId: interaction.user.id
        });
        cuotaOk = true;

        try {
          const logCh = await interaction.client.channels.fetch(LOG_CUOTA_TICKETS).catch(() => null);
          if (logCh?.isTextBased?.()) {
            const embed = new EmbedBuilder()
              .setColor('#74d4fc')
              .setTitle('🎫 Ticket contabilizado en cuota')
              .setDescription(
                `• **Staff:** <@${interaction.user.id}>\n` +
                  `• **Canal:** \`${interaction.channel.name}\`\n` +
                  `• **Ticket ID:** \`${ticketData?.id || interaction.channelId}\`\n` +
                  `• **+1** ticket cerrado (reclamó y cerró el mismo staff)`
              )
              .setFooter({ text: '00Y4n • Cuotas de Staff' })
              .setTimestamp();
            await logCh.send({ embeds: [embed] });
          }
        } catch (logErr) {
          logger.warn(`No se pudo enviar log de cuota ticket: ${logErr.message}`);
        }
      }
    } catch (err) {
      logger.warn(`No se pudo registrar cuota de ticket: ${err.message}`);
      motivoNoCuota = err.message;
    }

    if (cuotaOk) {
      return interaction.editReply({
        content:
          '✅ Ticket cerrado correctamente.\n<:tilde:1534937809733812286> Se sumó **+1 ticket** a tu cuota de staff.'
      });
    }

    return interaction.editReply({
      content:
        `✅ Ticket cerrado correctamente.\n` +
        (motivoNoCuota
          ? `> *No se sumó a la cuota:* ${motivoNoCuota}`
          : '> *No se sumó a la cuota.*')
    });
  }
};
