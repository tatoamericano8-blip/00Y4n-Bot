import { MessageFlags } from 'discord.js';
import { E } from '../../config/emojis.js';
import { buildSeccionNormasConduccion } from '../../config/embedPresets/normasConduccion.js';

export default {
  name: 'embed_normas_conduccion_menu',

  async execute(interaction) {
    const value = interaction.values?.[0];
    const payload = buildSeccionNormasConduccion(value);
    if (!payload?.embeds?.length) {
      return interaction.reply({
        content: E.cruz + ' Sección no encontrada.',
        flags: MessageFlags.Ephemeral
      });
    }
    return interaction.reply({
      embeds: payload.embeds,
      flags: MessageFlags.Ephemeral
    });
  }
};
