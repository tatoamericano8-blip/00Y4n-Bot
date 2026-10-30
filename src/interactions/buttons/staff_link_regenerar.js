import { EmbedBuilder, MessageFlags } from 'discord.js';
import { E } from '../../config/emojis.js';
import { crearEmbedEnlaceSesion } from '../../utils/embedEnlaceSesion.js';

const ROL_STAFF = '1512120103771050005';

export default {
  name: 'staff_link_regenerar',

  async execute(interaction) {
    let member = interaction.member;
    try {
      if (interaction.guild) {
        member = await interaction.guild.members.fetch(interaction.user.id);
      }
    } catch (_) {}

    const esStaff = member?.roles?.cache?.has(ROL_STAFF) === true;

    if (!esStaff) {
      return interaction.reply({
        content:
          `${E.cruz || '❌'} **No tenés el rol ni el permiso autorizado.** Solo el **Staff** puede usar el botón Staff Link.`,
        flags: MessageFlags.Ephemeral
      });
    }

    global.coleccionStaffLinks = global.coleccionStaffLinks || new Map();
    global.coleccionSesiones = global.coleccionSesiones || new Map();
    global.coleccionReinvites = global.coleccionReinvites || new Map();

    const msgId = interaction.message?.id;
    let link =
      (msgId && global.coleccionStaffLinks.get(msgId)) ||
      (msgId && global.coleccionReinvites.get(msgId)) ||
      (msgId && global.coleccionSesiones.get(msgId)?.linkSesion) ||
      null;

    if (!link) {
      for (const data of global.coleccionSesiones.values()) {
        if (data?.guildId === interaction.guildId && data?.linkSesion) {
          link = data.linkSesion;
        }
      }
    }

    if (!link) {
      return interaction.reply({
        content:
          `${E.cruz || '❌'} No hay link cargado en este aviso. Volvé a usar `/regenerar_swfl` con la opción **link**.`,
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = crearEmbedEnlaceSesion({ link, tipo: 'staff' });
    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
