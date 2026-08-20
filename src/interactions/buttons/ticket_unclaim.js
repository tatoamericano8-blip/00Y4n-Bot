import { MessageFlags, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { unclaimTicket } from '../../services/ticket.js';
import { getTicketData, saveTicketData } from '../../utils/database.js';
import { createEmbed } from '../../utils/embeds.js';

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

    if (!ticketData) {
      return interaction.editReply({
        content: '<:cruz00y4n:1534937767652495360> Este canal no es un ticket.'
      });
    }

    const claimedBy = ticketData.claimedBy || null;
    if (!claimedBy) {
      return interaction.editReply({
        content: '<:cruz00y4n:1534937767652495360> Este ticket no está reclamado.'
      });
    }

    const esClaimer = String(claimedBy) === String(interaction.user.id);
    const esAltoComando =
      interaction.member.roles.cache.has(ROLE_ALTO_COMANDO) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!esClaimer && !esAltoComando) {
      return interaction.editReply({
        content:
          '<:cruz00y4n:1534937767652495360> Solo quien **reclamó** el ticket o **Alto Comando** puede quitar el reclamo.\n' +
          `> Reclamado por: <@${claimedBy}>`
      });
    }

    if (esClaimer) {
      const result = await unclaimTicket(interaction.channel, interaction.user);
      if (!result.success) {
        return interaction.editReply({
          content: `<:cruz00y4n:1534937767652495360> ${result.error || 'No se pudo quitar el reclamo.'}`
        });
      }
      return interaction.editReply({
        content: '<:tilde:1534937809733812286> Ya no reclamás este ticket.'
      });
    }

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
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Cerrar ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
          new ButtonBuilder().setCustomId('ticket_claim').setLabel('Reclamar').setStyle(ButtonStyle.Primary).setEmoji('🙋'),
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
        content: '<:tilde:1534937809733812286> Alto Comando quitó el reclamo de este ticket.'
      });
    } catch (err) {
      return interaction.editReply({
        content: `<:cruz00y4n:1534937767652495360> Error al quitar reclamo: ${err.message}`
      });
    }
  }
};
