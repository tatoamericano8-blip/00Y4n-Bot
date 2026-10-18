/**
 * Cuota semanal por PUNTOS (unificada para todo staff con rol 00Y4n Staff).
 *
 * Cómo se ganan puntos:
 *   Host        → hasta 25 pts (proporcional: 60 min = 25, 30 min ≈ 12.5)
 *   Co-host     → hasta 15 pts (misma proporción por minutos)
 *   Supervisión → hasta 20 pts (misma proporción por minutos)
 *   Ticket      → 10 pts fijos (sin mínimo de tiempo)
 *
 * Crédito de sesión = min(1, minutos / 60). A los 60+ min se alcanza el máximo
 * de esa sesión; menos tiempo suma en proporción (no se pierde todo).
 *
 * Meta semanal: 100 puntos → cuota cumplida.
 * Ejemplo: 4 hosts de 1h = 100 | 2 hosts 1h + 2 tickets = 70 | mix libre.
 */

export const PTS_HOST = 25;
export const PTS_COHOST = 15;
export const PTS_SUPERVISION = 20;
export const PTS_TICKET = 10;
export const PUNTOS_META = 100;

const DEFAULT_ETIQUETA = 'Staff';

/**
 * @param {string} rangoNombre solo para etiqueta en UI
 * @returns {{ puntosMeta: number, sesionesMeta: number, ticketsMeta: number, horasMeta: number, etiqueta: string }}
 */
export function obtenerMetasPorRango(rangoNombre) {
  const etiqueta = String(rangoNombre || '').trim() || DEFAULT_ETIQUETA;
  return {
    puntosMeta: PUNTOS_META,
    // compat: ya no se usan como requisito binario
    sesionesMeta: 0,
    ticketsMeta: 0,
    horasMeta: 0,
    etiqueta
  };
}

/** Sesiones de la semana (conteo crudo: host + co-host + supervisadas) */
export function sesionesSemana(cuotas = {}) {
  return (
    (Number(cuotas.sesionesOrganizadas) || 0) +
    (Number(cuotas.sesionesCohost) || 0) +
    (Number(cuotas.sesionesSupervisadas) || 0)
  );
}

/**
 * Puntos semanales según actividad registrada en cuotas.
 * @param {object} cuotas
 * @returns {number}
 */
export function calcularPuntosSemana(cuotas = {}) {
  const host = Number(cuotas.sesionesOrganizadas) || 0;
  const cohost = Number(cuotas.sesionesCohost) || 0;
  const sup = Number(cuotas.sesionesSupervisadas) || 0;
  const tkt = Number(cuotas.ticketsCerrados) || 0;
  return (
    host * PTS_HOST +
    cohost * PTS_COHOST +
    sup * PTS_SUPERVISION +
    tkt * PTS_TICKET
  );
}

/** Desglose legible para embeds */
export function desglosePuntos(cuotas = {}) {
  const host = Number(cuotas.sesionesOrganizadas) || 0;
  const cohost = Number(cuotas.sesionesCohost) || 0;
  const sup = Number(cuotas.sesionesSupervisadas) || 0;
  const tkt = Number(cuotas.ticketsCerrados) || 0;
  return {
    host,
    cohost,
    sup,
    tkt,
    ptsHost: host * PTS_HOST,
    ptsCohost: cohost * PTS_COHOST,
    ptsSup: sup * PTS_SUPERVISION,
    ptsTkt: tkt * PTS_TICKET,
    total: calcularPuntosSemana(cuotas)
  };
}
