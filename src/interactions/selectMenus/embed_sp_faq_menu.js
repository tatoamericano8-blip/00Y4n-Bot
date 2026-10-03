import { MessageFlags } from 'discord.js';
import { logger } from '../../utils/logger.js';
import { buildSpFaqEmbeds } from '../../config/embedPresets/serviciosPublicosFaq.js';

/**
 * Menú FAQ Servicios Públicos.
 * customId: embed_sp_faq_menu
 */
export default {
  id: 'embed_sp_faq_menu',
  customId: 'embed_sp_faq_menu',
  name: 'embed_sp_faq_menu',

  async execute(interaction) {
    try {
      const value = interaction.values?.[0];
      const embeds = buildSpFaqEmbeds(value);
      if (!embeds.length) {
        return interaction.reply({
          content: 'Opción no válida.',
          flags: MessageFlags.Ephemeral
        });
      }
      return interaction.reply({
        embeds,
        flags: MessageFlags.Ephemeral
      });
    } catch (err) {
      logger.error('[embed_sp_faq_menu] Error:', err);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({
          content: 'Error al mostrar la FAQ. Intentá de nuevo.',
          flags: MessageFlags.Ephemeral
        }).catch(() => null);
      }
    }
  }
};
