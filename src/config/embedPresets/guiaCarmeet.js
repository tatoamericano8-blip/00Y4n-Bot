import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

export default {
  id: 'guia_carmeet',
  label: 'Guía Car Meet',
  description: 'PLACEHOLDER — pasar texto/imágenes',

  build() {
    const embed = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.warn} Guía Car Meet`)
      .setDescription(
        `**Contenido pendiente.**\n\n` +
          `Este preset está registrado en \`/embed-send\` pero aún no tiene el texto final.\n` +
          `// TODO: pegar embeds + URLs de imagen cuando los tengas.`
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    return { embeds: [embed] };
  }
};
