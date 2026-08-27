import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import {
  obtenerSesionEnCurso,
  barUsuarioSesion,
  unbarUsuarioSesion,
  estaBarredEnSesion
} from '../../utils/gestorSessionBarGate.js';

const ROLE_ALTO_COMANDO = '1528870731629465752';

export default {
  data: new SlashCommandBuilder()
    .setName('session')
    .setDescription('Bar/unbar de un usuario del link y FastPass de la sesión en curso.')
    .addSubcommand(sub =>
      sub
        .setName('bar')
        .setDescription('Bloquear a un usuario del link y FastPass de esta sesión.')
        .addUserOption(o =>
          o.setName('usuario').setDescription('Usuario a bloquear del link.').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('motivo').setDescription('Motivo (opcional).').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('unbar')
        .setDescription('Quitar el bloqueo de link/FastPass de un usuario en esta sesión.')
        .addUserOption(o =>
          o.setName('usuario').setDescription('Usuario a desbloquear.').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ROLE_ALTO_COMANDO)) {
      return interaction.reply({
        content: 'Solo **Alto Comando** puede usar `/session bar` y `/session unbar`.',
        flags: MessageFlags.Ephemeral
      });
    }

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('usuario');
    const sesion = await obtenerSesionEnCurso(interaction.guildId);

    if (!sesion) {
      return interaction.reply({
        content: 'No hay una sesión en curso (esperando reacciones o activa) en este servidor.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'bar') {
      const motivo = interaction.options.getString('motivo') || 'Sin motivo';
      if (estaBarredEnSesion(sesion, target.id)) {
        return interaction.reply({
          content: `<@${target.id}> ya está bloqueado del link/FastPass de esta sesión.`,
          flags: MessageFlags.Ephemeral
        });
      }
      await barUsuarioSesion(sesion.idInicio, target.id, {
        por: interaction.user.id,
        motivo
      });
      return interaction.reply({
        content:
          `**Session bar aplicado.**\n` +
          `Usuario: <@${target.id}>\n` +
          `Sesión: \`${sesion.idInicio}\` (${sesion.tipo || '-'})\n` +
          `Motivo: ${motivo}\n` +
          `Efecto: no puede obtener el **Link de la Sesion** ni el **FastPass** hasta que termine esta sesión (o se use \`/session unbar\`).`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'unbar') {
      if (!estaBarredEnSesion(sesion, target.id)) {
        return interaction.reply({
          content: `<@${target.id}> no está bloqueado en esta sesión.`,
          flags: MessageFlags.Ephemeral
        });
      }
      await unbarUsuarioSesion(sesion.idInicio, target.id);
      return interaction.reply({
        content:
          `**Session unbar aplicado.**\n` +
          `Usuario: <@${target.id}>\n` +
          `Ya puede volver a usar el link y FastPass de esta sesión (si cumple el resto de requisitos).`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
