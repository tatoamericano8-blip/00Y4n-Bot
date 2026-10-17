import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../../config/emojis.js';
import { getPrices, getPrevPrices, getMovers, formatMoney, formatDelta } from '../../utils/gestorBolsa.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stock-news')
    .setDescription('Resumen de subidas y bajadas de la bolsa.'),

  async execute(interaction) {
    const prices = await getPrices();
    const prev = await getPrevPrices();
    const { gainers, losers } = getMovers(prices, prev, 5);

    const fmt = (arr, empty) =>
      arr.length
        ? arr
            .map(
              (x) =>
                `**${x.symbol}** ${x.name}: ${formatMoney(x.now)} (${formatDelta(x.delta)} / ${x.pct >= 0 ? '+' : ''}${x.pct.toFixed(2)}%)`
            )
            .join('\n')
        : empty;

    const embed = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.dinero || '📰'} 00Y4n Bolsa — Movimientos`)
      .setDescription('Variación desde la última actualización de precios (cada 5 min).')
      .addFields(
        { name: '▲ Mayores subidas', value: fmt(gainers, 'Sin subidas relevantes.') },
        { name: '▼ Mayores bajadas', value: fmt(losers, 'Sin bajadas relevantes.') }
      )
      .setFooter({ text: '00Y4n Bolsa de Valores' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
