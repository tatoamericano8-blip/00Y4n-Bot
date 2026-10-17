import { buildMarketPayload } from '../../commands/Tools/stock-market.js';

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

    await interaction.deferUpdate();
    const payload = await buildMarketPayload(nextPage);
    return interaction.editReply(payload);
  }
};
