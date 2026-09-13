import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../../config/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('verificacion-bloxlink')
    .setDescription('Publica el panel de verificación con Bloxlink en este canal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: E.cruz + ' Solo staff con **Manage Server** puede publicar este panel.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(E.anubes + ' Southwest Florida 00Y4n — Verificación ' + E.anubes)
      .setDescription(
        [
          E.logo + ' Bienvenido a **Southwest Florida 00Y4n**.',
          '',
          E.dot + ' Para acceder al resto del servidor tenés que **vincular tu cuenta de Roblox** con Bloxlink y luego apretar el botón de abajo.',
          '',
          '**Pasos:**',
          E.uno + '. Abrí [blox.link](https://blox.link) e iniciá sesión con Discord.',
          E.dos + '. Entrá a **Verification**, seleccioná este servidor y vinculá tu Roblox (juego o código).',
          E.tres + '. Volvé acá y apretá **Verificar con Bloxlink**.',
          '',
          E.flechareplica + ' Si ya estás vinculado, el botón te da el rol **Ciudadano** al instante.'
        ].join('\n')
      )
      .setFooter({ text: '00Y4n · Verificación con Bloxlink' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('verificar_bloxlink_swfl')
        .setLabel('Verificar con Bloxlink')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel('Necesito ayuda')
        .setStyle(ButtonStyle.Link)
        .setURL('https://blox.link/support')
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: '✅ Panel de verificación publicado en este canal.',
      ephemeral: true
    });
  }
};
