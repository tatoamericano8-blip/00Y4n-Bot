import {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  MessageFlags
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../../config/emojis.js';
import { quitarFondoSolido, quitarFondoRemoveBg, redondearEsquinas } from '../../utils/quitarFondo.js';

const MAX_BYTES = 8 * 1024 * 1024;
const COOLDOWN_MS = 25_000;
const lastUse = new Map();

const builder = new SlashCommandBuilder()
  .setName('quitar-fondo')
  .setDescription('Quita el fondo y redondea esquinas. Hasta 10 imágenes por uso.')
  .addAttachmentOption((o) =>
    o.setName('imagen').setDescription('Imagen 1 (obligatoria)').setRequired(true)
  );

for (let i = 2; i <= 10; i++) {
  builder.addAttachmentOption((o) =>
    o.setName(`imagen${i}`).setDescription(`Imagen ${i} (opcional)`).setRequired(false)
  );
}

builder
  .addStringOption((o) =>
    o
      .setName('fondo')
      .setDescription('Color de fondo a eliminar')
      .setRequired(false)
      .addChoices(
        { name: 'Auto (detecta por bordes)', value: 'auto' },
        { name: 'Blanco', value: 'blanco' },
        { name: 'Negro', value: 'negro' },
        { name: 'IA remove.bg (si hay API key)', value: 'ia' }
      )
  )
  .addIntegerOption((o) =>
    o
      .setName('tolerancia')
      .setDescription('Sensibilidad 5–100 (default 18). Más alto = borra más del borde.')
      .setRequired(false)
      .setMinValue(5)
      .setMaxValue(100)
  )
  .addBooleanOption((o) =>
    o
      .setName('redondear')
      .setDescription('Redondear esquinas (default: sí, semicírculo)')
      .setRequired(false)
  )
  .addIntegerOption((o) =>
    o
      .setName('radio')
      .setDescription('Radio del redondeo en px (default: semicírculo)')
      .setRequired(false)
      .setMinValue(0)
      .setMaxValue(2000)
  );

async function procesarUna(att, { modo, tolerancia, redondear, radio }) {
  if (!att.contentType?.startsWith('image/')) {
    return { ok: false, name: att.name || 'archivo', error: 'no es imagen' };
  }
  if (att.size > MAX_BYTES) {
    return { ok: false, name: att.name || 'archivo', error: 'supera 8 MB' };
  }

  const resImg = await fetch(att.url);
  if (!resImg.ok) {
    return { ok: false, name: att.name || 'archivo', error: `descarga ${resImg.status}` };
  }
  const input = Buffer.from(await resImg.arrayBuffer());

  let out;
  if (modo === 'ia') {
    const key = process.env.REMOVE_BG_API_KEY || '';
    if (!key) {
      return {
        ok: false,
        name: att.name || 'archivo',
        error: 'IA sin REMOVE_BG_API_KEY'
      };
    }
    out = await quitarFondoRemoveBg(input, key);
    if (redondear) out = await redondearEsquinas(out, radio);
  } else {
    out = await quitarFondoSolido(input, { modo, tolerancia, redondear, radio });
  }

  const base = (att.name || 'imagen').replace(/\.[^.]+$/, '') || 'imagen';
  return {
    ok: true,
    name: att.name || 'archivo',
    file: new AttachmentBuilder(out, { name: `${base}-sin-fondo.png` })
  };
}

export default {
  data: builder,

  async execute(interaction) {
    const modo = interaction.options.getString('fondo') || 'auto';
    const tolerancia = interaction.options.getInteger('tolerancia') || 18;
    const redondearOpt = interaction.options.getBoolean('redondear');
    const redondear = redondearOpt === null ? true : redondearOpt;
    const radio = interaction.options.getInteger('radio');

    const attachments = [];
    const first = interaction.options.getAttachment('imagen', true);
    if (first) attachments.push(first);
    for (let i = 2; i <= 10; i++) {
      const a = interaction.options.getAttachment(`imagen${i}`);
      if (a) attachments.push(a);
    }

    const uid = interaction.user.id;
    const now = Date.now();
    const prev = lastUse.get(uid) || 0;
    if (now - prev < COOLDOWN_MS) {
      const s = Math.ceil((COOLDOWN_MS - (now - prev)) / 1000);
      return interaction.reply({
        content: `${E.lock || '🔒'} Esperá **${s}s** para usar de nuevo el comando.`,
        flags: MessageFlags.Ephemeral
      });
    }
    lastUse.set(uid, now);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const opts = { modo, tolerancia, redondear, radio };
    const files = [];
    const errores = [];
    let okCount = 0;

    for (let i = 0; i < attachments.length; i++) {
      try {
        const res = await procesarUna(attachments[i], opts);
        if (res.ok) {
          files.push(res.file);
          okCount++;
        } else {
          errores.push(`**${i + 1}.** \`${res.name}\` — ${res.error}`);
        }
      } catch (e) {
        console.error('[quitar-fondo]', e);
        errores.push(
          `**${i + 1}.** \`${attachments[i].name || 'archivo'}\` — ${e?.message || e}`
        );
      }
    }

    if (files.length === 0) {
      return interaction.editReply({
        content:
          `${E.cruz || '❌'} No pude procesar ninguna imagen.\n` +
          (errores.length ? errores.join('\n') : '')
      });
    }

    const metodo =
      modo === 'ia'
        ? 'IA (remove.bg)' + (redondear ? ' + redondeo' : '')
        : `borde · ${modo} · tol ${tolerancia}` + (redondear ? ' · redondeado' : '');

    const embed = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.tilde || '✅'} Fondo procesado`)
      .setDescription(
        `${E.dot || '•'} Listas: **${okCount}/${attachments.length}**\n` +
          `${E.dot || '•'} Método: **${metodo}**\n` +
          `${E.dot || '•'} Redondeo: **${redondear ? (radio != null ? `${radio}px` : 'semicírculo (auto)') : 'no'}**\n` +
          (errores.length ? `\n${E.cruz || '❌'} Errores:\n${errores.join('\n')}\n` : '') +
          `-# Solo lienzo casi blanco/negro desde el borde. PNG transparente.`
      );

    // Discord: máx 10 archivos por mensaje
    return interaction.editReply({
      embeds: [embed],
      files: files.slice(0, 10)
    });
  }
};
