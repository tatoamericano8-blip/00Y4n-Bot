import { MessageFlags } from 'discord.js';
import {
  unirseSorteo,
  buildEmbedSorteo,
  buildRowSorteo
} from '../../utils/gestorSorteos.js';
import { E } from '../../config/emojis.js';

export default {
  name: 'sorteo_entrar',
  customId: 'sorteo_entrar',

  async execute(interaction) {
    const messageId = interaction.message?.id;
    if (!messageId) {
      return interaction.reply({
        content: E.cruz + ' No se pudo identificar el sorteo.',
        flags: MessageFlags.Ephemeral
      });
    }

    const res = await unirseSorteo(messageId, interaction.user.id);

    if (!res.ok) {
      const map = {
        no_existe: 'Este sorteo ya no existe o no está registrado.',
        finalizado: 'Este sorteo **ya finalizó**.',
        ya_entro: 'Ya estás participando en este sorteo.'
      };
      return interaction.reply({
        content: (res.reason === 'ya_entro' ? E.tilde : E.cruz) + ' ' + (map[res.reason] || 'No pudiste entrar.'),
        flags: MessageFlags.Ephemeral
      });
    }

    // Actualizar contador de entradas en el embed
    try {
      await interaction.update({
        embeds: [buildEmbedSorteo(res.data)],
        components: [buildRowSorteo()]
      });
      await interaction.followUp({
        content: E.tilde + ' ¡Entraste al sorteo! Suerte.',
        flags: MessageFlags.Ephemeral
      }).catch(() => null);
    } catch {
      await interaction.reply({
        content: E.tilde + ' ¡Entraste al sorteo! Suerte.',
        flags: MessageFlags.Ephemeral
      }).catch(() => null);
    }
  }
};
