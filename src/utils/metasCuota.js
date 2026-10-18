/**
 * Cuota semanal por PUNTOS (unificada para todo staff con rol 00Y4n Staff).
 *
 * Cómo se ganan puntos:
 *   Host        → 25 pts por cada 2 h de sesión (proporcional, sin tope)
 *   Co-host     → 15 pts por cada 2 h (proporcional, sin tope)
 *   Supervisión → 20 pts por cada 2 h (proporcional, sin tope)
 *   Ticket      → 10 pts fijos (sin mínimo de tiempo)
 *
 * Crédito = minutos / 120 (2 h = 1.0). Más tiempo = más puntos.
 *   1 h host  → 12.5 pts
 *   2 h host  → 25 pts
 *   4 h host  → 50 pts  (= meta semanal si solo hosteas)
 *
 * Meta semanal: 50 puntos ≈ 4 h de host (o mix co-host / sup / tickets).
 */

export const PTS_HOST = 25;
export const PTS_COHOST = 15;
export const PTS_SUPERVISION = 20;
export const PTS_TICKET = 10;
/** Meta semanal: ~4 h de host a ritmo de 25 pts / 2 h */
export const PUNTOS_META = 50;

const DEFAULT_ETIQUETA = 'Staff';

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
