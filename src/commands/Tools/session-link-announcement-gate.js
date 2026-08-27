import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import {
  obtenerSesionEnCurso,
  setRequiereReaccionLink,
  requiereReaccionEnSesion
} from '../../utils/gestorSessionBarGate.js';

const ROLE_ALTO_COMANDO = '1528870731629465752';

export default {
  data: new SlashCommandBuilder()
    .setName('session-link-announcement-gate')
    .setDescription('Activa o desactiva el requisito de reaccionar al inicio para obtener el link (sesión en curso).')
    .addBooleanOption(o =>
      o
        .setName('enabled')
        .setDescription('True = hace falta reaccionar. False = se puede usar el botón sin votar.')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ROLE_ALTO_COMANDO)) {
      return interaction.reply({
        content: 'Solo **Alto Comando** puede usar `/session-link-announcement-gate`.',
        flags: MessageFlags.Ephemeral
      });
    }

    const enabled = interaction.options.getBoolean('enabled');
    const sesion = await obtenerSesionEnCurso(interaction.guildId);

    if (!sesion) {
      return interaction.reply({
        content: 'No hay una sesión en curso. El gate se aplica solo a la sesión actual.',
        flags: MessageFlags.Ephemeral
      });
    }

    const actual = requiereReaccionEnSesion(sesion);
    if (actual === enabled) {
      return interaction.reply({
        content:
          `El requisito de reacción ya está **${enabled ? 'habilitado' : 'deshabilitado'}** en esta sesión.`,
        flags: MessageFlags.Ephemeral
      });
    }

    await setRequiereReaccionLink(sesion.idInicio, enabled);

    return interaction.reply({
      content:
        `**Gate de reacciones actualizado** (solo esta sesión).\n` +
        `Sesión: \`${sesion.idInicio}\` (${sesion.tipo || '-'})\n` +
        `Requisito de reaccionar al \`/inicio\`: **${enabled ? 'HABILITADO' : 'DESHABILITADO'}**.\n` +
        (enabled
          ? 'Los usuarios deben reaccionar al mensaje de inicio para obtener el link/FastPass.'
          : 'Los usuarios pueden usar el botón de link/FastPass aunque no hayan reaccionado.'),
      flags: MessageFlags.Ephemeral
    });
  }
};
