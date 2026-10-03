import { MessageFlags } from 'discord.js';
import { ES } from '../../config/emojisServicios.js';

/**
 * Menú del panel SP · Soporte / Tickets.
 * Respuesta efímera con guía del tipo elegido.
 * (No toca el flujo de tickets de 00Y4n principal.)
 */
const TEXTOS = {
  asistencia_general:
    `${ES.faq} **Asistencia general**\n\n` +
    `Usá este tipo de ticket para **preguntas** sobre Servicios Públicos 00Y4n ` +
    `(normas, departamentos, funcionamiento del server, etc.).\n\n` +
    `${ES.warn} **No** uses este ticket para reportar a un miembro: elegí **Reporte de departamento**.`,

  reporte_departamento:
    `${ES.warn} **Reporte de departamento**\n\n` +
    `Usá este ticket para reportar a un **miembro de departamento** que pueda estar incumpliendo las normas.\n\n` +
    `${ES.dot} Incluí pruebas (capturas, clips, IDs) cuando puedas.\n` +
    `${ES.dot} El liderazgo del departamento revisará según la gravedad.`,

  fastpass_departamento:
    `${ES.singlekey || ES.star} **Fastpass de departamento**\n\n` +
    `Usá este ticket para:\n` +
    `${ES.dot} Enviar un **fastpass** de departamento\n` +
    `${ES.dot} Solicitar un rol de **handpick** u otros roles que aún no tengas en el server del departamento`
};

export default {
  id: 'embed_sp_soporte_menu',
  customId: 'embed_sp_soporte_menu',
  name: 'embed_sp_soporte_menu',

  async execute(interaction) {
    const value = interaction.values?.[0];
    const body = TEXTOS[value];

    if (!body) {
      return interaction.reply({
        content: `${ES.cruz} Opción no válida.`,
        flags: MessageFlags.Ephemeral
      });
    }

    return interaction.reply({
      content: body + `\n\n${ES.egpd} *Servicios Públicos 00Y4n*`,
      flags: MessageFlags.Ephemeral
    });
  },

  async run(client, interaction) {
    return this.execute(interaction, client);
  }
};
