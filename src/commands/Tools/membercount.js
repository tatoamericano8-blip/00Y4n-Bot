import { EmbedBuilder } from 'discord.js';
import { E } from '../../config/emojis.js';
import { PRIMARIO } from '../../utils/colores.js';

function colorInt() {
  try {
    return parseInt(String(PRIMARIO || '#FFC28D').replace('#', ''), 16);
  } catch {
    return 0xffc28d;
  }
}

export default {
  data: {
    name: 'membercount_swfl',
    description: 'Muestra la cantidad total de miembros actuales en el servidor.',
  },

  async execute(interaction) {
    const totalMiembros = interaction.guild.memberCount;
    const conteoFormateado = totalMiembros.toLocaleString('es-AR');
    const nombre = interaction.guild.name || 'Southwest Florida 00Y4n';

    const embedCount = new EmbedBuilder()
      .setColor(colorInt())
      .setDescription(
        `${E.flecha || '➜'} **${nombre}** actualmente tiene **${conteoFormateado}** miembros en la comunidad.\n` +
          `¡Agradecemos a cada uno de ustedes!`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embedCount] });
  },
};
