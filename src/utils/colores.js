/**
 * ============================================================
 *  COLORES CENTRALIZADOS DEL BOT 00Y4n (servidor principal RP)
 * ============================================================
 *
 *  CAMBIAR EL COLOR DE MARCA:
 *    1. Editá SOLO PRIMARIO abajo.
 *    2. Redeploy / reiniciá el bot.
 *
 *  Qué sigue a PRIMARIO:
 *    • Embeds de marca del server principal
 *    • Éxito / confirmación / dinero OK
 *    • Info, sesiones, economía UI, moderación “normal”
 *
 *  Qué es crítico (rojo único, no muy fuerte):
 *    • Error, strike, denegado, peligro → ROJO_CRITICO
 *
 *  Avisos (amarillo, aparte):
 *    • LOA / pendiente / advertencia
 *
 *  Servicios Públicos:
 *    • NO usan PRIMARIO. Sus embeds van con COLOR_SP (#1a1a1a)
 *      en presets/menus SP. El parche no los toca.
 * ============================================================
 */

/** ★ Color principal de marca 00Y4n (RP) — CAMBIÁ SOLO ESTA LÍNEA ★ */
export const PRIMARIO = '#8ae6fa';

/** Rojo crítico unificado (suave, no agresivo) */
export const ROJO_CRITICO = '#ed4245';

/** Semánticos */
export const CRITICO = {
  /** Éxito / confirmación / dinero OK → marca */
  exito: PRIMARIO,
  /** Error / strike / denegado → un solo rojo */
  error: ROJO_CRITICO,
  /** Aviso / LOA / pendiente */
  advertencia: '#faa61a',
  strike: ROJO_CRITICO,
  loa: '#fee75c',
  bomberos: ROJO_CRITICO,
  ems: PRIMARIO,
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

  /** Solo referencia: SP no debe usar PRIMARIO */
  serviciosPublicos: '#1a1a1a',
};

/**
 * @param {string} [clave='primario']
 */
export function colorEmbed(clave = 'primario') {
  if (typeof clave === 'string' && clave.startsWith('#')) return clave;
  return COLORES[clave] || COLORES.primario;
}

export default COLORES;
