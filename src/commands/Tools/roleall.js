import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { E } from '../../config/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('roleall')
    .setDescription('Asigna un rol a todos los miembros del servidor (excluye bots).')
    .setDefaultMemberPermissions(null)
    .addRoleOption(opt =>
      opt.setName('rol').setDescription('Rol a asignar a todos los miembros.').setRequired(true)
    ),

  async execute(interaction) {
    const ROL_EQUIPO_PROPIETARIOS = '1528877296977711256';
    if (!interaction.member.roles.cache.has(ROL_EQUIPO_PROPIETARIOS)) {
      return interaction.reply({
        content: E.cruz + ' **Acceso denegado.** Solo el **Equipo de Propietarios** puede usar este comando.',
        flags: MessageFlags.Ephemeral
      });
    }

    const rol = interaction.options.getRole('rol');
    const botMember = await interaction.guild.members.fetchMe();

    if (rol.managed) {
      return interaction.reply({
        content: E.cruz + ' No se puede asignar un rol gestionado por una integración.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (rol.position >= botMember.roles.highest.position) {
      return interaction.reply({
        content: E.cruz + ' Ese rol está por encima (o al mismo nivel) del rol del bot.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (rol.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({
        content: E.cruz + ' No puedes asignar un rol igual o superior al tuyo.',
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
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`roleall_cancel:${interaction.user.id}`)
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
};
