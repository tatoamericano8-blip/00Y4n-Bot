import { EmbedBuilder } from 'discord.js';
import { ES } from '../emojisServicios.js';

const COLOR_SP = 0x1a1a1a;
const BANNER_URL =
  'https://media.discordapp.net/attachments/1555969515890810970/1555969574178914365/Servicios_Publicos_Bienvenida_1_1.png?ex=6ac27517&is=6ac12397&hm=d8ea2c7ac9edacc9317c40cd551204434eb3a9e6fe050231cd931eadb1130ea2&format=webp&quality=lossless';

/**
 * Preset estático de bienvenida SP (para /embed-send).
 * La bienvenida automática al unirse usa el mismo texto en guildMemberAdd.
 */
export function buildBienvenidaSPEmbeds() {
  const texto = new EmbedBuilder()
    .setColor(COLOR_SP)
    .setTitle(`${ES.logo || ES.egpd} ¡Bienvenido/a a Servicios Públicos 00Y4n!`)
    .setDescription(
      `${ES.flecha} **¡Bienvenido/a al servidor de Servicios Públicos de 00Y4n!**\n` +
        `Asegurate de haber leído y revisado las normas del canal **informativo** antes de abrir un ticket de soporte.\n\n` +
        `${ES.dot} **¿Tenés una pregunta o consulta válida?** Podés abrir un ticket de soporte en el canal de asistencia, ` +
        `en la sección de Ayuda y Soporte. Tené en cuenta que enviar tickets falsos o engañosos puede resultar en la expulsión del servidor.\n\n` +
        `${ES.dot} **Si te interesa postularte a uno de nuestros departamentos**, andá al servidor principal y usá el comando ` +
        `\`/solicitud-departamento\` en el canal correspondiente, o utilizá el canal de **fastpass** para el Departamento de Servicios de Emergencia.\n\n` +
        `${ES.reply} **Gracias por tu cooperación.** Si tenés consultas, dudas o inquietudes sobre un miembro del equipo de Servicios Públicos, ` +
        `no dudes en contactarnos. Nuestro equipo está comprometido a resolver tus inquietudes y brindarte la asistencia adecuada.`
    )
    .setFooter({ text: 'División de Servicios Públicos | 00Y4n' });

  const banner = new EmbedBuilder().setColor(COLOR_SP).setImage(BANNER_URL);

  return [texto, banner];
}

export default {
  id: 'servicios_publicos_bienvenida',
  label: 'SP · Bienvenida',
  description: 'Mensaje de bienvenida de Servicios Públicos 00Y4n',

  build() {
    return { embeds: buildBienvenidaSPEmbeds() };
  }
};
