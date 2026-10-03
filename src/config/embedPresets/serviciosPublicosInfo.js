import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { ES, EMOJI_DEF_SERVICIOS } from '../emojisServicios.js';

/** Color barra embed — tema oscuro Servicios Públicos */
const COLOR_SP = 0x1a1a1a;

const BANNER_URL =
  'https://media.discordapp.net/attachments/1555969515890810970/1555969574871244830/Servicios_Publicos_Informacion_1_1.png?ex=6ac27517&is=6ac12397&hm=03278477401382ad125a4c6451b1f7b6e1011623d7d521ea0a41371608635d7e&format=webp&quality=lossless';

function emojiBtn(key) {
  const d = EMOJI_DEF_SERVICIOS[key];
  if (!d?.id) return undefined;
  return { id: d.id, name: d.name, animated: !!d.animated };
}

/**
 * Preset público: banner + bienvenida + botón Reglamento.
 * Al tocar el botón → embeds 1–13 (efímero).
 */
export default {
  id: 'servicios_publicos_info',
  label: 'SP · Información / Reglamento',
  description: 'Bienvenida SP + botón Reglamento (1–13)',

  build() {
    const banner = new EmbedBuilder().setColor(COLOR_SP).setImage(BANNER_URL);

    const bienvenida = new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.egpd} Bienvenido a Servicios Públicos 00Y4n`)
      .setDescription(
        `${ES.flecha} **00Y4n** te da la bienvenida a su servidor de **Servicios Públicos**, ` +
          `gestionado y operado por el Alto Comando y los líderes de cada departamento.\n\n` +
          `**Leé y reconocé la información** tocando el botón **Reglamento** para evitar infracciones o moderaciones.\n\n` +
          `${ES.dot} **Servicios Públicos 00Y4n** ${ES.lock}`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('embed_sp_reglamento')
        .setLabel('Reglamento')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojiBtn('form') || emojiBtn('lock'))
    );

    return {
      embeds: [banner, bienvenida],
      components: [row]
    };
  }
};

/** Embeds del reglamento completo (usados por el botón). */
export function buildReglamentoEmbeds() {
  const reglamento1 = new EmbedBuilder()
    .setColor(COLOR_SP)
    .setTitle(`${ES.lock} Reglamento de Servicios Públicos`)
    .setDescription(
      `${ES.dot} **1.** ${ES.flecha} **Leé el reglamento**\n` +
        `Todos los miembros de 00Y4n deben leer y reconocer las normas listadas en los canales de información. ` +
        `El incumplimiento puede traer consecuencias serias.\n\n` +
        `${ES.dot} **2.** ${ES.flecha} **Seguí las instrucciones del Staff**\n` +
        `Los miembros deben seguir las indicaciones del staff. Por ejemplo, si se les indica salir o no abrir tickets, deben cumplir de inmediato.\n\n` +
        `${ES.dot} **3.** ${ES.flecha} **Usá el sentido común**\n` +
        `Usá criterio al decidir si una acción viola las reglas. Si algo sería inaceptable en otra comunidad, tampoco lo es acá.\n\n` +
        `${ES.dot} **4.** ${ES.flecha} **Edad mínima (13+)**\n` +
        `Según los Términos de Servicio de Discord, todos los miembros deben tener al menos 13 años. ` +
        `Quien no cumpla este requisito será removido hasta alcanzarlo.\n\n` +
        `${ES.dot} **5.** ${ES.flecha} **Sin acoso ni ataques personales**\n` +
        `Cualquier forma de acoso o señalamiento hacia otros miembros está prohibida. ` +
        `Las infracciones pueden resultar en timeouts, strikes o expulsión de la comunidad.\n\n` +
        `${ES.dot} **6.** ${ES.flecha} **Sin insultos ni comentarios ofensivos**\n` +
        `Está estrictamente prohibido el lenguaje discriminatorio u ofensivo por raza, identidad de género, ` +
        `peso, etnia u otros factores similares.\n\n` +
        `${ES.dot} **7.** ${ES.flecha} **Sin publicidad**\n` +
        `Queda prohibida la publicidad de cualquier tipo, incluyendo mensajes directos y canales públicos. ` +
        `Cualquier servidor que reclute miembros o staff de 00Y4n será puesto en lista negra y los miembros involucrados serán removidos.`
    );

  const reglamento2 = new EmbedBuilder()
    .setColor(COLOR_SP)
    .setDescription(
      `${ES.dot} **8.** ${ES.flecha} **Sin robo de recursos**\n` +
        `Robar recursos de 00Y4n (anuncios, documentación u otros materiales) implica ban inmediato de 00Y4n y servidores afiliados.\n\n` +
        `${ES.dot} **9.** ${ES.flecha} **Sin compartir información personal**\n` +
        `Filtrar, doxxear o compartir datos personales de cualquier miembro resulta en ban inmediato y permanente.\n\n` +
        `${ES.dot} **10.** ${ES.flecha} **Sin contenido NSFW**\n` +
        `Publicar o distribuir material no apto para el trabajo (pornografía, gore o imágenes violentas) está estrictamente prohibido. ` +
        `La primera falta puede ser un warn; la segunda, ban inmediato.\n\n` +
        `${ES.dot} **11.** ${ES.flecha} **Sin moderación por MD**\n` +
        `El staff de 00Y4n no supervisa mensajes privados. En esta comunidad respetamos la privacidad individual de cada miembro.\n\n` +
        `${ES.dot} **12.** ${ES.flecha} **Mantené el respeto**\n` +
        `No se tolera la falta de respeto, comentarios difamatorios ni quejas contra 00Y4n o comunidades afiliadas. ` +
        `Quien resulte irrespetuoso será sancionado.\n\n` +
        `${ES.dot} **13.** ${ES.flecha} **Conducta en canales de voz**\n` +
        `Todas las reglas aplican también en voz. Ruido excesivo, sonidos disruptivos o audio molesto ("ear-rape") están prohibidos y conllevan acción disciplinaria.\n\n` +
        `${ES.egpd} **Servicios Públicos 00Y4n** ${ES.lock}`
    )
    .setFooter({ text: 'División de Servicios Públicos | 00Y4n' });

  return [reglamento1, reglamento2];
}
