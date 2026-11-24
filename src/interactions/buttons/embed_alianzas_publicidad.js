import { MessageFlags } from 'discord.js';
import { buildPublicidadPagaEmbed } from '../../config/embedPresets/alianzas.js';
import { E } from '../../config/emojis.js';

/**
 * Botón del preset Alianzas → lista de packs de publicidad paga (efímero).
 */
export default {
  id: 'embed_alianzas_publicidad',
  customId: 'embed_alianzas_publicidad',
  name: 'embed_alianzas_publicidad',

  async execute(interaction) {
    try {
      return interaction.reply({
        embeds: [buildPublicidadPagaEmbed()],
        flags: MessageFlags.Ephemeral
      });
    } catch (e) {
      console.error('[embed_alianzas_publicidad]', e);
      return interaction
        .reply({
          content: `${E.cruz || '❌'} No se pudo mostrar la publicidad paga.`,
          flags: MessageFlags.Ephemeral
        })
        .catch(() => null);
    }
  },

  async run(client, interaction) {
    return this.execute(interaction, client);
  }
};
