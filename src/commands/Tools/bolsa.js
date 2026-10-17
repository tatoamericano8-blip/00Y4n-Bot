import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../../config/emojis.js';
import {
  buyShares,
  sellShares,
  getPortfolio,
  getPrices,
  getPrevPrices,
  getMovers,
  findStock,
  formatMoney,
  formatDelta,
  editStockPrice,
  OWNER_ROLE_ID,
  STOCKS
} from '../../utils/gestorBolsa.js';
import { buildMarketPayload } from './stock-market.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bolsa')
    .setDescription('00Y4n Bolsa de Valores — mercado, comprar, vender y cartera.')
    .addSubcommand((s) =>
      s.setName('mercado').setDescription('Ver el panel de precios de la bolsa.')
    )
    .addSubcommand((s) =>
      s
        .setName('comprar')
        .setDescription('Comprar acciones.')
        .addStringOption((o) =>
          o
            .setName('simbolo')
            .setDescription('Símbolo de la empresa (ej. AAPL, TSLA)')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption((o) =>
          o
            .setName('cantidad')
            .setDescription('Cantidad de acciones')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(5000)
        )
    )
    .addSubcommand((s) =>
      s
        .setName('vender')
        .setDescription('Vender acciones de tu cartera.')
        .addStringOption((o) =>
          o
            .setName('simbolo')
            .setDescription('Símbolo (ej. AAPL)')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((o) =>
          o
            .setName('cantidad')
            .setDescription('Número de acciones o "all" para vender todo')
            .setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName('cartera').setDescription('Ver tus acciones, costo y ganancia/pérdida.')
    )
    .addSubcommand((s) =>
      s.setName('noticias').setDescription('Mayores subidas y bajadas de la bolsa.')
    )
    .addSubcommand((s) =>
      s
        .setName('editar')
        .setDescription('Admin: influir en el precio de la bolsa.')
        .addStringOption((o) =>
          o
            .setName('objetivo')
            .setDescription('Símbolo (AAPL) o ALL para todo el mercado')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addNumberOption((o) =>
          o
            .setName('porcentaje')
            .setDescription('Impacto en % (ej. 10 = +10%, -5 = -5%)')
            .setRequired(true)
            .setMinValue(-90)
            .setMaxValue(200)
        )
    ),

  async autocomplete(interaction) {
    const sub = interaction.options.getSubcommand(false);
    const focused = interaction.options.getFocused(true);
    const q = (focused?.value || '').toUpperCase();

    if (sub === 'editar' && focused?.name === 'objetivo') {
      const base = [{ name: 'ALL — Todo el mercado', value: 'ALL' }].concat(
        STOCKS.map((s) => ({ name: `${s.symbol} — ${s.name}`, value: s.symbol }))
      );
      return interaction.respond(
        base
          .filter((c) => c.value.includes(q) || c.name.toUpperCase().includes(q))
          .slice(0, 25)
      );
    }

    if (focused?.name === 'simbolo') {
      const choices = STOCKS.filter(
        (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
      )
        .slice(0, 25)
        .map((s) => ({ name: `${s.symbol} — ${s.name}`, value: s.symbol }));
      return interaction.respond(choices);
    }

    return interaction.respond([]);
  },

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'mercado') {
      await interaction.deferReply();
      const payload = await buildMarketPayload(0);
      return interaction.editReply(payload);
    }

    if (sub === 'comprar') {
      const symbol = interaction.options.getString('simbolo');
      const qty = interaction.options.getInteger('cantidad');
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const res = await buyShares(interaction.user.id, symbol, qty);
      if (!res.ok) {
        return interaction.editReply({ content: `${E.cruz || '❌'} ${res.error}` });
      }
      const embed = new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.dinero || '📈'} Compra realizada`)
        .setDescription(
          `Compraste **${res.qty}** acción(es) de **${res.stock.symbol}** (${res.stock.name}).\n\n` +
            `**Precio:** ${formatMoney(res.price)}\n` +
            `**Subtotal:** ${formatMoney(res.bruto)}\n` +
            `**Fee (1.2%):** ${formatMoney(res.fee)}\n` +
            `**Total debitado:** ${formatMoney(res.total)}\n` +
            `**Saldo:** ${formatMoney(res.saldo)}`
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'vender') {
      const symbol = interaction.options.getString('simbolo');
      const cantidad = interaction.options.getString('cantidad');
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const res = await sellShares(interaction.user.id, symbol, cantidad);
      if (!res.ok) {
        return interaction.editReply({ content: `${E.cruz || '❌'} ${res.error}` });
      }
      const embed = new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.dinero || '📈'} Venta realizada`)
        .setDescription(
          `Vendiste **${res.qty}** acción(es) de **${res.stock.symbol}** (${res.stock.name}).\n\n` +
            `**Precio:** ${formatMoney(res.price)}\n` +
            `**Bruto:** ${formatMoney(res.bruto)}\n` +
            `**Fee (1.2%):** ${formatMoney(res.fee)}\n` +
            `**Neto acreditado:** ${formatMoney(res.neto)}\n` +
            `**Saldo:** ${formatMoney(res.saldo)}`
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'cartera') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const port = await getPortfolio(interaction.user.id);
      const prices = await getPrices();
      const symbols = Object.keys(port);
      if (!symbols.length) {
        return interaction.editReply({
          content: `${E.dot || '•'} No tenés acciones. Usá \`/bolsa mercado\` y \`/bolsa comprar\`.`
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
        .setTitle(`${E.dinero || '📊'} Cartera — ${interaction.user.username}`)
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

    if (sub === 'noticias') {
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

    if (sub === 'editar') {
      const member = interaction.member;
      const has =
        member?.roles?.cache?.has(OWNER_ROLE_ID) ||
        member?.permissions?.has?.('Administrator');
      if (!has) {
        return interaction.reply({
          content: `${E.cruz || '❌'} Solo **Equipo de Propietarios** puede usar este subcomando.`,
          flags: MessageFlags.Ephemeral
        });
      }
      const objetivo = interaction.options.getString('objetivo');
      const pct = interaction.options.getNumber('porcentaje');
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const res = await editStockPrice(objetivo, pct);
      if (!res.ok) {
        return interaction.editReply({ content: `${E.cruz || '❌'} ${res.error}` });
      }
      let detail = '';
      if (String(objetivo).toUpperCase() === 'ALL') {
        detail = `Todo el mercado ajustado un **${pct}%**.`;
      } else {
        const s = findStock(objetivo);
        const price = res.prices[s.symbol];
        detail = `**${s.symbol}** → ${formatMoney(price)} (impacto ${pct}%).`;
      }
      const embed = new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.tilde || '✅'} Mercado editado`)
        .setDescription(detail)
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }
  }
};
