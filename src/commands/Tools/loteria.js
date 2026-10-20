import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import {
  comprarBoleto,
  infoPozo,
  infoUltimo,
  buildTicketEmbed,
  PRECIO_BOLETO,
  MAX_BOLETOS_POR_USUARIO,
  NUM_MIN,
  NUM_MAX,
  NUMEROS_POR_BOLETO,
  PREMIO_3,
  PREMIO_4,
  fmt,
  fmtNums
} from '../../utils/gestorLoteria.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../../config/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('loteria')
    .setDescription('Lotería 00Y4n — comprá boletos y participá del pozo.')
    .addSubcommand((s) =>
      s
        .setName('comprar')
        .setDescription('Comprar un boleto (5 números del 1 al 39).')
        .addStringOption((o) =>
          o
            .setName('numeros')
            .setDescription('Cinco números únicos 1-39 (ej: 1 5 12 23 39)')
            .setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName('pozo').setDescription('Ver pozo actual, boletos y próximo sorteo.')
    )
    .addSubcommand((s) =>
      s.setName('ultimo').setDescription('Ver el último resultado del sorteo.')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'comprar') {
      await interaction.deferReply();
      const raw = interaction.options.getString('numeros', true);
      const res = await comprarBoleto(interaction.user.id, raw);
      if (!res.ok) {
        return interaction.editReply({
          content: `${E.cruz || ''} ${res.error}`
        });
      }
      return interaction.editReply({ embeds: [buildTicketEmbed(res)] });
    }

    if (sub === 'pozo') {
      await interaction.deferReply();
      const info = await infoPozo();
      const ts = Math.floor(new Date(info.nextDrawAt).getTime() / 1000);
      const emb = new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.premio || ''} Lotería — Pozo`)
        .setDescription(
          `${E.dot || '•'} **Sorteo actual:** #${info.drawId}\n` +
            `${E.dot || '•'} **Pozo:** **${fmt(info.pool)}**\n` +
            `${E.dot || '•'} **Boletos vendidos:** **${info.totalTickets}**\n` +
            `${E.dot || '•'} **Próximo sorteo:** <t:${ts}:F> (<t:${ts}:R>)\n\n` +
            `${E.flecha || ''} Boleto: **${fmt(PRECIO_BOLETO)}** · Máx **${MAX_BOLETOS_POR_USUARIO}** por persona\n` +
            `${E.flecha || ''} Elegí **${NUMEROS_POR_BOLETO}** números del **${NUM_MIN}–${NUM_MAX}**\n` +
            `${E.flecha || ''} Premios: 5 aciertos = pozo · 4 = ${fmt(PREMIO_4)} · 3 = ${fmt(PREMIO_3)}`
        )
        .setFooter({ text: 'Southwest Florida 00Y4n · /loteria comprar' })
        .setTimestamp();
      return interaction.editReply({ embeds: [emb] });
    }

    if (sub === 'ultimo') {
      await interaction.deferReply();
      const last = await infoUltimo();
      if (!last) {
        return interaction.editReply({
          content: `${E.dot || '•'} Todavía no hubo ningún sorteo.`
        });
      }
      const emb = new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.trofeoalas || E.premio || ''} Lotería — Último sorteo`)
        .addFields(
          { name: 'Sorteo', value: `**#${last.drawId}**`, inline: true },
          {
            name: 'Números',
            value: `**${fmtNums(last.winning)}**`,
            inline: true
          },
          {
            name: 'Pozo',
            value: `${fmt(last.poolBefore)} → ${fmt(last.poolAfter)}`,
            inline: true
          },
          {
            name: 'Boletos',
            value: String(last.totalTickets),
            inline: true
          },
          {
            name: 'Aciertos',
            value: `5: **${last.matchCounts?.[5] || 0}** · 4: **${last.matchCounts?.[4] || 0}** · 3: **${last.matchCounts?.[3] || 0}**`,
            inline: false
          }
        )
        .setFooter({ text: 'Southwest Florida 00Y4n · Lotería' })
        .setTimestamp(last.at ? new Date(last.at) : undefined);
      return interaction.editReply({ embeds: [emb] });
    }
  }
};
