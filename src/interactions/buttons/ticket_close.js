import { EmbedBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { closeTicket } from '../../services/ticket.js';
import { getTicketData } from '../../utils/database.js';
import { sumarCuotaStaff } from '../../utils/gestorCuotas.js';
import { logger } from '../../utils/logger.js';
import { E } from '../../config/emojis.js';

const ROLE_STAFF = '1512120103771050005';
const ROLE_ALTO_COMANDO = '1528870731629465752';
const LOG_CUOTA_TICKETS = '1505015805891579934';
/** Solo detecta SP; no cambia reglas del server principal */
const GUILD_SP = '1497012276329451581';
const ROLE_STAFF_SP = '1524139038251159602';

export default {
  name: 'ticket_close',

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let ticketBefore = null;
    try {
      ticketBefore = await getTicketData(interaction.guildId, interaction.channelId);
    } catch (e) {
      logger.warn(`[ticket_close] getTicketData: ${e.message}`);
    }

    const esTicketSP =
      interaction.guildId === GUILD_SP || ticketBefore?.origen === 'servicios_publicos';

    if (esTicketSP) {
      const esCreadorSP =
        ticketBefore?.userId && String(ticketBefore.userId) === String(interaction.user.id);
      const esStaffSP = interaction.member.roles.cache.has(ROLE_STAFF_SP);
      if (!esStaffSP && !esCreadorSP) {
        return interaction.editReply({
          content: '❌ Solo el **Staff de Servicios Públicos** o quien abrió el ticket puede cerrarlo.'
        });
      }
    }

    const reason = 'Cerrado por el staff';
    const result = await closeTicket(interaction.channel, interaction.user, reason);

    if (!result.success) {
      return interaction.editReply({
        content: `❌ No se pudo cerrar el ticket: ${result.error || 'error desconocido'}`
      });
    }

    const ticketData = result.ticketData || ticketBefore || {};
    const claimedBy = String(
      ticketBefore?.claimedBy || ticketData?.claimedBy || ''
    ) || null;
    const closerId = String(interaction.user.id);
    const esCreador =
      ticketData?.userId && String(ticketData.userId) === closerId;

    const esStaffRol = interaction.member.roles.cache.has(ROLE_STAFF);
    const puedeCuota = esTicketSP ? false : esStaffRol;

    let cuotaOk = false;
    let motivoNoCuota = null;

    try {
      if (!puedeCuota) {
        motivoNoCuota = esTicketSP
          ? 'Ticket de Servicios Públicos (sin cuota 00Y4n).'
          : 'Quien cerró no tiene el rol de Staff (cuota).';
      } else if (esCreador) {
        motivoNoCuota = 'No suma cuota cerrar tu propio ticket.';
      } else if (!claimedBy) {
        motivoNoCuota = 'El ticket no estaba reclamado; no suma cuota.';
      } else if (claimedBy !== closerId) {
        motivoNoCuota = `Reclamado por <@${claimedBy}>, cerrado por otro; no suma cuota.`;
      } else {
        await sumarCuotaStaff(interaction.guildId, interaction.user.id, {
          ticketsCerrados: 1,
          motivo: `Ticket cerrado (reclamo propio): ${interaction.channel.name}`,
          executorId: interaction.user.id
        });
        cuotaOk = true;
      }
    } catch (err) {
      logger.warn(`No se pudo registrar cuota de ticket: ${err.message}`);
      motivoNoCuota = err.message;
    }

    try {
      if (!esTicketSP) {
        const logCh = await interaction.client.channels.fetch(LOG_CUOTA_TICKETS).catch((e) => {
          logger.warn(`[ticket_close] fetch log channel: ${e.message}`);
          return null;
        });
        if (logCh?.isTextBased?.()) {
          const embed = new EmbedBuilder()
            .setColor(cuotaOk ? '#74d4fc' : '#f1c40f')
            .setTitle(cuotaOk ? '🎫 Ticket contabilizado en cuota' : '🎫 Ticket cerrado (sin cuota)')
            .setDescription(
              `• **Staff:** <@${interaction.user.id}>\n` +
                `• **Canal:** \`${interaction.channel.name}\`\n` +
                `• **Ticket ID:** \`${ticketData?.id || interaction.channelId}\`\n` +
                `• **Reclamado por:** ${claimedBy ? `<@${claimedBy}>` : '*Sin reclamar*'}\n` +
                `• **Cuota:** ${cuotaOk ? '**+1** ticket sumado' : `No sumó — ${motivoNoCuota || '—'}`}`
            )
            .setFooter({ text: '00Y4n • Cuotas de Staff' })
            .setTimestamp();
          await logCh.send({ embeds: [embed] });
        }
      }
    } catch (logErr) {
      logger.warn(`No se pudo enviar log de cuota ticket: ${logErr.message}`);
    }

    if (esTicketSP) {
      return interaction.editReply({
        content: '✅ Ticket cerrado correctamente.'
      });
    }

    if (cuotaOk) {
      return interaction.editReply({
        content:
          '✅ Ticket cerrado correctamente.\n' + E.tilde + ' Se sumó **+1 ticket** a tu cuota de staff.'
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
