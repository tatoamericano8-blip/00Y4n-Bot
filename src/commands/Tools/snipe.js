import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { obtenerSnipe, limpiarSnipe } from '../../utils/gestorSnipe.js';

const ROLE_STAFF = '1512120103771050005';
const ROLE_HIGH_COMMAND = '1528870731629465752';

export default {
  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Muestra el último mensaje borrado de este canal.'),

  async execute(interaction) {
    const esStaff =
      interaction.member.roles.cache.has(ROLE_STAFF) ||
      interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) ||
      interaction.member.permissions.has('ModerateMembers');

    if (!esStaff) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> Solo el **Staff** puede usar /snipe.',
        flags: MessageFlags.Ephemeral
      });
    }

    const data = obtenerSnipe(interaction.channelId);
    if (!data) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> No hay ningún mensaje borrado reciente en este canal.',
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#74d4fc')
      .setAuthor({
        name: data.authorTag || 'Usuario desconocido',
        iconURL: data.authorAvatar || undefined
      })
      .setDescription(data.content || '*Sin texto*')
      .addFields({
        name: 'Canal',
        value: `<#${interaction.channelId}>`,
        inline: true
      })
      .setFooter({ text: 'Mensaje borrado' })
      .setTimestamp(data.createdAt ? new Date(data.createdAt) : new Date(data.guardadoEn));

    // Un solo uso visual opcional: no limpiamos para permitir re-snipe corto
    return interaction.reply({ embeds: [embed] });
  }
};
