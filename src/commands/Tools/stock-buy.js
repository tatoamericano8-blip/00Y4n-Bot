import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../../config/emojis.js';
import { buyShares, formatMoney, STOCKS } from '../../utils/gestorBolsa.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stock-buy')
    .setDescription('Comprar acciones en la 00Y4n Bolsa de Valores.')
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
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused()?.toUpperCase() || '';
    const choices = STOCKS.filter(
      (s) => s.symbol.includes(focused) || s.name.toUpperCase().includes(focused)
    )
      .slice(0, 25)
      .map((s) => ({ name: `${s.symbol} — ${s.name}`, value: s.symbol }));
    return interaction.respond(choices);
  },

  async execute(interaction) {
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
};
