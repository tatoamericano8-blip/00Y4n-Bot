/**
 * ============================================================
 *  COLORES CENTRALIZADOS DEL BOT 00Y4n
 * ============================================================
 *
 *  Punto ÚNICO para el color de marca.
 *
 *  Cómo cambiar el color de casi TODO el bot:
 *    1. Editá solo PRIMARIO abajo.
 *    2. Reiniciá / redeploy.
 *
 *  - Embeds con .setColor('#74d4fc') se redirigen vía parcheColorEmbed.js
 *  - getColor() de bot.js y comandos que usen COLORES.primario también.
 * ============================================================
 */

/** Color principal de marca 00Y4n (celeste) */
export const PRIMARIO = '#74d4fc'; // ← CAMBIÁ SOLO ESTA LÍNEA para todo el bot

/** Alias legibles para embeds */
export const COLORES = {
  primario: PRIMARIO,
  secundario: PRIMARIO,

  exito: '#57f287',
  error: '#ed4245',
  advertencia: '#faa61a',
  info: PRIMARIO,

  moderacion: PRIMARIO,
  strike: '#ed4245',
  loa: '#fee75c',

  economia: PRIMARIO,
  dinero: '#57f287',

  sesion: PRIMARIO,

  policia: PRIMARIO,
  bomberos: '#ed4245',
  ems: '#57f287',
};

/**
 * @param {string} [clave='primario']
 */
export function colorEmbed(clave = 'primario') {
  if (typeof clave === 'string' && clave.startsWith('#')) return clave;
  return COLORES[clave] || COLORES.primario;
}

export default COLORES;
