import { MessageFlags } from 'discord.js';
import { buildReglamentoEmbeds } from '../../config/embedPresets/serviciosPublicosInfo.js';
import { ES } from '../../config/emojisServicios.js';

/**
 * Botón "Reglamento" del preset SP · Información.
 * Muestra reglas 1–13 solo a quien toca (efímero), como GVRU.
 */
export default {
  id: 'embed_sp_reglamento',
  customId: 'embed_sp_reglamento',
  name: 'embed_sp_reglamento',

  async execute(interaction) {
    try {
      const embeds = buildReglamentoEmbeds();
      return interaction.reply({
        embeds,
        flags: MessageFlags.Ephemeral
      });
    } catch (e) {
      console.error('[embed_sp_reglamento]', e);
      return interaction.reply({
        content: `${ES.cruz || '❌'} No se pudo mostrar el reglamento.`,
        flags: MessageFlags.Ephemeral
      }).catch(() => null);
    }
  },

  async run(client, interaction) {
    return this.execute(interaction, client);
  }
};
