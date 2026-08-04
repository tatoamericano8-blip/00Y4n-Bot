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
    .setDefaultMemberPermissions(null)
    .addRoleOption(opt =>
      opt.setName('rol').setDescription('Rol a asignar a todos los miembros.').setRequired(true)
    ),

  async execute(interaction) {
    const ROL_GERENTE_STAFF = '1452684893850177587';
    if (!interaction.member.roles.cache.has(ROL_GERENTE_STAFF)) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> **Acceso denegado.** Solo **Gerente de Staff** puede usar este comando.',
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
      .setTitle('Confirmar Role All')
      .setDescription(
        `¿Asignar el rol ${rol} a **todos** los miembros humanos del servidor?\n\n` +
          `> Esto puede tardar si hay muchos miembros.\n` +
          `> Los bots serán excluidos.`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('roleall_confirm')
        .setLabel('Confirmar')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('roleall_cancel')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );

    // Guardar rol en customId no es ideal; usar collector con rol id
    const msg = await interaction.reply({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`roleall_confirm:${rol.id}`)
            .setLabel('Confirmar')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('roleall_cancel')
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Secondary)
        )
      ],
      flags: MessageFlags.Ephemeral,
      fetchReply: true
    });
  }
};
