import { MessageFlags, EmbedBuilder } from 'discord.js';
import { getPreset } from '../../config/embedPresets/index.js';
import { E } from '../../config/emojis.js';
import { PRIMARIO } from '../../utils/colores.js';

async function buildBoostVentajas() {
  const star = E.mitadestrella || E.corona;
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.mitadestrella || E.corona} __**Beneficios de Boostear**__`)
        .setDescription(
          `> __**Southwest Florida 00Y4n, Beneficios de boostear el servidor**__ ${E.aflotacoras || E.dot}\n\n` +
            `${E.dot} *Southwest Florida 00Y4n* ofrece a nuestros miembros VIP del servidor una variedad de **increíbles ventajas**, que son las siguientes **(pero no se limitan a):**\n\n` +
            `${star}: *Exención de vehículos baneados*\n` +
            `${star}: *Acceso anticipado (FastPass)*\n` +
            `${star}: *Extra pagos económicos*\n` +
            `${star}: *Permiso de Imagen*\n` +
            `${star}: *Permiso de emojis y stickers externos*\n\n` +
            `-# *¡Chequeá <#1496991456102055956> para más info!*`
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
          `${E.dot} Debés hacer clic [aquí](https://www.roblox.com/es/communities/292739785/Clan-00Y4n#!/about) para acceder a la comunidad de Roblox de **Southwest Florida 00Y4n.**`
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
