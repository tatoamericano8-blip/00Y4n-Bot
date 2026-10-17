import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../../config/emojis.js';
import {
  PAGE_SIZE,
  STOCKS,
  getPrices,
  getPrevPrices,
  ensurePrices
} from '../../utils/gestorBolsa.js';
import { renderBolsaPage } from '../../utils/renderBolsaBoard.js';

export async function buildMarketPayload(page) {
  await ensurePrices();
  const prices = await getPrices();
  const prev = await getPrevPrices();
  const totalPages = Math.max(1, Math.ceil(STOCKS.length / PAGE_SIZE));
  const p = Math.min(Math.max(0, page), totalPages - 1);

  const png = await renderBolsaPage(p, prices, prev);
  const file = new AttachmentBuilder(png, { name: `bolsa_p${p + 1}.png` });

  const embed = new EmbedBuilder()
    .setColor(PRIMARIO)
    .setTitle(`${E.dinero || '📈'} 00Y4n Bolsa de Valores`)
    .setDescription(
      `*Precios en vivo · se actualizan cada **5 minutos***\nPágina **${p + 1}/${totalPages}**`
    )
    .setImage(`attachment://bolsa_p${p + 1}.png`)
    .setFooter({ text: 'Usá /stock-buy · /stock-sell · /stock-portfolio · Fee 1.2%' })
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

  return { embeds: [embed], components: [row], files: [file] };
}

export default {
  data: new SlashCommandBuilder()
    .setName('stock-market')
    .setDescription('Ver el panel de la 00Y4n Bolsa de Valores.'),

  async execute(interaction) {
    await interaction.deferReply();
    const payload = await buildMarketPayload(0);
    return interaction.editReply(payload);
  }
};
