import { MessageFlags } from 'discord.js';

export default {
  name: 'roleall_cancel',

  async execute(interaction) {
    const ownerId = interaction.customId.split(':')[1];
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> Solo quien ejecutó el comando puede cancelar.',
        flags: MessageFlags.Ephemeral
      });
    }

    return interaction.update({
      content: '❌ Roleall cancelado.',
      embeds: [],
      components: []
    });
  }
};
