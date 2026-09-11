import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { E } from '../../config/emojis.js';

const ROLE_HIGH_COMMAND = '1528870731629465752';
const CANAL_HITOS = '1451954696259375205';

export default {
  data: new SlashCommandBuilder()
    .setName('hito-miembros')
    .setDescription('Publica un logro de hito de miembros del servidor.')
    .addIntegerOption(opt =>
      opt
        .setName('cantidad')
        .setDescription('Número de miembros alcanzados (ej: 500)')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(opt =>
      opt
        .setName('mensaje')
        .setDescription('Texto extra opcional (si no, se usa el mensaje por defecto).')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (
      !interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: E.cruz + ' Solo **Alto Comando** puede publicar hitos de miembros.',
        flags: MessageFlags.Ephemeral
      });
    }

    const cantidad = interaction.options.getInteger('cantidad');
    const extra = interaction.options.getString('mensaje');

    const canal =
      interaction.guild.channels.cache.get(CANAL_HITOS) ||
      (await interaction.guild.channels.fetch(CANAL_HITOS).catch(() => null));

    if (!canal?.isTextBased?.()) {
      return interaction.reply({
        content: E.cruz + ' No se encontró el canal de hitos configurado.',
        flags: MessageFlags.Ephemeral
      });
    }

    const texto =
      extra ||
      `¡Hemos alcanzado oficialmente **${cantidad.toLocaleString('es-AR')} miembros**! Gracias a todos por su apoyo incondicional ' + E.acoradibujo + '`;

    const embed = new EmbedBuilder()
      .setColor('#74d4fc')
      .setTitle(E.abow2 + ' __Hito Alcanzado__ ' + E.abow2)
      .setDescription(`${E.flecha} ${texto}`)
      .setFooter({
        text: '00Y4n Comunidad SWFL',
        iconURL: interaction.guild.iconURL()
      })
      .setTimestamp();

    await canal.send({ embeds: [embed] });

    return interaction.reply({
      content: `${E.tilde} Hito de **${cantidad.toLocaleString('es-AR')} miembros** publicado en <#${CANAL_HITOS}>.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
