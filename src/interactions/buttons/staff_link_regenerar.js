import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags
} from 'discord.js';

const ROL_STAFF = '1512120103771050005';

export default {
  name: 'staff_link_regenerar',

  async execute(interaction) {
    const esStaff =
      interaction.member?.roles?.cache?.has(ROL_STAFF) ||
      interaction.memberPermissions?.has('ManageMessages');

    if (!esStaff) {
      return interaction.reply({
        content: '🔒 Solo el **Staff** puede usar este botón.',
        flags: MessageFlags.Ephemeral
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('staff_link_regenerar_modal')
      .setTitle('Staff Link — Link privado');

    const inputLink = new TextInputBuilder()
      .setCustomId('link_privado')
      .setLabel('Link del servidor privado de Roblox')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://www.roblox.com/share?code=...')
      .setRequired(true)
      .setMaxLength(400);

    modal.addComponents(new ActionRowBuilder().addComponents(inputLink));
    await interaction.showModal(modal);
  }
};
