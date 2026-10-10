import { MessageFlags } from 'discord.js';
import {
  crearModalPaso2,
  getSolicitudPending,
  DEPARTAMENTOS
} from '../../commands/Tools/solicitud-departamento.js';

/**
 * Botón tras parte 1.
 * customId: solicitud_depto_p2:DEPTO:USERID
 */
export default {
  name: 'solicitud_depto_p2',
  async execute(interaction, client, args = []) {
    const departamentoKey = args[0];
    const expectedUserId = args[1];

    if (expectedUserId && interaction.user.id !== expectedUserId) {
      return interaction.reply({
        content: '❌ Solo quien empezó la solicitud puede continuar.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (!departamentoKey || !DEPARTAMENTOS[departamentoKey]) {
      return interaction.reply({
        content: '❌ Departamento inválido. Usá `/solicitud-departamento` de nuevo.',
        flags: MessageFlags.Ephemeral
      });
    }

    const pending = getSolicitudPending(interaction.user.id);
    if (!pending || pending.departamentoKey !== departamentoKey) {
      return interaction.reply({
        content:
          '❌ La parte 1 expiró o no existe.\n' +
          'Volvé a usar `/solicitud-departamento` y completá las dos partes.',
        flags: MessageFlags.Ephemeral
      });
    }

    return interaction.showModal(crearModalPaso2(departamentoKey));
  }
};
