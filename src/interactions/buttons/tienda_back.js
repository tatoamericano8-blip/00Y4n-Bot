import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';
import {
  TIENDA_BANNER,
  TIENDA_COLOR,
  TIENDA_CATEGORIAS,
  formatMoney
} from '../../config/tiendaServer.js';
import { obtenerSaldo } from '../../utils/gestorEconomia.js';

export default {
  name: 'tienda_back',

  async execute(interaction) {
    const saldo = await obtenerSaldo(interaction.user.id);
    const embed = new EmbedBuilder()
      .setTitle('🛒 Tienda del servidor — 00Y4n')
      .setDescription(
        'Elegí una **categoría** abajo y después el ítem que quieras comprar.\n\n' +
          `Tu saldo: **${formatMoney(saldo)}**\n\n` +
          '• Los **seguros** se renuevan solos cada 7 días.\n' +
          '• Comida y fuma → `/tienda comer` · `/tienda fumar`\n' +
          '• Regalos → `/tienda regalar`'
      )
      .setImage(TIENDA_BANNER)
      .setColor(TIENDA_COLOR)
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tienda_cat')
        .setPlaceholder('Elegí una categoría...')
        .addOptions(
          TIENDA_CATEGORIAS.map((c) => ({
            label: c.label,
            value: c.id,
            description: c.description.slice(0, 100),
            emoji: c.emoji
          }))
        )
    );

    await interaction.update({ embeds: [embed], components: [row] });
  }
};
