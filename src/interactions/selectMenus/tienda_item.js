import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags
} from 'discord.js';
import {
  TIENDA_COLOR,
  TIENDA_BANNER,
  TIENDA_CATEGORIAS,
  getItem,
  formatMoney
} from '../../config/tiendaServer.js';
import { obtenerSaldo } from '../../utils/gestorEconomia.js';
import { comprarItem } from '../../utils/gestorTienda.js';

function menuCategorias() {
  return new ActionRowBuilder().addComponents(
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
}

export default {
  name: 'tienda_item',

  async execute(interaction) {
    const itemId = interaction.values[0];
    const item = getItem(itemId);
    if (!item) {
      return interaction.reply({
        content: 'Ítem no válido.',
        flags: MessageFlags.Ephemeral
      });
    }

    const member = interaction.member;
    if (!member) {
      return interaction.reply({
        content: 'No pude obtener tu miembro del servidor.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferUpdate();

    const result = await comprarItem(member, itemId);

    const saldo = await obtenerSaldo(interaction.user.id);
    const embedShop = new EmbedBuilder()
      .setTitle('🛒 Tienda del servidor — 00Y4n')
      .setDescription(
        'Elegí una **categoría** abajo y después el ítem que quieras comprar.\n\n' +
          `Tu saldo: **${formatMoney(saldo)}**`
      )
      .setImage(TIENDA_BANNER)
      .setColor(TIENDA_COLOR)
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    await interaction.editReply({
      embeds: [embedShop],
      components: [menuCategorias()]
    });

    const color = result.ok ? 0x43b581 : 0xff3333;
    await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setTitle(result.ok ? 'Compra realizada' : 'No se pudo comprar')
          .setDescription(result.mensaje)
          .setColor(color)
      ],
      flags: MessageFlags.Ephemeral
    });
  }
};
