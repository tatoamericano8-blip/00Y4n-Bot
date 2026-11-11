import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { getPreset, listPresetChoices } from '../../config/embedPresets/index.js';
import { E } from '../../config/emojis.js';

const ROL_EQUIPO_PROPIETARIOS = '1528877296977711256';

function puedeUsarEmbedSend(member) {
  if (!member) return false;
  // 00Y4n: Equipo de Propietarios
  if (member.roles?.cache?.has(ROL_EQUIPO_PROPIETARIOS)) return true;
  // Otros servidores (ej. Servicios Públicos): Administrador
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  return false;
}


/** Discord: máx ~6000 caracteres sumando todos los embeds del mensaje. */
function estimateEmbedChars(embed) {
  try {
    const j = typeof embed?.toJSON === 'function' ? embed.toJSON() : embed || {};
    let n = 0;
    if (j.title) n += String(j.title).length;
    if (j.description) n += String(j.description).length;
    if (j.footer?.text) n += String(j.footer.text).length;
    if (j.author?.name) n += String(j.author.name).length;
    if (Array.isArray(j.fields)) {
      for (const f of j.fields) {
        if (f?.name) n += String(f.name).length;
        if (f?.value) n += String(f.value).length;
      }
    }
    return n;
  } catch {
    return 500;
  }
}

function chunkEmbedsBySize(embeds, maxChars = 5500) {
  const chunks = [];
  let current = [];
  let size = 0;
  for (const emb of embeds) {
    const s = estimateEmbedChars(emb);
    if (current.length && size + s > maxChars) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    // un solo embed enorme: mandarlo igual solo
    if (s > maxChars && !current.length) {
      chunks.push([emb]);
      continue;
    }
    current.push(emb);
    size += s;
  }
  if (current.length) chunks.push(current);
  return chunks.length ? chunks : [embeds];
}

export default {
  data: new SlashCommandBuilder()
    .setName('embed-send')
    .setDescription('Publica un embed informativo predefinido en este canal.')
    .addStringOption((opt) =>
      opt
        .setName('preset')
        .setDescription('Qué embed publicar')
        .setRequired(true)
        .addChoices(...listPresetChoices())
    ),

  async execute(interaction) {
    if (!puedeUsarEmbedSend(interaction.member)) {
      return interaction.reply({
        content:
          E.cruz +
          ' No tenés permiso para usar `/embed-send`.\n' +
          '• En **00Y4n**: rol Equipo de Propietarios\n' +
          '• En otros servidores: permiso de **Administrador**',
        flags: MessageFlags.Ephemeral
      });
    }

    const id = interaction.options.getString('preset');
    const preset = getPreset(id);
    if (!preset) {
      return interaction.reply({
        content: E.cruz + ' Preset no encontrado.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let payload;
    try {
      payload = await preset.build({ interaction });
    } catch (e) {
      console.error('[embed-send] build error:', e);
      return interaction.editReply({
        content: E.cruz + ` Error al armar el preset \`${id}\`: ${e?.message || e}`
      });
    }

    const embeds = payload?.embeds || [];
    const components = payload?.components || [];
    const content = payload?.content || undefined;

    if (!embeds.length) {
      return interaction.editReply({
        content: E.cruz + ' El preset no devolvió embeds.'
      });
    }

    // Discord: máx 10 embeds y ~6000 chars totales por mensaje
    const channel = interaction.channel;
    try {
      const sizeChunks = chunkEmbedsBySize(embeds, 4800);
      const flat = [];
      for (const sc of sizeChunks) {
        for (let i = 0; i < sc.length; i += 10) {
          flat.push(sc.slice(i, i + 10));
        }
      }
      for (let i = 0; i < flat.length; i++) {
        const chunk = flat[i];
        const isLast = i === flat.length - 1;
        await channel.send({
          content: i === 0 ? content : undefined,
          embeds: chunk,
          components: isLast ? components : []
        });
      }
    } catch (e) {
      console.error('[embed-send] send error:', e);
      return interaction.editReply({
        content: E.cruz + ` No pude publicar en el canal: ${e?.message || e}`
      });
    }

    return interaction.editReply({
      content: E.tilde + ` Publicado: **${preset.label}** (\`${preset.id}\`).`
    });
  }
};
