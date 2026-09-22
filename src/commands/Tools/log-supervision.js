import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits
} from 'discord.js';
import Sesion from '../../../models/Session.js';
import { registrarNotaSupervision } from '../../utils/gestorSupervisionScore.js';
import { E } from '../../config/emojis.js';

const ROL_STAFF = '1512120103771050005';
const VENTANA_MS = 2 * 60 * 60 * 1000; // 2 horas

export default {
  data: new SlashCommandBuilder()
    .setName('log-supervision')
    .setDescription(
      'Registra la evaluación de supervisión de tu sesión supervisada más reciente (máx. 2 h).'
    )
    .addIntegerOption((o) =>
      o
        .setName('host_rating')
        .setDescription('Calificación del host (1-5)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(5)
    )
    .addStringOption((o) =>
      o
        .setName('notas')
        .setDescription('Notas de supervisión (mín. 20 caracteres)')
        .setRequired(true)
        .setMinLength(20)
        .setMaxLength(500)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ROL_STAFF)) {
      return interaction.reply({
        content: E.cruz + ' Solo el **Staff** puede usar este comando.',
        flags: MessageFlags.Ephemeral
      });
    }

    const rating = interaction.options.getInteger('host_rating');
    const notas = interaction.options.getString('notas');
    const guildId = interaction.guildId;
    const supervisorId = interaction.user.id;
    const ahora = Date.now();

    // Sesión donde este usuario fue supervisor, cerrada hace ≤ 2 h
    const sesion = await Sesion.findOne({
      guildId,
      supervisorId,
      estado: 'cerrada',
      fechaCierre: { $gte: new Date(ahora - VENTANA_MS) }
    })
      .sort({ fechaCierre: -1 })
      .lean();

    if (!sesion) {
      return interaction.reply({
        content:
          E.cruz +
          ' No encontré una sesión **supervisada por vos** y **cerrada en las últimas 2 horas**.\n' +
          'Solo podés registrar la evaluación de tu supervisión más reciente dentro de esa ventana.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (!sesion.hostId) {
      return interaction.reply({
        content: E.cruz + ' La sesión no tiene host registrado.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (String(sesion.hostId) === String(supervisorId)) {
      return interaction.reply({
        content: E.cruz + ' No podés calificar tu propia sesión como host.',
        flags: MessageFlags.Ephemeral
      });
    }

    await registrarNotaSupervision(guildId, sesion.hostId, {
      nota: rating,
      deUserId: supervisorId,
      notas,
      sesionId: sesion.idInicio
    });

    const embed = new EmbedBuilder()
      .setColor('#8ae6fa')
      .setTitle(E.carpeta + ' Supervisión registrada')
      .setDescription(
        `• **Host:** <@${sesion.hostId}>\n` +
          `• **Supervisor:** <@${supervisorId}>\n` +
          `• **Rating:** **${rating} / 5**\n` +
          `• **Sesión:** \`${sesion.idInicio}\`\n` +
          `• **Notas:** ${notas}`
      )
      .setFooter({ text: 'SWFL • Log de supervisión' })
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });
  }
};
