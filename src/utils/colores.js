/**
 * ============================================================
 *  COLORES CENTRALIZADOS DEL BOT 00Y4n
 * ============================================================
 *
 *  Este archivo es el punto ÚNICO recomendado para el color
 *  de marca de los embeds personalizados de SWFL.
 *
 *  Cómo cambiar el color de TODO lo que use este util:
 *    1. Editá solo la constante `PRIMARIO` abajo.
 *    2. Los comandos que importen desde aquí se actualizarán.
 *
 *  Nota:
 *  - Los módulos viejos del template (tickets, giveaways, etc.)
 *    usan `getColor()` desde `src/config/bot.js`.
 *  - Muchos comandos SWFL todavía tienen `#74d4fc` hardcodeado.
 *    No se tocaron: el default se mantiene igual.
 *  - Cuando crees comandos nuevos, usá:
 *      import { COLORES } from '../../utils/colores.js';
 *      .setColor(COLORES.primario)
 * ============================================================
 */

/** Color principal de marca 00Y4n (celeste) */
export const PRIMARIO = '#74d4fc';

/** Alias legibles para embeds */
export const COLORES = {
  /** Color de marca / embeds normales */
  primario: PRIMARIO,
  secundario: PRIMARIO,

  /** Estados */
  exito: '#57f287',      // verde Discord
  error: '#ed4245',      // rojo Discord
  advertencia: '#faa61a', // naranja
  info: PRIMARIO,

  /** Moderación / staff */
  moderacion: PRIMARIO,
  strike: '#ed4245',
  loa: '#fee75c',

  /** Economía */
  economia: PRIMARIO,
  dinero: '#57f287',

  /** Sesiones / RP */
  sesion: PRIMARIO,

  /** Departamentos (podés personalizar después) */
  policia: PRIMARIO,
  bomberos: '#ed4245',
  ems: '#57f287',
};

/**
 * Devuelve el color listo para .setColor()
 * Acepta clave de COLORES o un hex directo.
 *
 * @param {string} [clave='primario'] ej: 'primario' | 'error' | '#ff0000'
 */
export function colorEmbed(clave = 'primario') {
  if (typeof clave === 'string' && clave.startsWith('#')) return clave;
  return COLORES[clave] || COLORES.primario;
}

export default COLORES;
