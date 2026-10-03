import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';
import { ES, EMOJI_DEF_SERVICIOS } from '../emojisServicios.js';

const COLOR_SP = 0x1a1a1a;

const BANNER_URL =
  'https://media.discordapp.net/attachments/1555969515890810970/1555969575982596228/Servicios_Publicos_Soporte_1.png?ex=6ac27517&is=6ac12397&hm=df0a92f1c19e2143b752602057adcca33917974d2b47dd6c1b0fd19e2f50e9b8&format=webp&quality=lossless';

function optEmoji(key) {
  const d = EMOJI_DEF_SERVICIOS[key];
  if (!d?.id) return undefined;
  return { id: d.id, name: d.name, animated: !!d.animated };
}

/**
 * Preset: Soporte / Tickets — División de Servicios Públicos | 00Y4n
 * Referencia GVRU Public Services Support (traducido + ES.*)
 */
export default {
  id: 'servicios_publicos_soporte',
  label: 'SP · Soporte / Tickets',
  description: 'Panel de ayuda y tipos de ticket de Servicios Públicos',

  build() {
    const banner = new EmbedBuilder().setColor(COLOR_SP).setImage(BANNER_URL);

    const cuerpo = new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.form} Servicios Públicos 00Y4n — Ayuda y Soporte`)
      .setDescription(
        `${ES.dot} **¡Bienvenido al directorio de soporte de Servicios Públicos 00Y4n!** ` +
          `En este canal podés solicitar asistencia, como una **Consulta general** o un **Reporte de departamento**. ` +
          `Si tenés algún problema dentro del servidor, no dudes en abrir un ticket abajo.\n\n` +
          `${ES.flecha} **Asistencia general:**\n` +
          `${ES.dot} Usá este ticket de soporte para hacer **preguntas** sobre Servicios Públicos. ` +
          `**No** sirve para reportar a alguien; para eso hay otro tipo de ticket.\n\n` +
          `${ES.flecha} **Reporte de departamento:**\n` +
          `${ES.dot} Usalo para reportar a un **miembro de departamento** que pueda estar incumpliendo las normas. ` +
          `Reuní pruebas si hace falta para que el liderazgo del departamento actúe según la gravedad.\n\n` +
          `${ES.flecha} **Fastpasses de departamento:**\n` +
          `${ES.dot} Usalo para enviar un **fastpass** de departamento, o para pedir un rol de handpick / roles ` +
          `que todavía no hayas obtenido en el servidor del departamento.\n\n` +
          `${ES.egpd} **Servicios Públicos 00Y4n** ${ES.lock}`
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId('embed_sp_soporte_menu')
      .setPlaceholder('Elegí un tipo de ticket...')
      .addOptions(
        {
          label: 'Asistencia general',
          description: 'Preguntas sobre Servicios Públicos',
          value: 'asistencia_general',
          emoji: optEmoji('faq') || optEmoji('info')
        },
        {
          label: 'Reporte de departamento',
          description: 'Reportar a un miembro de departamento',
          value: 'reporte_departamento',
          emoji: optEmoji('warn') || optEmoji('form')
        },
        {
          label: 'Fastpass de departamento',
          description: 'Fastpass o solicitud de rol / handpick',
          value: 'fastpass_departamento',
          emoji: optEmoji('singlekey') || optEmoji('star')
        }
      );

    return {
      embeds: [banner, cuerpo],
      components: [new ActionRowBuilder().addComponents(menu)]
    };
  }
};
