import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags
} from 'discord.js';
import { obtenerSaldo } from '../../utils/gestorEconomia.js';
import {
  TIENDA_BANNER,
  TIENDA_COLOR,
  TIENDA_CANAL_NOMBRE,
  TIENDA_CATEGORIAS,
  TIENDA_ITEMS,
  getItem,
  formatMoney
} from '../../config/tiendaServer.js';
import {
  obtenerInventario,
  textoInventario,
  consumirItem,
  regalarItem,
  obtenerSeguro
} from '../../utils/gestorTienda.js';

function canalPermitido(channel) {
  if (!channel) return false;
  const name = (channel.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = TIENDA_CANAL_NOMBRE.toLowerCase().replace(/[^a-z0-9]/g, '');
  return name === target || name.includes(target);
}

function embedPrincipal(saldo) {
  return new EmbedBuilder()
    .setTitle('🛒 Tienda del servidor — 00Y4n')
    .setDescription(
      'Elegí una **categoría** abajo y después el ítem que quieras comprar.\n\n' +
        `Tu saldo: **${formatMoney(saldo)}**\n\n` +
        '• Los **seguros** se renuevan solos cada 7 días.\n' +
        '• Si no hay saldo en el cobro, se cancela el seguro y se quita el rol.\n' +
        '• Comida y fuma van al inventario → `/tienda comer` · `/tienda fumar`\n' +
        '• Regalos → `/tienda regalar`'
    )
    .setImage(TIENDA_BANNER)
    .setColor(TIENDA_COLOR)
    .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });
}

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

const MENSAJES_COMER = {
  bolsa_bodega: 'Abriste la bolsa de bodega y comiste todo en el auto. Clásico SWFL.',
  bandeja_cookout: 'Te comiste la bandeja Cookout entera. Quedaste pesado para el roleplay.',
  popeyes: 'Popeyes en mano. El pollo estaba en su punto.',
  ramen: 'Ramen caliente. Perfecto después de una sesión larga.',
  sushi: 'Sushi de la tienda. Un poco de clase en Southwest Florida.',
  langosta: 'Langosta de $500. Hoy cenás como alto comando.'
};

const MENSAJES_FUMAR = {
  pack_newport: 'Encendiste un Newport. Break rápido antes de volver a la sesión.',
  shot_henny: 'Un shot de Henny. La garganta arde, el RP sigue.',
  joint: 'Te armaste el joint y bajaste un cambio. Tranqui en el server.'
};

