import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../../config/emojis.js';
import {
  editStockPrice,
  OWNER_ROLE_ID,
  STOCKS,
  formatMoney,
  findStock
} from '../../utils/gestorBolsa.js';

export default {
  data: new SlashCommandBuilder()
    .setName('editstock')
    .setDescription('Admin: influir en el precio de la bolsa (0–200% impacto).')
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
        .setDescription('Impacto en % (ej. 10 = +10%, -5 = -5%). Rango -90 a 200.')
        .setRequired(true)
        .setMinValue(-90)
        .setMaxValue(200)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused()?.toUpperCase() || '';
    const base = [{ name: 'ALL — Todo el mercado', value: 'ALL' }].concat(
      STOCKS.map((s) => ({ name: `${s.symbol} — ${s.name}`, value: s.symbol }))
    );
    const choices = base
      .filter((c) => c.value.includes(focused) || c.name.toUpperCase().includes(focused))
      .slice(0, 25);
    return interaction.respond(choices);
  },

  async execute(interaction) {
    const member = interaction.member;
    const has =
      member?.roles?.cache?.has(OWNER_ROLE_ID) ||
      member?.permissions?.has?.('Administrator');
    if (!has) {
      return interaction.reply({
        content: `${E.cruz || '❌'} Solo **Equipo de Propietarios** puede usar este comando.`,
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
};
