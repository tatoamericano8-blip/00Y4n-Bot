import { handleLicenciaExamenButton } from '../../commands/Tools/licencia.js';

export default {
  name: 'lic_ex',
  /** Prefijo: lic_ex:... */
  async execute(interaction) {
    return handleLicenciaExamenButton(interaction);
  }
};
