import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} from 'discord.js';
import sharp from 'sharp';

const ROL_PERMITIDO = '1451956429345919008';
const PREFIJO_ORIGEN = 'nara_';

function parseHex(hex) {
  const h = String(hex || '').trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    hex: '#' + h.toUpperCase(),
    short: h.toLowerCase()
  };
}

function sanitizarPrefijo(raw) {
  let p = String(raw || '').trim().toLowerCase().replace(/^#+/, '').replace(/[^a-z0-9_]/g, '_');
  if (!p) return null;
  if (!p.endsWith('_')) p += '_';
  if (p.length > 20) p = p.slice(0, 20);
  if (!/^[a-z0-9_]+_$/.test(p)) return null;
  return p;
}

function nombreConNuevoPrefijo(nombreOriginal, nuevoPrefijo) {
  const lower = String(nombreOriginal || '').toLowerCase();
  if (!lower.startsWith(PREFIJO_ORIGEN)) return null;
  const resto = lower.slice(PREFIJO_ORIGEN.length);
  if (!resto) return null;
  let candidato = (nuevoPrefijo + resto).slice(0, 32);
  candidato = candidato.replace(/[^a-z0-9_]/g, '_').slice(0, 32);
  if (!candidato || candidato.length < 2) return null;
  return candidato;
}

function nombreUnico(candidato, existentes) {
  let base = candidato;
  let n = 1;
  let out = base;
  while (existentes.has(out.toLowerCase())) {
    const suf = '_' + n;
    out = base.slice(0, Math.max(1, 32 - suf.length)) + suf;
    n++;
    if (n > 80) break;
  }
  return out;
}

async function descargarEmoji(emoji) {
  const id = emoji.id;
  const animado = !!emoji.animated;
  const candidatos = [];
  if (animado) {
    candidatos.push('https://cdn.discordapp.com/emojis/' + id + '.gif?size=128');
    candidatos.push('https://cdn.discordapp.com/emojis/' + id + '.gif?size=96');
    candidatos.push('https://cdn.discordapp.com/emojis/' + id + '.gif');
    try {
      candidatos.push(emoji.imageURL({ extension: 'gif', size: 128 }));
      candidatos.push(emoji.imageURL({ extension: 'gif' }));
    } catch (_) {}
  }
  candidatos.push('https://cdn.discordapp.com/emojis/' + id + '.png?size=128');
  candidatos.push('https://cdn.discordapp.com/emojis/' + id + '.png');
  candidatos.push('https://cdn.discordapp.com/emojis/' + id + '.webp?size=128');
  try {
    candidatos.push(emoji.imageURL({ extension: 'png', size: 128 }));
    candidatos.push(emoji.imageURL({ extension: 'png' }));
  } catch (_) {}

  const headers = {
    'User-Agent': '00Y4nBot/1.0 (emoji-recolor)',
    Accept: 'image/gif,image/png,image/webp,image/*,*/*'
  };

  let ultimoError = 'sin respuesta';
  for (const url of candidatos) {
    if (!url) continue;
    try {
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(), 12000);
      const res = await fetch(url, { headers, signal: ac.signal });
      clearTimeout(to);
      if (!res.ok) {
        ultimoError = 'HTTP ' + res.status;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 20) {
        ultimoError = 'buffer vacio';
        continue;
      }
      // Si pedimos animado, solo aceptar GIF real (evitar caer a PNG y fallar luego)
      if (animado) {
        const esGif = buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46;
        if (!esGif) {
          ultimoError = 'no es GIF';
          continue;
        }
      }
      return { buffer: buf, animado };
    } catch (e) {
      ultimoError = e.name === 'AbortError' ? 'timeout descarga' : (e.message || String(e));
    }
  }
  throw new Error('No se pudo descargar: ' + ultimoError);
}

