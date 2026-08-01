import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('roleall')
    .setDescription('Asigna un rol a todos los miembros del servidor (excluye bots).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(opt =>
      opt.setName('rol').setDescription('Rol a asignar a todos los miembros.').setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> Solo **Administradores** pueden usar este comando.',
        flags: MessageFlags.Ephemeral
      });
    }

    const rol = interaction.options.getRole('rol');
    const botMember = await interaction.guild.members.fetchMe();

    if (rol.managed) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> No se puede asignar un rol gestionado por una integración.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (rol.position >= botMember.roles.highest.position) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> Ese rol está por encima (o al mismo nivel) del rol del bot.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (rol.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> No puedes asignar un rol igual o superior al tuyo.',
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#74d4fc')
      .setTitle('⚠️ Confirmar Role All')
      .setDescription(
        `Vas a asignar el rol ${rol} a **todos los miembros humanos** del servidor.\n\n` +
          `> Los **bots serán excluidos**.\n` +
          `> Esta acción puede tardar varios minutos.\n\n` +
          `¿Confirmás?`
      )
      .setFooter({ text: '00Y4n Comunidad SWFL' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`roleall_confirm:${rol.id}:${interaction.user.id}`)
        .setLabel('Confirmar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`roleall_cancel:${interaction.user.id}`)
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
};
