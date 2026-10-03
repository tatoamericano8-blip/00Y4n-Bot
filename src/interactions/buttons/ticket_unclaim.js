import { MessageFlags, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { unclaimTicket } from '../../services/ticket.js';
import { getTicketData, saveTicketData } from '../../utils/database.js';
import { createEmbed } from '../../utils/embeds.js';
import { E } from '../../config/emojis.js';

const ROLE_STAFF = '1512120103771050005';
const ROLE_ALTO_COMANDO = '1528870731629465752';
/** Solo aplica en Servicios Públicos — no afecta 00Y4n principal */
const GUILD_SP = '1497012276329451581';

export default {
  name: 'ticket_unclaim',

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let ticketData = null;
    try {
      ticketData = await getTicketData(interaction.guildId, interaction.channelId);
    } catch {}

    if (!ticketData) {
      return interaction.editReply({
        content: E.cruz + ' Este canal no es un ticket.'
      });
    }

    const esTicketSP =
      interaction.guildId === GUILD_SP || ticketData?.origen === 'servicios_publicos';

    const claimedBy = ticketData.claimedBy || null;
    if (!claimedBy) {
      return interaction.editReply({
        content: E.cruz + ' Este ticket no está reclamado.'
      });
    }

    const esClaimer = String(claimedBy) === String(interaction.user.id);

    // ——— Servicios Públicos: SOLO quien reclamó puede dejar de reclamar ———
    if (esTicketSP) {
      if (!esClaimer) {
        return interaction.editReply({
          content:
            '❌ Solo quien **reclamó** este ticket puede dejar de reclamarlo.\n' +
            `> Reclamado por: <@${claimedBy}>`
        });
      }
      const result = await unclaimTicket(interaction.channel, interaction.user);
      if (!result.success) {
        return interaction.editReply({
          content: `${E.cruz} ${result.error || 'No se pudo quitar el reclamo.'}`
        });
      }
      return interaction.editReply({
        content: E.tilde + ' Ya no reclamás este ticket.'
      });
    }

    // ——— Servidor principal (sin cambios de reglas) ———
    const esStaff =
      interaction.member.roles.cache.has(ROLE_STAFF) ||
      interaction.member.roles.cache.has(ROLE_ALTO_COMANDO) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!esStaff) {
      return interaction.editReply({
        content: E.cruz + ' Solo el staff puede dejar de reclamar.'
      });
    }

    const esAltoComando =
      interaction.member.roles.cache.has(ROLE_ALTO_COMANDO) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!esClaimer && !esAltoComando) {
      return interaction.editReply({
        content:
          E.cruz + ' Solo quien **reclamó** el ticket o **Alto Comando** puede quitar el reclamo.\n' +
          `> Reclamado por: <@${claimedBy}>`
      });
    }

    if (esClaimer) {
      const result = await unclaimTicket(interaction.channel, interaction.user);
      if (!result.success) {
        return interaction.editReply({
          content: `${E.cruz} ${result.error || 'No se pudo quitar el reclamo.'}`
        });
      }
      return interaction.editReply({
        content: E.tilde + ' Ya no reclamás este ticket.'
      });
    }

    // Alto Comando force-unclaim (solo server principal)
    try {
      const previousClaimer = ticketData.claimedBy;
      ticketData.claimedBy = null;
      ticketData.claimedAt = null;
      await saveTicketData(interaction.guildId, interaction.channelId, ticketData);

      const channel = interaction.channel;
      const messages = await channel.messages.fetch();
      const ticketMessage = messages.find(
        (m) => m.embeds.length > 0 && m.embeds[0].title?.startsWith('Ticket #')
      );
      if (ticketMessage) {
        const old = ticketMessage.embeds[0];
        const embed = EmbedBuilder.from(old);
        const fields = embed.data.fields || [];
        const idx = fields.findIndex((f) => f.name === 'Reclamado por' || f.name === 'Claimed By');
        if (idx >= 0) fields[idx].value = 'Sin reclamar';
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Cerrar ticket').setStyle(ButtonStyle.Secondary).setEmoji('🔒'),
          new ButtonBuilder().setCustomId('ticket_claim').setLabel('Reclamar').setStyle(ButtonStyle.Secondary).setEmoji('🙋'),
          new ButtonBuilder().setCustomId('ticket_pin').setLabel('Fijar').setStyle(ButtonStyle.Secondary).setEmoji('📌')
        );
        await ticketMessage.edit({ embeds: [embed], components: [row] }).catch(() => null);
      }

      const unclaimEmbed = createEmbed({
        title: 'Ticket sin reclamar',
        description: `🔓 **Alto Comando** (${interaction.user}) quitó el reclamo de <@${previousClaimer}>.`,
        color: '#f39c12'
      });
      const claimMessage = messages.find(
        (m) =>
          m.embeds.length > 0 &&
          ['Ticket reclamado', 'Ticket Claimed', 'Ticket sin reclamar', 'Ticket Unclaimed'].includes(
            m.embeds[0].title
          )
      );
      if (claimMessage) await claimMessage.edit({ embeds: [unclaimEmbed], components: [] }).catch(() => null);
      else await channel.send({ embeds: [unclaimEmbed] }).catch(() => null);

      return interaction.editReply({
        content: E.tilde + ' Alto Comando quitó el reclamo de este ticket.'
      });
    } catch (err) {
      return interaction.editReply({
        content: `${E.cruz} Error al quitar reclamo: ${err.message}`
      });
    }
  }
};
