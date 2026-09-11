import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';

const ROL_PERMITIDO = '1451956429345919008';
const ROL_ALTO = '1528870731629465752';

/** Parsea tags <:name:id>, <a:name:id>, URLs de CDN y IDs sueltos. */
function extraerEmojis(texto) {
  const out = [];
  const seen = new Set();

  const tagRe = /<(a)?:([a-zA-Z0-9_]{1,32}):(\d{17,20})>/g;
  let m;
  while ((m = tagRe.exec(texto)) !== null) {
    const id = m[3];
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      name: m[2],
      animated: m[1] === 'a',
      source: 'tag'
    });
  }

  const urlRe =
    /https?:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\/emojis\/(\d{17,20})\.(gif|png|webp)(?:\?[^?\s]*)?/gi;
  while ((m = urlRe.exec(texto)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const ext = m[2].toLowerCase();
    out.push({
      id,
      name: `emoji_${id.slice(-6)}`,
      animated: ext === 'gif',
      source: 'url'
    });
  }

  return out;
}

function sanitizarNombre(raw, fallback) {
  let n = String(raw || fallback || 'emoji')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (!n || n.length < 2) n = fallback || 'emoji';
  return n.slice(0, 32);
}

function nombreUnico(candidato, existentes) {
  let base = sanitizarNombre(candidato, 'emoji');
  let out = base;
  let n = 1;
  while (existentes.has(out.toLowerCase())) {
    const suf = `_${n}`;
    out = base.slice(0, Math.max(1, 32 - suf.length)) + suf;
    n++;
    if (n > 99) break;
  }
  return out;
}

/** Descarga el archivo ORIGINAL del CDN (sin reescalar) para no perder calidad. */
async function descargarOriginal({ id, animated }) {
  const headers = {
    'User-Agent': '00Y4nBot/1.0 (emoji-copy)',
    Accept: 'image/gif,image/png,image/webp,image/*,*/*'
  };

  const candidatos = [];
  if (animated) {
    // GIF original sin size = máxima fidelidad de animación
    candidatos.push(`https://cdn.discordapp.com/emojis/${id}.gif`);
    candidatos.push(`https://cdn.discordapp.com/emojis/${id}.gif?size=4096`);
    candidatos.push(`https://cdn.discordapp.com/emojis/${id}.gif?size=128`);
  } else {
    // PNG lossless a resolución máxima disponible
    candidatos.push(
      `https://cdn.discordapp.com/emojis/${id}.png?size=4096&quality=lossless`
    );
    candidatos.push(`https://cdn.discordapp.com/emojis/${id}.png?size=4096`);
    candidatos.push(`https://cdn.discordapp.com/emojis/${id}.png?quality=lossless`);
    candidatos.push(`https://cdn.discordapp.com/emojis/${id}.png`);
    candidatos.push(`https://cdn.discordapp.com/emojis/${id}.webp?size=4096`);
  }

  let ultimo = 'sin respuesta';
  for (const url of candidatos) {
    try {
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(), 15000);
      const res = await fetch(url, { headers, signal: ac.signal });
      clearTimeout(to);
      if (!res.ok) {
        ultimo = `HTTP ${res.status}`;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 24) {
        ultimo = 'buffer vacío';
        continue;
      }
      if (animated) {
        const esGif = buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46;
        if (!esGif) {
          ultimo = 'no es GIF';
          continue;
        }
      }
      // Discord limita emojis a 256 KiB
      if (buf.length > 256 * 1024) {
        ultimo = `archivo ${Math.round(buf.length / 1024)}KB > 256KB`;
        // seguir probando variantes más chicas
        continue;
      }
      return buf;
    } catch (e) {
      ultimo =
        e.name === 'AbortError' ? 'timeout descarga' : e.message || String(e);
    }
  }
  throw new Error(ultimo);
}

