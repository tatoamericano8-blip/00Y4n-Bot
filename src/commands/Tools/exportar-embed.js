import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType
} from 'discord.js';
import { AttachmentBuilder } from 'discord.js';

const ROL_ALTO_MANDO = '1528870731629465752';
const ROL_GERENTE_STAFF = '1452684893850177587';

function embedToPlain(embed) {
  const e = embed.data || embed;
  const out = {};

  if (e.title) out.title = e.title;
  if (e.description) out.description = e.description;
  if (e.url) out.url = e.url;
  if (e.color != null) {
    const hex = typeof e.color === 'number'
      ? '#' + e.color.toString(16).padStart(6, '0')
      : String(e.color);
    out.color = hex;
  }
  if (e.timestamp) out.timestamp = e.timestamp;
  if (e.thumbnail?.url) out.thumbnail = e.thumbnail.url;
  if (e.image?.url) out.image = e.image.url;
  if (e.footer) {
    out.footer = { text: e.footer.text || '' };
    if (e.footer.icon_url || e.footer.iconURL) {
      out.footer.iconURL = e.footer.icon_url || e.footer.iconURL;
    }
  }
  if (e.author) {
    out.author = { name: e.author.name || '' };
    if (e.author.url) out.author.url = e.author.url;
    if (e.author.icon_url || e.author.iconURL) {
      out.author.iconURL = e.author.icon_url || e.author.iconURL;
    }
  }
  if (Array.isArray(e.fields) && e.fields.length) {
    out.fields = e.fields.map(f => ({
      name: f.name,
      value: f.value,
      inline: Boolean(f.inline)
    }));
  }
  return out;
}

function toJsCode(plains, messageMeta = {}) {
  const lines = [];
  lines.push("import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';");
  lines.push('');
  lines.push('/**');
  lines.push(` * Exportado desde mensaje ${messageMeta.id || '?'}`);
  if (messageMeta.channelId) lines.push(` * Canal: ${messageMeta.channelId}`);
  if (messageMeta.url) lines.push(` * ${messageMeta.url}`);
  lines.push(' * Pega esto en src/config/embeds/ o usalo en un comando/panel.');
  lines.push(' */');
  lines.push('');

  if (plains.length === 0) {
    lines.push('// Este mensaje no tenia embeds.');
    lines.push('export const embeds = [];');
    return lines.join('\n');
  }

  plains.forEach((p, i) => {
    const name = plains.length === 1 ? 'embed' : `embed${i + 1}`;
    lines.push(`export const ${name} = new EmbedBuilder()`);
    if (p.title) lines.push(`  .setTitle(${JSON.stringify(p.title)})`);
    if (p.description) lines.push(`  .setDescription(${JSON.stringify(p.description)})`);
    if (p.url) lines.push(`  .setURL(${JSON.stringify(p.url)})`);
    if (p.color) lines.push(`  .setColor(${JSON.stringify(p.color)})`);
    if (p.thumbnail) lines.push(`  .setThumbnail(${JSON.stringify(p.thumbnail)})`);
    if (p.image) lines.push(`  .setImage(${JSON.stringify(p.image)})`);
    if (p.timestamp) {
      lines.push(`  .setTimestamp(new Date(${JSON.stringify(p.timestamp)}))`);
    }
    if (p.footer) {
      const f = { text: p.footer.text };
      if (p.footer.iconURL) f.iconURL = p.footer.iconURL;
      lines.push(`  .setFooter(${JSON.stringify(f)})`);
    }
    if (p.author) {
      const a = { name: p.author.name };
      if (p.author.url) a.url = p.author.url;
      if (p.author.iconURL) a.iconURL = p.author.iconURL;
      lines.push(`  .setAuthor(${JSON.stringify(a)})`);
    }
    if (p.fields?.length) {
      lines.push('  .addFields(');
      p.fields.forEach((f, fi) => {
        const comma = fi < p.fields.length - 1 ? ',' : '';
        lines.push(`    ${JSON.stringify(f)}${comma}`);
      });
      lines.push('  )');
    }
    lines.push(';');
    lines.push('');
  });

  if (plains.length > 1) {
    lines.push(`export const embeds = [${plains.map((_, i) => `embed${i + 1}`).join(', ')}];`);
  } else {
    lines.push('export const embeds = [embed];');
  }
  lines.push('');
  lines.push('// Uso rapido:');
  lines.push('// await channel.send({ embeds });');
  lines.push('');

  return lines.join('\n');
}

