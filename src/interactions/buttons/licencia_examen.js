import { handleLicenciaExamenButton } from '../../commands/Tools/licencia.js';

export default [
  {
    name: 'lic_ex',
    async execute(interaction) {
      return handleLicenciaExamenButton(interaction);
    }
  },
  {
    name: 'lic_rec',
    async execute(interaction) {
      return handleLicenciaExamenButton(interaction);
    }
  }
];
