import { EmbedBuilder, MessageFlags } from 'discord.js';

const ROL_STAFF = '1512120103771050005';

export default {
  name: 'staff_link_regenerar',

  async execute(interaction) {
    const esStaff =
      interaction.member?.roles?.cache?.has(ROL_STAFF) ||
      interaction.memberPermissions?.has('ManageMessages');

    if (!esStaff) {
      return interaction.reply({
        content: '🔒 Solo el **Staff** puede ver este link.',
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
          '❌ No hay link cargado en este aviso. Volvé a usar `/regenerar_swfl` con la opción **link**.',
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🔒 Staff Link')
      .setDescription(
        `Link privado del servidor regenerado:\n\n🔗 ${link}\n\n` +
          `_Solo visible para staff. No lo compartas en canales públicos._`
      )
      .setColor('#74d4fc')
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
