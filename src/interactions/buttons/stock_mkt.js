import { getPrices, getPrevPrices } from '../../utils/gestorBolsa.js';
import { buildMarketEmbed } from '../../commands/Tools/stock-market.js';

/**
 * customId: stock_mkt:prev:PAGE | stock_mkt:next:PAGE
 */
export default {
  name: 'stock_mkt',
  async execute(interaction, client, args = []) {
    const dir = args[0];
    const page = parseInt(args[1], 10) || 0;
    let nextPage = page;
    if (dir === 'next') nextPage = page + 1;
    if (dir === 'prev') nextPage = page - 1;

    const prices = await getPrices();
    const prev = await getPrevPrices();
    const payload = buildMarketEmbed(nextPage, prices, prev);

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply(payload);
    }
    return interaction.update(payload);
  }
};