export default {
  data: new SlashCommandBuilder()
    .setName('tienda')
    .setDescription('Tienda del servidor: permisos, seguros, comida, regalos y más.')
    .addSubcommand((s) =>
      s.setName('abrir').setDescription('Abrir la tienda del servidor (solo en #comandos)')
    )
    .addSubcommand((s) =>
      s
        .setName('inventario')
        .setDescription('Ver tu inventario de la tienda')
        .addUserOption((o) =>
          o.setName('usuario').setDescription('Ver inventario de otro (opcional)').setRequired(false)
        )
    )
    .addSubcommand((s) =>
      s
        .setName('comer')
        .setDescription('Consumir comida del inventario')
        .addStringOption((o) =>
          o
            .setName('item')
            .setDescription('Comida a consumir')
            .setRequired(true)
            .addChoices(
              { name: 'Bolsa de bodega', value: 'bolsa_bodega' },
              { name: 'Bandeja Cookout', value: 'bandeja_cookout' },
              { name: 'Popeyes', value: 'popeyes' },
              { name: 'Ramen', value: 'ramen' },
              { name: 'Sushi', value: 'sushi' },
              { name: 'Langosta', value: 'langosta' }
            )
        )
    )
    .addSubcommand((s) =>
      s
        .setName('fumar')
        .setDescription('Usar ítem de Fuma y Bebe del inventario')
        .addStringOption((o) =>
          o
            .setName('item')
            .setDescription('Qué usar')
            .setRequired(true)
            .addChoices(
              { name: 'Pack de Newport', value: 'pack_newport' },
              { name: 'Shot de Henny', value: 'shot_henny' },
              { name: '1 Joint', value: 'joint' }
            )
        )
    )
    .addSubcommand((s) =>
      s
        .setName('regalar')
        .setDescription('Regalar un ítem del inventario a otro usuario')
        .addUserOption((o) =>
          o.setName('usuario').setDescription('A quién le regalás').setRequired(true)
        )
        .addStringOption((o) =>
          o
            .setName('item')
            .setDescription('Ítem a regalar')
            .setRequired(true)
            .addChoices({ name: 'Rosa', value: 'rosa' })
        )
    )
    .addSubcommand((s) =>
      s.setName('seguro').setDescription('Ver el estado de tu seguro semanal')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // —— ABRIR ——
    if (sub === 'abrir') {
      if (!canalPermitido(interaction.channel)) {
        return interaction.reply({
          content: `La tienda solo se puede abrir en el canal **#${TIENDA_CANAL_NOMBRE}**.`,
          flags: MessageFlags.Ephemeral
        });
      }
      const saldo = await obtenerSaldo(interaction.user.id);
      return interaction.reply({
        embeds: [embedPrincipal(saldo)],
        components: [menuCategorias()]
      });
    }

    // —— INVENTARIO ——
    if (sub === 'inventario') {
      const user = interaction.options.getUser('usuario') || interaction.user;
      const inv = await obtenerInventario(user.id);
      const seguro = await obtenerSeguro(user.id);
      let seguroTxt = '_Sin seguro activo._';
      if (seguro?.itemId) {
        const it = getItem(seguro.itemId);
        seguroTxt = `**${it?.name || seguro.itemId}** — próximo cobro <t:${Math.floor(seguro.nextCharge / 1000)}:R> (${formatMoney(seguro.weekly)})`;
      }
      const embed = new EmbedBuilder()
        .setTitle(`Inventario — ${user.username}`)
        .setDescription(`${textoInventario(inv)}\n\n**Seguro**\n${seguroTxt}`)
        .setColor(TIENDA_COLOR)
        .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // —— COMER ——
    if (sub === 'comer') {
      const itemId = interaction.options.getString('item');
      const res = await consumirItem(interaction.user.id, itemId);
      if (!res.ok) {
        return interaction.reply({ content: res.mensaje, flags: MessageFlags.Ephemeral });
      }
      const msg = MENSAJES_COMER[itemId] || `Consumiste **${res.item.name}**.`;
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Comida')
            .setDescription(`${interaction.user} ${msg}`)
            .setColor(TIENDA_COLOR)
        ]
      });
    }

    // —— FUMAR / BEBER ——
    if (sub === 'fumar') {
      const itemId = interaction.options.getString('item');
      const res = await consumirItem(interaction.user.id, itemId);
      if (!res.ok) {
        return interaction.reply({ content: res.mensaje, flags: MessageFlags.Ephemeral });
      }
      const msg = MENSAJES_FUMAR[itemId] || `Usaste **${res.item.name}**.`;
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Fuma y Bebe')
            .setDescription(`${interaction.user} ${msg}`)
            .setColor(TIENDA_COLOR)
        ]
      });
    }

    // —— REGALAR ——
    if (sub === 'regalar') {
      const target = interaction.options.getUser('usuario');
      const itemId = interaction.options.getString('item');
      if (target.bot) {
        return interaction.reply({
          content: 'No podés regalarle a un bot.',
          flags: MessageFlags.Ephemeral
        });
      }
      const res = await regalarItem(interaction.user.id, target.id, itemId);
      if (!res.ok) {
        return interaction.reply({ content: res.mensaje, flags: MessageFlags.Ephemeral });
      }
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Regalo')
            .setDescription(`${interaction.user} le regaló una **${res.item.name}** a ${target}.`)
            .setColor(TIENDA_COLOR)
        ]
      });
    }

    // —— SEGURO ——
    if (sub === 'seguro') {
      const seguro = await obtenerSeguro(interaction.user.id);
      if (!seguro?.itemId) {
        return interaction.reply({
          content: 'No tenés un seguro activo. Compralo en `/tienda abrir` → Permisos y Seguros.',
          flags: MessageFlags.Ephemeral
        });
      }
      const it = getItem(seguro.itemId);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Tu seguro')
            .setDescription(
              `**${it?.name || seguro.itemId}**\n` +
                `Cobro semanal: **${formatMoney(seguro.weekly)}**\n` +
                `Próximo cobro: <t:${Math.floor(seguro.nextCharge / 1000)}:f> (<t:${Math.floor(seguro.nextCharge / 1000)}:R>)\n\n` +
                `Si no hay saldo en esa fecha, se cancela y se quita el rol.`
            )
            .setColor(TIENDA_COLOR)
        ],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
