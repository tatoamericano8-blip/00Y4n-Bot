import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { getPreset, listPresetChoices } from '../../config/embedPresets/index.js';
import { E } from '../../config/emojis.js';

const ROL_EQUIPO_PROPIETARIOS = '1528877296977711256';

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
    if (!interaction.member.roles.cache.has(ROL_EQUIPO_PROPIETARIOS)) {
      return interaction.reply({
        content: E.cruz + ' Solo el **Equipo de Propietarios** puede usar `/embed-send`.',
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

    const channel = interaction.channel;
    try {
      for (let i = 0; i < embeds.length; i += 10) {
        const chunk = embeds.slice(i, i + 10);
        const isLast = i + 10 >= embeds.length;
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
