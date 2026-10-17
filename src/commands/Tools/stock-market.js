import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../../config/emojis.js';
import {
  STOCKS,
  PAGE_SIZE,
  getPrices,
  getPrevPrices,
  formatMoney,
  formatDelta,
  ensurePrices
} from '../../utils/gestorBolsa.js';

export function buildMarketEmbed(page, prices, prev) {
  const totalPages = Math.max(1, Math.ceil(STOCKS.length / PAGE_SIZE));
  const p = Math.min(Math.max(0, page), totalPages - 1);
  const slice = STOCKS.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE);

  const lines = slice.map((s) => {
    const now = Number(prices[s.symbol]) || s.base;
    const was = Number(prev[s.symbol]) || s.base;
    const delta = now - was;
    const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '•';
    const deltaStr = formatDelta(delta);
    return `**${s.symbol}** · ${s.name}\n${formatMoney(now)}  ·  ${arrow} ${deltaStr}`;
  });

  const embed = new EmbedBuilder()
    .setColor(PRIMARIO)
    .setTitle(`${E.dinero || '📈'} 00Y4n Bolsa de Valores`)
    .setDescription(
      `*Precios en vivo · actualización cada **5 minutos***\n` +
        `Página **${p + 1}/${totalPages}**\n\n` +
        lines.join('\n\n')
    )
    .setFooter({
      text: 'Usá /stock-buy · /stock-sell · /stock-portfolio · Fee 1.2%'
    })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`stock_mkt:prev:${p}`)
      .setLabel('Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(p <= 0),
    new ButtonBuilder()
      .setCustomId(`stock_mkt:next:${p}`)
      .setLabel('Siguiente')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(p >= totalPages - 1)
  );

  return { embeds: [embed], components: [row] };
}

export default {
  data: new SlashCommandBuilder()
    .setName('stock-market')
    .setDescription('Ver el panel de la 00Y4n Bolsa de Valores.'),

  async execute(interaction) {
    await ensurePrices();
    const prices = await getPrices();
    const prev = await getPrevPrices();
    const payload = buildMarketEmbed(0, prices, prev);
    return interaction.reply(payload);
  }
};
