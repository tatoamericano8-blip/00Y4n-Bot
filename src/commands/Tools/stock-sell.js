import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../../config/emojis.js';
import { sellShares, formatMoney, STOCKS } from '../../utils/gestorBolsa.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stock-sell')
    .setDescription('Vender acciones de tu portfolio.')
    .addStringOption((o) =>
      o
        .setName('simbolo')
        .setDescription('Símbolo (ej. AAPL) o usá portfolio')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((o) =>
      o
        .setName('cantidad')
        .setDescription('Número de acciones o "all" para vender todo')
        .setRequired(true)
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
};
