import { MessageFlags } from 'discord.js';
import { E } from '../../config/emojis.js';

export default {
  name: 'roleall_cancel',

  async execute(interaction) {
    const ownerId = interaction.customId.split(':')[1];
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: E.cruz + ' Solo quien ejecutó el comando puede cancelar.',
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
