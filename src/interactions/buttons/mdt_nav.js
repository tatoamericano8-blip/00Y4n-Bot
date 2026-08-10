import { handleMdtButton } from '../../commands/Tools/mdt.js';

/**
 * Prefijo: mdt_resumen_<userId> | mdt_multas_<userId> | mdt_arrestos_<userId> | mdt_vehiculos_<userId>
 * interactionCreate resuelve por parts[0] === 'mdt'
 */
export default {
  name: 'mdt',
  async execute(interaction) {
    return handleMdtButton(interaction);
  },
  run: (_client, interaction) => handleMdtButton(interaction)
};
