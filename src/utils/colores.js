/**
 * ============================================================
 *  COLORES CENTRALIZADOS DEL BOT 00Y4n
 * ============================================================
 *
 *  CAMBIAR EL COLOR DE MARCA DE (casi) TODO EL BOT:
 *    1. Editá SOLO la línea de PRIMARIO (ej: '#FEC18C' o '#8ae6fa').
 *    2. Redeploy / reiniciá el bot.
 *
 *  Qué SÍ se actualiza al cambiar PRIMARIO:
 *    • Embeds de marca (sesiones, staff, economía UI, menús, etc.)
 *    • .setColor('#8ae6fa'), '#74d4fc', naranja viejo, blurple de marca
 *    • getColor('primary'|'info'|'moderation'|…)
 *    • COLORES.primario / secundario / info / sesion / economia / …
 *
 *  Qué NO cambia (embeds críticos / semánticos):
 *    • error / strike / rojo          → COLORES.error
 *    • éxito / verde                  → COLORES.exito
 *    • advertencia / LOA / amarillo   → COLORES.advertencia
 *    • Colores dinámicos (hex libre, recolor, prioridades de ticket, etc.)
 *
 *  El parche vive en utils/parcheColorEmbed.js (se carga al arrancar).
 * ============================================================
 */

/** ★ Color principal de marca 00Y4n — CAMBIÁ SOLO ESTA LÍNEA ★ */
export const PRIMARIO = '#8ae6fa';

/** Colores semánticos fijos (no siguen a PRIMARIO) */
export const CRITICO = {
  /** Éxito, dinero OK, confirmaciones */
  exito: '#57f287',
  /** Error, strike, denegado, peligro */
  error: '#ff6363',
  /** Aviso, LOA, pendiente */
  advertencia: '#faa61a',
  /** Strike / sanción fuerte */
  strike: '#E60404',
  /** LOA / ausencia */
  loa: '#fee75c',
  /** Bomberos / emergencia roja */
  bomberos: '#ed4245',
  /** EMS */
  ems: '#57f287',
};

/** Alias legibles para embeds */
export const COLORES = {
  primario: PRIMARIO,
  secundario: PRIMARIO,

  exito: CRITICO.exito,
  error: CRITICO.error,
  advertencia: CRITICO.advertencia,
  info: PRIMARIO,

  moderacion: PRIMARIO,
  strike: CRITICO.strike,
  loa: CRITICO.loa,

  economia: PRIMARIO,
  dinero: CRITICO.exito,

  sesion: PRIMARIO,

  policia: PRIMARIO,
  bomberos: CRITICO.bomberos,
  ems: CRITICO.ems,
};

/**
 * @param {string} [clave='primario']
 */
export function colorEmbed(clave = 'primario') {
  if (typeof clave === 'string' && clave.startsWith('#')) return clave;
  return COLORES[clave] || COLORES.primario;
}

export default COLORES;
