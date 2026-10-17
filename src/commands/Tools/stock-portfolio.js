import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../../config/emojis.js';
import {
  getPortfolio,
  getPrices,
  findStock,
  formatMoney,
  formatDelta
} from '../../utils/gestorBolsa.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stock-portfolio')
    .setDescription('Ver tus acciones, costo y ganancia/pérdida.'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const port = await getPortfolio(interaction.user.id);
    const prices = await getPrices();
    const symbols = Object.keys(port);

    if (!symbols.length) {
      return interaction.editReply({
        content: `${E.dot || '•'} No tenés acciones. Mirás precios con \`/stock-market\` y comprás con \`/stock-buy\`.`
      });
    }

    let totalCost = 0;
    let totalNow = 0;
    const lines = [];

    for (const sym of symbols) {
      const h = port[sym];
      const stock = findStock(sym);
      const price = Number(prices[sym]) || stock?.base || 0;
      const value = price * h.shares;
      const cost = Number(h.cost) || 0;
      const pnl = value - cost;
      const pct = cost > 0 ? (pnl / cost) * 100 : 0;
      totalCost += cost;
      totalNow += value;
      lines.push(
        `**${sym}** — ${h.shares} acción(es)\n` +
          `Costo: ${formatMoney(cost)} → Ahora: ${formatMoney(value)} · ${formatDelta(pnl)} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`
      );
    }

    const totalPnl = totalNow - totalCost;
    const totalPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    const embed = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.dinero || '📊'} Portfolio — ${interaction.user.username}`)
      .setDescription(lines.join('\n\n'))
      .addFields(
        { name: 'Costo total', value: formatMoney(totalCost), inline: true },
        { name: 'Valor actual', value: formatMoney(totalNow), inline: true },
        {
          name: 'Ganancia/pérdida',
          value: `${formatDelta(totalPnl)} (${totalPct >= 0 ? '+' : ''}${totalPct.toFixed(2)}%)`,
          inline: true
        }
      )
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