/** Aplica degradado blanco->color sobre buffer RGBA crudo (un frame o apilado). */
function aplicarDegradadoRaw(src, width, height, { r, g, b }) {
  const out = Buffer.alloc(src.length);
  const denom = Math.max(width - 1, 1);
  const framePixels = width * height;

  // max luminancia por frame si height es multiplo de pageHeight se maneja afuera;
  // aca height = alto de este bloque (1 frame)
  let maxLum = 0;
  for (let i = 0; i < src.length; i += 4) {
    if (src[i + 3] < 8) continue;
    const lum = (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255;
    if (lum > maxLum) maxLum = lum;
  }
  if (maxLum < 0.05) maxLum = 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = src[i + 3];
      out[i + 3] = a;
      if (a === 0) {
        out[i] = 0;
        out[i + 1] = 0;
        out[i + 2] = 0;
        continue;
      }

      const lum = (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255;
      let intensity = Math.min(1, (lum / maxLum) * 1.1);
      intensity = Math.pow(intensity, 0.82);

      const tLinear = x / denom;
      let t = Math.pow(tLinear, 0.72);
      t = t * t * (3 - 2 * t);
      t = Math.min(1, t * 0.92 + 0.12);

      let gr = 255 * (1 - t) + r * t;
      let gg = 255 * (1 - t) + g * t;
      let gb = 255 * (1 - t) + b * t;

      if (tLinear < 0.12 && intensity > 0.5) {
        const whitePull = Math.pow((0.12 - tLinear) / 0.12, 1.1) * 0.32 * intensity;
        gr = gr + (255 - gr) * whitePull;
        gg = gg + (255 - gg) * whitePull;
        gb = gb + (255 - gb) * whitePull;
      }

      out[i] = Math.min(255, Math.round(gr * intensity));
      out[i + 1] = Math.min(255, Math.round(gg * intensity));
      out[i + 2] = Math.min(255, Math.round(gb * intensity));
    }
  }
  return out;
}

