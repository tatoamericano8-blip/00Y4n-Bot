import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import sharp from 'sharp';

const ROL_ALTO_MANDO = '1528870731629465752';

function parseHex(hex) {
  const h = String(hex || '').trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    hex: `#${h.toUpperCase()}`
  };
}

async function teñirImagen(buffer, { r, g, b }, animado = false) {
  const { data, info } = await sharp(buffer, { animated: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const a = out[i + 3];
    if (a === 0) continue;
    const lum = (out[i] * 0.299 + out[i + 1] * 0.587 + out[i + 2] * 0.114) / 255;
    out[i] = Math.round(r * lum);
    out[i + 1] = Math.round(g * lum);
    out[i + 2] = Math.round(b * lum);
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export default {
  data: new SlashCommandBuilder()
    .setName('emojis-recolor')
    .setDescription('ADMIN: Tiñe todos los emojis del servidor hacia un color hexadecimal.')
    .addStringOption(o =>
      o
        .setName('color')
        .setDescription('Color hex, ej: #74d4fc o FF0000')
        .setRequired(true)
    )
    .addBooleanOption(o =>
      o
        .setName('incluir_animados')
        .setDescription('Incluir animados (pasan a estáticos teñidos). Default: sí')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
      !interaction.member.roles.cache.has(ROL_ALTO_MANDO)
    ) {
      return interaction.reply({
        content: '❌ Solo **Administradores / Alto Comando** pueden usar este comando.',
        ephemeral: true
      });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuildExpressions)) {
      return interaction.reply({
        content:
          '❌ El bot necesita el permiso **Gestionar expresiones del servidor** (Manage Emojis).',
        ephemeral: true
      });
    }

    const color = parseHex(interaction.options.getString('color'));
    if (!color) {
      return interaction.reply({
        content: '❌ Color inválido. Usá formato `#RRGGBB` (ej: `#74d4fc`).',
        ephemeral: true
      });
    }

    const incluirAnimados = interaction.options.getBoolean('incluir_animados') ?? true;
    const emojis = [...interaction.guild.emojis.cache.values()].filter(e =>
      incluirAnimados ? true : !e.animated
    );

    if (emojis.length === 0) {
      return interaction.reply({
        content: 'No hay emojis personalizados para procesar.',
        ephemeral: true
      });
    }

    const embedWarn = new EmbedBuilder()
      .setTitle('⚠️ Recolor de emojis del servidor')
      .setColor(color.hex)
      .setDescription(
        `Vas a **teñir ${emojis.length} emoji(s)** hacia **${color.hex}**.\n\n` +
          `> Discord **no permite** cambiar el color sin re-subir el emoji.\n` +
          `> Se **borra** el original y se **crea** uno nuevo con el mismo nombre.\n` +
          `> Los **animados** pasan a **estáticos** teñidos.\n` +
          `> Los **IDs cambian** → embeds con \\`<:nombre:ID>\\` viejo dejarán de verse.\n\n` +
          `Confirmá en **30 segundos**.`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('emojis_recolor_si')
        .setLabel('Sí, teñir todos')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('emojis_recolor_no')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await interaction.reply({
      embeds: [embedWarn],
      components: [row],
      ephemeral: true,
      fetchReply: true
    });

    let clicked;
    try {
      clicked = await msg.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: 30_000,
        filter: i => i.user.id === interaction.user.id
      });
    } catch {
      return interaction.editReply({ content: '⏰ Cancelado por tiempo.', embeds: [], components: [] });
    }

    if (clicked.customId === 'emojis_recolor_no') {
      return clicked.update({ content: 'Cancelado.', embeds: [], components: [] });
    }

    await clicked.update({
      content: `🎨 Procesando **0/${emojis.length}**…`,
      embeds: [],
      components: []
    });

    let ok = 0;
    let fail = 0;
    const errores = [];

    for (let i = 0; i < emojis.length; i++) {
      const emoji = emojis[i];
      try {
        const res = await fetch(
          emoji.imageURL({ extension: emoji.animated ? 'gif' : 'png', size: 128 })
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const teñido = await teñirImagen(buf, color, emoji.animated);

        const nombre = emoji.name;
        await emoji.delete(`Recolor a ${color.hex} por ${interaction.user.tag}`);
        await interaction.guild.emojis.create({
          attachment: teñido,
          name: nombre,
          reason: `Recolor ${color.hex} por ${interaction.user.tag}`
        });
        ok++;
      } catch (e) {
        fail++;
        errores.push(`${emoji.name}: ${e.message}`.slice(0, 80));
      }

      if (i % 3 === 0 || i === emojis.length - 1) {
        await interaction
          .editReply({
            content: `🎨 Procesando **${i + 1}/${emojis.length}**… (ok: ${ok}, fail: ${fail})`
          })
          .catch(() => null);
      }

      await sleep(1500);
    }

    const embedFin = new EmbedBuilder()
      .setTitle('✅ Recolor finalizado')
      .setColor(color.hex)
      .setDescription(
        `> **Color:** ${color.hex}\n` +
          `> **Exitosos:** ${ok}\n` +
          `> **Fallidos:** ${fail}` +
          (errores.length
            ? `\n\n**Errores:**\n\`\`\`\n${errores.slice(0, 8).join('\n')}\n\`\`\``
            : '')
      );

    await interaction.editReply({ content: null, embeds: [embedFin] });
  }
};
