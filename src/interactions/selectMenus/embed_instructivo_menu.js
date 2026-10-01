import { MessageFlags, EmbedBuilder } from 'discord.js';
import { getPreset } from '../../config/embedPresets/index.js';
import { E } from '../../config/emojis.js';
import { PRIMARIO } from '../../utils/colores.js';

async function buildBoostVentajas() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.corona} Ventajas de Boostear`)
        .setDescription(
          `**Contenido pendiente.**\n\n` +
            `// TODO: pegar aquí las ventajas de Server Booster (roles, perks, etc.).\n` +
            `Por ahora abrí un ticket en **#asistencia** si tenés dudas sobre boost.`
        )
        .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' })
    ]
  };
}

async function buildRobloxComunidad() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.roblox} Roblox Comunidad`)
        .setDescription(
          `**Contenido pendiente.**\n\n` +
            `// TODO: pegar link del grupo Roblox 00Y4n y requisitos de unión.\n` +
            `Buscá el grupo **Southwest Florida 00Y4n** en Roblox o pedí el link en **#asistencia**.`
        )
        .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' })
    ]
  };
}

export default {
  name: 'embed_instructivo_menu',

  async execute(interaction) {
    const value = interaction.values?.[0];
    if (!value) {
      return interaction.reply({
        content: E.cruz + ' Opción inválida.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let payload;
    try {
      if (value === 'boost_ventajas') {
        payload = await buildBoostVentajas();
      } else if (value === 'roblox_comunidad') {
        payload = await buildRobloxComunidad();
      } else {
        const preset = getPreset(value);
        if (!preset) {
          return interaction.editReply({
            content: E.cruz + ` Sección \`${value}\` no configurada aún.`
          });
        }
        payload = await preset.build({ interaction });
      }
    } catch (e) {
      console.error('[embed_instructivo_menu]', e);
      return interaction.editReply({
        content: E.cruz + ` Error: ${e?.message || e}`
      });
    }

    const embeds = payload?.embeds || [];
    return interaction.editReply({
      embeds: embeds.slice(0, 10),
      components: []
    });
  }
};