function toJsonCode(plains, messageMeta = {}) {
  const payload = {
    _meta: {
      messageId: messageMeta.id || null,
      channelId: messageMeta.channelId || null,
      url: messageMeta.url || null,
      exportedAt: new Date().toISOString()
    },
    embeds: plains
  };
  return JSON.stringify(payload, null, 2);
}

function componentsSummary(message) {
  if (!message.components?.length) return null;
  try {
    return message.components.map((row, ri) => {
      const comps = row.components || [];
      return {
        row: ri,
        items: comps.map(c => ({
          type: c.type,
          customId: c.customId || null,
          label: c.label || null,
          placeholder: c.placeholder || null,
          options: c.options?.map(o => ({
            label: o.label,
            value: o.value,
            description: o.description || null,
            emoji: o.emoji ? (o.emoji.name || o.emoji.id) : null
          })) || null
        }))
      };
    });
  } catch {
    return null;
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('exportar-embed')
    .setDescription('Exporta los embeds de un mensaje a codigo JS o JSON para tus archivos del bot.')
    .addStringOption(o =>
      o
        .setName('mensaje_id')
        .setDescription('ID del mensaje a exportar (clic derecho - Copiar ID)')
        .setRequired(true)
    )
    .addChannelOption(o =>
      o
        .setName('canal')
        .setDescription('Canal del mensaje (si no es este canal)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addStringOption(o =>
      o
        .setName('formato')
        .setDescription('Formato de salida')
        .addChoices(
          { name: 'JavaScript (EmbedBuilder)', value: 'js' },
          { name: 'JSON', value: 'json' }
        )
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const esAC =
      interaction.member.roles.cache.has(ROL_ALTO_MANDO) ||
      interaction.member.roles.cache.has(ROL_GERENTE_STAFF) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!esAC) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> Solo **Alto Comando / Gerente de Staff** puede exportar embeds.',
        flags: MessageFlags.Ephemeral
      });
    }

    const mensajeId = interaction.options.getString('mensaje_id').trim();
    const canalOpt = interaction.options.getChannel('canal');
    const formato = interaction.options.getString('formato') || 'js';
    const canal = canalOpt || interaction.channel;

    if (!/^\d{17,20}$/.test(mensajeId)) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> El **mensaje_id** no parece un ID valido de Discord.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let message;
    try {
      message = await canal.messages.fetch(mensajeId);
    } catch {
      return interaction.editReply({
        content:
          '<:cruz00y4n:1523041302764191844> No encontre ese mensaje.\n' +
          '> Revisa el ID y que el **canal** sea el correcto.\n' +
          '> El bot necesita poder **leer el historial** de ese canal.'
      });
    }

    const plains = (message.embeds || []).map(embedToPlain);
    const meta = {
      id: message.id,
      channelId: message.channelId,
      url: message.url
    };

    const code =
      formato === 'json' ? toJsonCode(plains, meta) : toJsCode(plains, meta);

    const comps = componentsSummary(message);
    let extra = '';
    if (comps) {
      extra =
        '\n\n**Componentes detectados** (menus/botones — recrearlos en el bot):\n```json\n' +
        JSON.stringify(comps, null, 2).slice(0, 1500) +
        '\n```';
    }

    const resumen = new EmbedBuilder()
      .setColor('#74d4fc')
      .setTitle('Embed exportado')
      .setDescription(
        `> **Mensaje:** [ir al mensaje](${message.url})\n` +
          `> **Canal:** <#${message.channelId}>\n` +
          `> **Embeds:** **${plains.length}**\n` +
          `> **Formato:** \`${formato}\`\n` +
          `> **Contenido de texto:** ${message.content ? 'si' : 'no'}\n` +
          (comps ? '> **Menus/botones:** si (ver resumen abajo)' : '> **Menus/botones:** no')
      )
      .setFooter({ text: '00Y4n • Guarda el archivo en src/config/embeds/' })
      .setTimestamp();

    const ext = formato === 'json' ? 'json' : 'js';
    const fileName = `embed_${mensajeId}.${ext}`;

    if (code.length > 1800) {
      const file = new AttachmentBuilder(Buffer.from(code, 'utf8'), { name: fileName });
      return interaction.editReply({
        embeds: [resumen],
        content: extra ? extra.slice(0, 1800) : undefined,
        files: [file]
      });
    }

    return interaction.editReply({
      embeds: [resumen],
      content: `\`\`\`${formato === 'json' ? 'json' : 'js'}\n${code}\n\`\`\`${extra}`.slice(0, 2000)
    });
  }
};
