import {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  MessageFlags
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../../config/emojis.js';
import { quitarFondoSolido, quitarFondoRemoveBg } from '../../utils/quitarFondo.js';

const MAX_BYTES = 8 * 1024 * 1024;
const COOLDOWN_MS = 20_000;
const lastUse = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('quitar-fondo')
    .setDescription('Quita el fondo de una imagen (blanco, negro o auto). Devuelve PNG transparente.')
    .addAttachmentOption((o) =>
      o.setName('imagen').setDescription('Imagen a procesar').setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName('fondo')
        .setDescription('Color de fondo a eliminar')
        .setRequired(false)
        .addChoices(
          { name: 'Auto (detecta por esquinas)', value: 'auto' },
          { name: 'Blanco', value: 'blanco' },
          { name: 'Negro', value: 'negro' },
          { name: 'IA remove.bg (si hay API key)', value: 'ia' }
        )
    )
    .addIntegerOption((o) =>
      o
        .setName('tolerancia')
        .setDescription('Sensibilidad 5–100 (default 36). Más alto = borra más.')
        .setRequired(false)
        .setMinValue(5)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    const att = interaction.options.getAttachment('imagen', true);
    const modo = interaction.options.getString('fondo') || 'auto';
    const tolerancia = interaction.options.getInteger('tolerancia') || 36;

    if (!att.contentType?.startsWith('image/')) {
      return interaction.reply({
        content: `${E.cruz || '❌'} El archivo tiene que ser una **imagen**.`,
        flags: MessageFlags.Ephemeral
      });
    }
    if (att.size > MAX_BYTES) {
      return interaction.reply({
        content: `${E.cruz || '❌'} Máximo **8 MB**.`,
        flags: MessageFlags.Ephemeral
      });
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

    try {
      const resImg = await fetch(att.url);
      if (!resImg.ok) throw new Error(`No pude descargar la imagen (${resImg.status})`);
      const input = Buffer.from(await resImg.arrayBuffer());

      let out;
      let metodo = modo;

      if (modo === 'ia') {
        const key = process.env.REMOVE_BG_API_KEY || '';
        if (!key) {
          return interaction.editReply({
            content:
              `${E.cruz || '❌'} El modo **IA** necesita la variable \`REMOVE_BG_API_KEY\` en el host.\n` +
              `Usá **auto**, **blanco** o **negro** (funcionan sin API).`
          });
        }
        out = await quitarFondoRemoveBg(input, key);
        metodo = 'IA (remove.bg)';
      } else {
        out = await quitarFondoSolido(input, { modo, tolerancia });
        metodo = `sólido · ${modo} · tol ${tolerancia}`;
      }

      const file = new AttachmentBuilder(out, { name: 'sin-fondo.png' });
      const embed = new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.tilde || '✅'} Fondo quitado`)
        .setDescription(
          `${E.dot || '•'} Método: **${metodo}**\n` +
            `${E.dot || '•'} Formato: **PNG transparente**\n` +
            `-# Si quedan bordes, probá otra vez con más tolerancia o modo blanco/negro.`
        )
        .setImage('attachment://sin-fondo.png');

      return interaction.editReply({ embeds: [embed], files: [file] });
    } catch (e) {
      console.error('[quitar-fondo]', e);
      return interaction.editReply({
        content: `${E.cruz || '❌'} No pude procesar la imagen: ${e?.message || e}`
      });
    }
  }
};
