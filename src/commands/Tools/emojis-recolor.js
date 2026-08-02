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
    hex: '#' + h.toUpperCase(),
    short: h.toLowerCase().slice(0, 6)
  };
}

async function teniriImagen(buffer, rgb, animado = false) {
  const { r, g, b } = rgb;
  if (animado) {
    try {
      return await sharp(buffer, { animated: true, pages: -1 })
        .tint({ r, g, b })
        .gif()
        .toBuffer();
    } catch {
      return teniriEstatico(buffer, rgb);
    }
  }
  return teniriEstatico(buffer, rgb);
}

async function teniriEstatico(buffer, { r, g, b }) {
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

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .png()
    .toBuffer();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function nombreNuevo(original, colorShort, existentes) {
  const base = String(original)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 20);
  let candidato = (base + '_' + colorShort).slice(0, 32);
  let n = 1;
  while (existentes.has(candidato.toLowerCase())) {
    const suf = '_' + n;
    candidato = (base + '_' + colorShort).slice(0, 32 - suf.length) + suf;
    n++;
    if (n > 50) break;
  }
  return candidato;
}

export default {
  data: new SlashCommandBuilder()
    .setName('emojis-recolor')
    .setDescription('ADMIN: Tiñe emojis del servidor hacia un color hexadecimal.')
    .addStringOption(o =>
      o
        .setName('color')
        .setDescription('Color hex, ej: #74d4fc o FF0000')
        .setRequired(true)
    )
    .addStringOption(o =>
      o
        .setName('modo')
        .setDescription('Procesar uno solo (prueba) o todos')
        .setRequired(true)
        .addChoices(
          { name: 'Uno (probar de a uno)', value: 'uno' },
          { name: 'Todos los emojis', value: 'todos' }
        )
    )
    .addStringOption(o =>
      o
        .setName('emoji')
        .setDescription('Nombre del emoji (obligatorio si modo = uno)')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addBooleanOption(o =>
      o
        .setName('conservar_viejos')
        .setDescription('true = crear teñidos y dejar originales. false = reemplazar. Default: true')
        .setRequired(false)
    )
    .addBooleanOption(o =>
      o
        .setName('incluir_animados')
        .setDescription('Incluir animados (intenta conservar GIF). Default: si')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused(true);
      if (focused.name !== 'emoji') {
        return interaction.respond([]);
      }

      if (interaction.guild.emojis.cache.size === 0) {
        await interaction.guild.emojis.fetch().catch(() => null);
      }

      const q = String(focused.value || '').toLowerCase().trim();
      let todos = [...interaction.guild.emojis.cache.values()];

      const m = q.match(/^<?a?:?([a-z0-9_]+):?\d*>?$/i);
      const query = m ? m[1].toLowerCase() : q;

      const filtrados = todos
        .filter(e => !query || e.name.toLowerCase().includes(query))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 25)
        .map(e => ({
          name: ((e.animated ? '(A) ' : '') + e.name).slice(0, 100),
          value: e.name
        }));

      await interaction.respond(filtrados);
    } catch (err) {
      try {
        await interaction.respond([]);
      } catch (_) {}
    }
  },

  async execute(interaction) {
    const esAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    const esAC = interaction.member.roles.cache.has(ROL_ALTO_MANDO);
    if (!esAdmin && !esAC) {
      return interaction.reply({
        content: 'Solo Administradores / Alto Comando pueden usar este comando.',
        ephemeral: true
      });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuildExpressions)) {
      return interaction.reply({
        content: 'El bot necesita el permiso Gestionar expresiones del servidor (Manage Emojis).',
        ephemeral: true
      });
    }

    const color = parseHex(interaction.options.getString('color'));
    if (!color) {
      return interaction.reply({
        content: 'Color invalido. Usa formato #RRGGBB (ej: #74d4fc).',
        ephemeral: true
      });
    }

    const modo = interaction.options.getString('modo');
    const conservar = interaction.options.getBoolean('conservar_viejos');
    const conservarFinal = conservar === null ? true : conservar;
    const incluirAnimadosOpt = interaction.options.getBoolean('incluir_animados');
    const incluirAnimados = incluirAnimadosOpt === null ? true : incluirAnimadosOpt;
    const nombreEmoji = interaction.options.getString('emoji');

    let emojis = [...interaction.guild.emojis.cache.values()].filter(e =>
      incluirAnimados ? true : !e.animated
    );

    if (modo === 'uno') {
      if (!nombreEmoji) {
        return interaction.reply({
          content: 'En modo uno tenes que indicar el nombre del emoji en la opcion emoji.',
          ephemeral: true
        });
      }
      const encontrado = interaction.guild.emojis.cache.find(
        e => e.name.toLowerCase() === nombreEmoji.toLowerCase()
      );
      if (!encontrado) {
        return interaction.reply({
          content: 'No encontre el emoji "' + nombreEmoji + '". Revisa el nombre (autocomplete ayuda).',
          ephemeral: true
        });
      }
      if (encontrado.animated && !incluirAnimados) {
        return interaction.reply({
          content: 'Ese emoji es animado y incluir_animados esta en false.',
          ephemeral: true
        });
      }
      emojis = [encontrado];
    }

    if (emojis.length === 0) {
      return interaction.reply({
        content: 'No hay emojis para procesar.',
        ephemeral: true
      });
    }

    const modoTexto =
      modo === 'uno'
        ? 'Uno -> ' + emojis[0].name
        : 'Todos (' + emojis.length + ')';

    const embedWarn = new EmbedBuilder()
      .setTitle('Recolor de emojis')
      .setColor(color.hex)
      .setDescription(
        [
          '**Color:** ' + color.hex,
          '**Modo:** ' + modoTexto,
          '**Conservar viejos:** ' +
            (conservarFinal
              ? 'Si (se crean nuevos, originales quedan)'
              : 'No (se reemplazan / borran originales)'),
          '**Animados:** ' + (incluirAnimados ? 'Incluidos' : 'Excluidos'),
          '',
          conservarFinal
            ? 'Los nuevos se llamaran nombre_hex (ej: si_74d4fc). Los originales no se borran.'
            : 'Cada emoji se borra y se vuelve a crear con el mismo nombre (cambia el ID).',
          '',
          'Confirma en 30 segundos.'
        ].join('\n')
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('emojis_recolor_si')
        .setLabel(modo === 'uno' ? 'Si, procesar este' : 'Si, procesar todos')
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
      return interaction.editReply({
        content: 'Cancelado por tiempo.',
        embeds: [],
        components: []
      });
    }

    if (clicked.customId === 'emojis_recolor_no') {
      return clicked.update({ content: 'Cancelado.', embeds: [], components: [] });
    }

    await clicked.update({
      content: 'Procesando 0/' + emojis.length + '...',
      embeds: [],
      components: []
    });

    let ok = 0;
    let fail = 0;
    let animOk = 0;
    const errores = [];
    const creados = [];

    for (let i = 0; i < emojis.length; i++) {
      const emoji = emojis[i];
      try {
        const actual = await interaction.guild.emojis.fetch(emoji.id).catch(() => emoji);
        const res = await fetch(
          actual.imageURL({
            extension: actual.animated ? 'gif' : 'png',
            size: 128
          })
        );
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const buf = Buffer.from(await res.arrayBuffer());
        const teñido = await teniriImagen(buf, color, actual.animated);
        const esGif = teñido[0] === 0x47 && teñido[1] === 0x49 && teñido[2] === 0x46;

        const nombresExistentes = new Set(
          [...interaction.guild.emojis.cache.values()].map(e => e.name.toLowerCase())
        );

        if (conservarFinal) {
          const nuevoNombre = nombreNuevo(actual.name, color.short, nombresExistentes);
          const creado = await interaction.guild.emojis.create({
            attachment: teñido,
            name: nuevoNombre,
            reason: 'Recolor ' + color.hex + ' (conservar) por ' + interaction.user.tag
          });
          creados.push(actual.name + ' -> ' + creado.name);
          interaction.guild.emojis.cache.set(creado.id, creado);
        } else {
          const nombre = actual.name;
          await actual.delete('Recolor a ' + color.hex + ' por ' + interaction.user.tag);
          const creado = await interaction.guild.emojis.create({
            attachment: teñido,
            name: nombre,
            reason: 'Recolor ' + color.hex + ' por ' + interaction.user.tag
          });
          creados.push(nombre + ' (reemplazado)');
          interaction.guild.emojis.cache.set(creado.id, creado);
        }

        ok++;
        if (actual.animated && esGif) animOk++;
      } catch (e) {
        fail++;
        errores.push((emoji.name + ': ' + e.message).slice(0, 90));
      }

      if (i % 2 === 0 || i === emojis.length - 1) {
        await interaction
          .editReply({
            content:
              'Procesando ' +
              (i + 1) +
              '/' +
              emojis.length +
              '... (ok: ' +
              ok +
              ', fail: ' +
              fail +
              ')'
          })
          .catch(() => null);
      }

      await sleep(1500);
    }

    let listaCreados = '';
    if (creados.length > 0) {
      listaCreados =
        '\n**Resultado:**\n```\n' +
        creados.slice(0, 15).join('\n') +
        (creados.length > 15 ? '\n...' : '') +
        '\n```';
    }

    let listaErrores = '';
    if (errores.length > 0) {
      listaErrores = '\n**Errores:**\n```\n' + errores.slice(0, 8).join('\n') + '\n```';
    }

    const embedFin = new EmbedBuilder()
      .setTitle('Recolor finalizado')
      .setColor(color.hex)
      .setDescription(
        [
          '> **Color:** ' + color.hex,
          '> **Modo:** ' + modo,
          '> **Conservar viejos:** ' + (conservarFinal ? 'Si' : 'No'),
          '> **Exitosos:** ' + ok,
          '> **Animados GIF:** ' + animOk,
          '> **Fallidos:** ' + fail,
          listaCreados,
          listaErrores
        ]
          .filter(Boolean)
          .join('\n')
      );

    await interaction.editReply({ content: null, embeds: [embedFin] });
  }
};
