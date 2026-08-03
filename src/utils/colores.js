/**
 * ============================================================
 *  COLORES CENTRALIZADOS DEL BOT 00Y4n
 * ============================================================
 *
 *  Cómo cambiar el color de MARCA de casi TODO el bot:
 *    1. Editá solo PRIMARIO abajo (ej: '#FB8B66').
 *    2. Redeploy / reiniciá el bot en Render.
 *
 *  Qué se actualiza al cambiar PRIMARIO:
 *    • Embeds con .setColor('#74d4fc')  → parcheColorEmbed.js
 *    • Embeds con .setColor(0x74d4fc)
 *    • getColor('primary'|'info'|…)    → bot.js usa PRIMARIO
 *    • COLORES.primario / .info / etc.  → este archivo
 *
 *  Qué NO cambia (a propósito):
 *    • error / strike / rojo           → siguen en rojo
 *    • éxito / dinero / verde          → siguen en verde
 *    • advertencia / LOA / amarillo    → siguen en amarillo
 *    • Colores dinámicos (hex del comando /emojis-recolor, etc.)
 * ============================================================
 */

/** Color principal de marca 00Y4n — CAMBIÁ SOLO ESTA LÍNEA */
export const PRIMARIO = '#74d4fc';

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
