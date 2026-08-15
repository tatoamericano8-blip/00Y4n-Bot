import { MessageFlags, PermissionFlagsBits } from 'discord.js';

const ROLE_STAFF = '1512120103771050005';

export default {
  name: 'ticket_pin',

  async execute(interaction) {
    const esStaff =
      interaction.member.roles.cache.has(ROLE_STAFF) ||
      interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

    if (!esStaff) {
      return interaction.reply({
        content: '<:cruz00y4n:1534937767652495360> Solo el staff puede fijar mensajes acá.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const msgs = await interaction.channel.messages.fetch({ limit: 15 });
      const target = msgs.find(m => m.embeds.length > 0 && m.embeds[0].title?.startsWith('Ticket #'));
      if (target) {
        await target.pin().catch(() => null);
        return interaction.editReply({ content: '<:tilde:1534937809733812286> Mensaje del ticket fijado.' });
      }
      return interaction.editReply({ content: 'No encontré el mensaje principal del ticket para fijar.' });
    } catch (e) {
      return interaction.editReply({ content: `Error al fijar: ${e.message}` });
    }
  }
};