async function descargarAttachment(attachment) {
  if (!attachment) throw new Error('sin archivo');
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 20000);
  try {
    const res = await fetch(attachment.url, {
      headers: { 'User-Agent': '00Y4nBot/1.0 (emoji-copy)' },
      signal: ac.signal
    });
    clearTimeout(to);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 24) throw new Error('archivo vacío');
    if (buf.length > 256 * 1024) {
      throw new Error(
        `archivo ${Math.round(buf.length / 1024)}KB supera el límite de 256KB de Discord`
      );
    }
    return buf;
  } catch (e) {
    clearTimeout(to);
    throw e.name === 'AbortError' ? new Error('timeout descarga') : e;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default {
  data: new SlashCommandBuilder()
    .setName('copy')
    .setDescription(
      'Copia emojis de otros servers (o por URL/archivo) a este servidor sin perder calidad.'
    )
    .addStringOption((o) =>
      o
        .setName('emojis')
        .setDescription(
          'Uno o varios emojis: <:nombre:id> <a:anim:id> o URLs del CDN'
        )
        .setRequired(false)
    )
    .addAttachmentOption((o) =>
      o
        .setName('archivo')
        .setDescription('Imagen/GIF para subir como emoji (máx 256KB)')
        .setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName('nombre')
        .setDescription('Nombre forzado (solo si copiás 1 emoji o 1 archivo)')
        .setRequired(false)
        .setMinLength(2)
        .setMaxLength(32)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),

  async execute(interaction) {
    const puede =
      interaction.member.roles.cache.has(ROL_PERMITIDO) ||
      interaction.member.roles.cache.has(ROL_ALTO) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
      interaction.member.permissions.has(PermissionFlagsBits.ManageGuildExpressions);

    if (!puede) {
      return interaction.reply({
        content:
          'Necesitás permiso de **Gestionar expresiones** (o el rol autorizado).',
        flags: MessageFlags.Ephemeral
      });
    }

    const me = interaction.guild.members.me;
    if (
      me &&
      !me.permissions.has(PermissionFlagsBits.ManageGuildExpressions) &&
      !me.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)
    ) {
      return interaction.reply({
        content:
          'El bot no tiene permiso **Gestionar expresiones del servidor** (Manage Emojis).',
        flags: MessageFlags.Ephemeral
      });
    }

    const texto = interaction.options.getString('emojis') || '';
    const archivo = interaction.options.getAttachment('archivo');
    const nombreForzado = interaction.options.getString('nombre');

    const lista = extraerEmojis(texto);
    if (archivo) {
      const isGif =
        (archivo.contentType && archivo.contentType.includes('gif')) ||
        /\.gif$/i.test(archivo.name || '') ||
        /\.gif$/i.test(archivo.url || '');
      lista.push({
        id: null,
        name: sanitizarNombre(
          (archivo.name || 'upload').replace(/\.[^.]+$/, ''),
          'upload'
        ),
        animated: !!isGif,
        source: 'attachment',
        attachment: archivo
      });
    }

    if (!lista.length) {
      return interaction.reply({
        content:
          'Pasá al menos un emoji (`<:nombre:id>` / `<a:nombre:id>`), una URL del CDN, o un **archivo**.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (nombreForzado && lista.length > 1) {
      return interaction.reply({
        content:
          'La opción **nombre** solo se puede usar cuando copiás **un** emoji o un archivo.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await interaction.guild.emojis.fetch().catch(() => null);

    const existentes = new Set(
      [...interaction.guild.emojis.cache.values()].map((e) =>
        e.name.toLowerCase()
      )
    );

    // Límites oficiales según boost del server (estáticos y animados por separado)
    const maxStatic = interaction.guild.maximumEmojis ?? 50;
    const maxAnim = interaction.guild.maximumAnimatedEmojis ?? 50;
    let staticCount = interaction.guild.emojis.cache.filter((e) => !e.animated).size;
    let animCount = interaction.guild.emojis.cache.filter((e) => e.animated).size;
    const tier = interaction.guild.premiumTier ?? 0;

    const creados = [];
    const errores = [];
    let ok = 0;
    let fail = 0;
    let okStatic = 0;
    let okAnim = 0;

    await interaction
      .editReply({
        content:
          `Slots: **${staticCount}/${maxStatic}** estáticos · **${animCount}/${maxAnim}** animados (boost lvl ${tier})\n` +
          `Copiando 1/${lista.length}...`
      })
      .catch(() => null);

    for (let i = 0; i < lista.length; i++) {
      const item = lista[i];
      const label = item.name || item.id || 'emoji';

      await interaction
        .editReply({
          content:
            `Slots: **${staticCount}/${maxStatic}** estáticos · **${animCount}/${maxAnim}** animados\n` +
            `Copiando **${label}** (${i + 1}/${lista.length})...`
        })
        .catch(() => null);

      try {
        // Chequeo local (rápido). Discord también valida al crear.
        if (item.animated) {
          if (animCount >= maxAnim) {
            throw new Error(
              `sin slots animados (${animCount}/${maxAnim}). Borrá GIFs o subí el boost del server.`
            );
          }
        } else if (staticCount >= maxStatic) {
          throw new Error(
            `sin slots estáticos (${staticCount}/${maxStatic}). Borrá emojis estáticos o subí el boost.`
          );
        }

        let buffer;
        if (item.source === 'attachment') {
          buffer = await descargarAttachment(item.attachment);
        } else {
          buffer = await descargarOriginal(item);
        }

        const baseName = nombreForzado
          ? sanitizarNombre(nombreForzado, item.name)
          : sanitizarNombre(item.name, `e_${(item.id || 'x').slice(-6)}`);
        const finalName = nombreUnico(baseName, existentes);

        const creado = await interaction.guild.emojis.create({
          attachment: buffer,
          name: finalName,
          reason: `Copy por ${interaction.user.tag}`
        });

        existentes.add(creado.name.toLowerCase());
        interaction.guild.emojis.cache.set(creado.id, creado);

        if (creado.animated) {
          animCount++;
          okAnim++;
        } else {
          staticCount++;
          okStatic++;
        }

        const nota = creado.animated ? ' (GIF)' : '';
        creados.push(
          `${item.name || 'src'} → ${creado} \`:${creado.name}:\`${nota}`
        );
        ok++;
      } catch (e) {
        fail++;
        let msg = String(e.message || e);
        // Traducir errores típicos de la API de Discord
        const code = e.code || e.rawError?.code;
        if (code === 30008 || /Maximum number of emojis/i.test(msg)) {
          msg = item.animated
            ? `sin slots animados (${animCount}/${maxAnim})`
            : `sin slots estáticos (${staticCount}/${maxStatic})`;
        } else if (code === 50035 || /Invalid Form Body/i.test(msg)) {
          msg = 'archivo inválido o nombre no permitido';
        } else if (code === 50013 || /Missing Permissions/i.test(msg)) {
          msg = 'el bot no tiene permiso Manage Emojis';
        } else if (code === 429 || /rate limit/i.test(msg)) {
          msg = 'rate limit de Discord — reintentá en unos segundos';
        }
        errores.push(`${label}: ${msg.slice(0, 140)}`);
      }

      if (i < lista.length - 1) await sleep(900);
    }

    const libresStatic = Math.max(0, maxStatic - staticCount);
    const libresAnim = Math.max(0, maxAnim - animCount);

    const embed = new EmbedBuilder()
      .setTitle('Copy de emojis')
      .setColor(ok > 0 ? '#74d4fc' : '#e74c3c')
      .setDescription(
        [
          `> **Exitosos:** ${ok} (${okStatic} estáticos, ${okAnim} GIF)`,
          `> **Fallidos:** ${fail}`,
          `> **Slots ahora:** ${staticCount}/${maxStatic} estáticos · ${animCount}/${maxAnim} animados`,
          `> **Libres:** ${libresStatic} estáticos · ${libresAnim} animados · boost lvl ${tier}`,
          creados.length
            ? `\n**Creados:**\n${creados.slice(0, 25).join('\n')}${
                creados.length > 25 ? '\n…' : ''
              }`
            : '',
          errores.length
            ? `\n**Errores:**\n\`\`\`\n${errores.slice(0, 15).join('\n')}${
                errores.length > 15 ? '\n…' : ''
              }\n\`\`\``
            : '',
          fail && !ok && libresStatic === 0 && libresAnim === 0
            ? '\n-# El server está **lleno**. Borrá emojis viejos (nara_/coral_ de prueba) o boosteá el server para más slots.'
            : ''
        ]
          .filter(Boolean)
          .join('\n')
      )
      .setFooter({
        text: 'Descarga original del CDN · sin recomprimir · animados en GIF'
      });

    await interaction.editReply({ content: null, embeds: [embed] });
  }
};