async function aplicarDegradadoEstatico(buffer, rgb) {
  const { data, info } = await sharp(buffer, { animated: false, pages: 1 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels < 4) throw new Error('Imagen sin canal alpha esperado');
  const out = aplicarDegradadoRaw(Buffer.from(data), info.width, info.height, rgb);

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .png()
    .toBuffer();
}

const MAX_GIF_FRAMES = 48;
const GIF_TIMEOUT_MS = 45000;

function conTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, rej) => {
    timer = setTimeout(() => rej(new Error(label + ' timeout (' + Math.round(ms / 1000) + 's)')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function aplicarDegradadoAnimado(buffer, rgb) {
  if (!(buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46)) {
    throw new Error('El archivo descargado no es un GIF valido');
  }

  const meta = await sharp(buffer, { animated: true, pages: -1 }).metadata();
  let pages = Math.max(1, meta.pages || 1);
  const w = meta.width;
  let h = meta.pageHeight || meta.height;
  if (!w || !h) throw new Error('GIF sin dimensiones');

  // Algunos GIFs reportan height total; preferir pageHeight
  if (meta.pageHeight) h = meta.pageHeight;

  if (pages > MAX_GIF_FRAMES) {
    pages = MAX_GIF_FRAMES;
  }

  let delays = meta.delay;
  if (!Array.isArray(delays)) {
    delays = Array(pages).fill(typeof delays === 'number' ? delays : 50);
  }
  while (delays.length < pages) delays.push(50);
  delays = delays.slice(0, pages).map((d) => Math.max(20, Math.min(1000, d || 50)));

  // Una sola extraccion raw de todos los frames (mucho mas rapido que frame-a-frame + PNG)
  const { data, info } = await sharp(buffer, {
    animated: true,
    pages,
    limitInputPixels: 268402689
  })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const frameH = info.pageHeight || h;
  const frameW = info.width || w;
  const totalH = info.height;
  const detectedPages = Math.max(1, Math.round(totalH / frameH));
  const usePages = Math.min(pages, detectedPages);

  const outFrames = [];
  for (let page = 0; page < usePages; page++) {
    const offset = page * frameW * frameH * 4;
    const frameSize = frameW * frameH * 4;
    const srcFrame = data.subarray(offset, offset + frameSize);
    if (srcFrame.length < frameSize) break;
    outFrames.push(aplicarDegradadoRaw(Buffer.from(srcFrame), frameW, frameH, rgb));
  }

  if (!outFrames.length) throw new Error('No se pudieron procesar frames del GIF');

  const stacked = Buffer.concat(outFrames);
  const finalPages = outFrames.length;
  const finalDelays = delays.slice(0, finalPages);

  let out = await sharp(stacked, {
    raw: { width: frameW, height: frameH * finalPages, channels: 4 }
  })
    .gif({
      pageHeight: frameH,
      delay: finalDelays,
      effort: 1,
      loop: meta.loop ?? 0,
      colours: 128
    })
    .toBuffer();

  // Si supera 256KB, reintentar mas chico / menos colores
  if (out.length > 256 * 1024) {
    const scale = frameW > 64 ? 64 : frameW;
    const resizedFrames = [];
    for (const fr of outFrames) {
      const png = await sharp(fr, { raw: { width: frameW, height: frameH, channels: 4 } })
        .resize(scale, scale, { fit: 'fill' })
        .ensureAlpha()
        .raw()
        .toBuffer();
      resizedFrames.push(png);
    }
    out = await sharp(Buffer.concat(resizedFrames), {
      raw: { width: scale, height: scale * finalPages, channels: 4 }
    })
      .gif({
        pageHeight: scale,
        delay: finalDelays,
        effort: 1,
        loop: meta.loop ?? 0,
        colours: 64
      })
      .toBuffer();
  }

  if (!out || out.length < 50) throw new Error('GIF resultado vacio');
  if (!(out[0] === 0x47 && out[1] === 0x49 && out[2] === 0x46)) {
    throw new Error('Salida no es GIF valido');
  }
  if (out.length > 256 * 1024) {
    throw new Error(
      'GIF resultante demasiado pesado (' + Math.round(out.length / 1024) + 'KB > 256KB)'
    );
  }
  return out;
}

async function procesarBuffer(buffer, rgb, animado) {
  if (animado) {
    const gif = await conTimeout(
      aplicarDegradadoAnimado(buffer, rgb),
      GIF_TIMEOUT_MS,
      'Procesado GIF'
    );
    return { buffer: gif, animado: true };
  }
  const png = await aplicarDegradadoEstatico(buffer, rgb);
  return { buffer: png, animado: false };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default {
  data: new SlashCommandBuilder()
    .setName('emojis-recolor')
    .setDescription('Degradado blanco a color en emojis nara_*; crea copias con nuevo prefijo.')
    .addStringOption((o) =>
      o.setName('color').setDescription('Color hex destino, ej: #fb8b66 o fb8b66').setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName('prefijo')
        .setDescription('Nuevo prefijo que reemplaza nara_ (ej: coral -> coral_lock)')
        .setRequired(true)
        .setMaxLength(20)
    )
    .addStringOption((o) =>
      o
        .setName('modo')
        .setDescription('Procesar uno (prueba) o todos los nara_*')
        .setRequired(true)
        .addChoices(
          { name: 'Uno (probar de a uno)', value: 'uno' },
          { name: 'Todos los nara_*', value: 'todos' }
        )
    )
    .addStringOption((o) =>
      o
        .setName('emoji')
        .setDescription('Nombre del emoji (obligatorio si modo = uno), ej: nara_lock')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .setDefaultMemberPermissions(null),

  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused(true);
      if (focused.name !== 'emoji') return interaction.respond([]);
      if (interaction.guild.emojis.cache.size === 0) {
        await interaction.guild.emojis.fetch().catch(() => null);
      }
      const q = String(focused.value || '').toLowerCase().trim();
      const todos = [...interaction.guild.emojis.cache.values()].filter((e) =>
        e.name.toLowerCase().startsWith(PREFIJO_ORIGEN)
      );
      const filtrados = todos
        .filter((e) => !q || e.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 25)
        .map((e) => ({
          name: ((e.animated ? '(A) ' : '') + e.name).slice(0, 100),
          value: e.name
        }));
      await interaction.respond(filtrados);
    } catch (_) {
      try {
        await interaction.respond([]);
      } catch (_) {}
    }
  },

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ROL_PERMITIDO)) {
      return interaction.reply({
        content: 'Acceso denegado. Este comando es exclusivo del rol **Supervisor Ejecutivo**.',
        ephemeral: true
      });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuildExpressions)) {
      return interaction.reply({
        content: 'El bot necesita el permiso **Gestionar expresiones del servidor** (Manage Emojis).',
        ephemeral: true
      });
    }

    const color = parseHex(interaction.options.getString('color'));
    if (!color) {
      return interaction.reply({
        content: 'Color invalido. Usa un hex de 6 digitos, ej: `#fb8b66` o `fb8b66`.',
        ephemeral: true
      });
    }

    const nuevoPrefijo = sanitizarPrefijo(interaction.options.getString('prefijo'));
    if (!nuevoPrefijo) {
      return interaction.reply({
        content: 'Prefijo invalido. Solo letras, numeros y `_`. Ejemplo: `coral` -> se usara `coral_`.',
        ephemeral: true
      });
    }

    if (nuevoPrefijo === PREFIJO_ORIGEN) {
      return interaction.reply({
        content: 'El prefijo nuevo no puede ser igual a `' + PREFIJO_ORIGEN + '`.',
        ephemeral: true
      });
    }

    const modo = interaction.options.getString('modo');
    const emojiNombreOpt = interaction.options.getString('emoji');

    await interaction.deferReply({ ephemeral: true });

    await interaction.guild.emojis.fetch().catch(() => null);
    const cache = interaction.guild.emojis.cache;

    let lista = [...cache.values()].filter((e) => e.name.toLowerCase().startsWith(PREFIJO_ORIGEN));

    if (modo === 'uno') {
      if (!emojiNombreOpt) {
        return interaction.editReply({
          content: 'En modo **uno** tenes que indicar la opcion `emoji` (ej: `nara_lock`).'
        });
      }
      const found = lista.find((e) => e.name.toLowerCase() === emojiNombreOpt.toLowerCase());
      if (!found) {
        return interaction.editReply({
          content: 'No encontre un emoji `' + emojiNombreOpt + '` que empiece con `' + PREFIJO_ORIGEN + '`.'
        });
      }
      lista = [found];
    }

    if (lista.length === 0) {
      return interaction.editReply({
        content: 'No hay emojis que empiecen con `' + PREFIJO_ORIGEN + '`.'
      });
    }

    const estaticos = lista.filter((e) => !e.animated).length;
    const animados = lista.filter((e) => e.animated).length;

    await interaction.editReply({
      content:
        'Iniciando degradado **blanco -> ' +
        color.hex +
        '**\n' +
        'Prefijo: `' +
        PREFIJO_ORIGEN +
        '*` -> `' +
        nuevoPrefijo +
        '*`\n' +
        'A procesar: **' +
        lista.length +
        '** (' +
        estaticos +
        ' estaticos, ' +
        animados +
        ' animados)\n' +
        'Originales: **se conservan**\n' +
        'Si un GIF falla, **no** se sube estatico; solo se reporta.'
    });

    const nombresExistentes = new Set([...cache.values()].map((e) => e.name.toLowerCase()));

    let ok = 0;
    let fail = 0;
    let animOk = 0;
    const creados = [];
    const errores = [];

    for (let i = 0; i < lista.length; i++) {
      const actual = lista[i];
      try {
        const nuevoBase = nombreConNuevoPrefijo(actual.name, nuevoPrefijo);
        if (!nuevoBase) throw new Error('Nombre no valido tras cambiar prefijo');
        const nuevoNombre = nombreUnico(nuevoBase, nombresExistentes);

        if (actual.animated) {
          await interaction
            .editReply({
              content:
                'Procesando GIF **' +
                actual.name +
                '** (' +
                (i + 1) +
                '/' +
                lista.length +
                ')... esto puede tardar hasta ~45s'
            })
            .catch(() => null);
        }
        const desc = await descargarEmoji(actual);
        const proc = await procesarBuffer(desc.buffer, color, desc.animado);

        if (desc.animado && !proc.animado) {
          throw new Error('No se pudo conservar animacion GIF');
        }

        const creado = await interaction.guild.emojis.create({
          attachment: proc.buffer,
          name: nuevoNombre,
          reason:
            'Recolor degradado ' +
            color.hex +
            ' (' +
            PREFIJO_ORIGEN +
            '->' +
            nuevoPrefijo +
            ') por ' +
            interaction.user.tag
        });

        nombresExistentes.add(creado.name.toLowerCase());
        interaction.guild.emojis.cache.set(creado.id, creado);

        const nota = proc.animado ? ' (GIF)' : '';
        creados.push(actual.name + ' -> ' + creado.name + nota);
        ok++;
        if (proc.animado) animOk++;
      } catch (e) {
        fail++;
        const tag = actual.animated ? actual.name + ' [GIF]' : actual.name;
        errores.push(tag + ': ' + String(e.message || e).slice(0, 120));
      }

      if (i % 2 === 0 || i === lista.length - 1) {
        await interaction
          .editReply({
            content: 'Procesando ' + (i + 1) + '/' + lista.length + '... (ok: ' + ok + ', fail: ' + fail + ')'
          })
          .catch(() => null);
      }
      await sleep(1600);
    }

    let listaCreados = '';
    if (creados.length > 0) {
      listaCreados =
        '\n**Creados:**\n```\n' +
        creados.slice(0, 20).join('\n') +
        (creados.length > 20 ? '\n...' : '') +
        '\n```';
    }

    let listaErrores = '';
    if (errores.length > 0) {
      listaErrores =
        '\n**Fallidos (no se subio estatico si era GIF):**\n```\n' +
        errores.slice(0, 15).join('\n') +
        (errores.length > 15 ? '\n...' : '') +
        '\n```';
    }

    const embedFin = new EmbedBuilder()
      .setTitle('Recolor finalizado')
      .setColor(color.hex)
      .setDescription(
        [
          '> **Color:** ' + color.hex,
          '> **Prefijo:** `' + PREFIJO_ORIGEN + '` -> `' + nuevoPrefijo + '`',
          '> **Originales:** conservados',
          '> **Exitosos:** ' + ok,
          '> **Animados GIF OK:** ' + animOk,
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
