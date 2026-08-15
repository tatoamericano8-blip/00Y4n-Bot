import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import {
  TIENDA_COLOR,
  TIENDA_CATEGORIAS,
  getItemsByCategory,
  formatMoney
} from '../../config/tiendaServer.js';
import { obtenerSaldo } from '../../utils/gestorEconomia.js';

export default {
  name: 'tienda_cat',

  async execute(interaction) {
    const categoryId = interaction.values[0];
    const cat = TIENDA_CATEGORIAS.find((c) => c.id === categoryId);
    const items = getItemsByCategory(categoryId);

    if (!items.length) {
      return interaction.reply({
        content: 'No hay ítems en esta categoría.',
        flags: MessageFlags.Ephemeral
      });
    }

    const saldo = await obtenerSaldo(interaction.user.id);
    const lista = items
      .map((i) => {
        const extra =
          i.type === 'role_weekly' ? ` · **${formatMoney(i.weekly)}**/semana` : '';
        return `• **${i.name}** — ${formatMoney(i.price)}${extra}\n  -# ${i.description}`;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`${cat?.emoji || '🛒'} Tienda — ${cat?.label || categoryId}`)
      .setDescription(
        `${lista}\n\nTu saldo: **${formatMoney(saldo)}**\nElegí un ítem en el menú para comprarlo.`
      )
      .setColor(TIENDA_COLOR)
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    const select = new StringSelectMenuBuilder()
      .setCustomId('tienda_item')
      .setPlaceholder('Elegí un ítem para comprar...')
      .addOptions(
        items.slice(0, 25).map((i) => ({
          label: i.name.slice(0, 100),
          value: i.id,
          description: `${formatMoney(i.price)}${i.weekly ? ` · ${formatMoney(i.weekly)}/sem` : ''}`.slice(0, 100)
        }))
      );

    const back = new ButtonBuilder()
      .setCustomId('tienda_back')
      .setLabel('Categorías')
      .setStyle(ButtonStyle.Secondary);

    await interaction.update({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(select),
        new ActionRowBuilder().addComponents(back)
      ]
    });
  }
};
