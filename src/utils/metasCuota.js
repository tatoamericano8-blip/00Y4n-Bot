/**
 * Cuota semanal por PUNTOS (unificada para todo staff con rol 00Y4n Staff).
 *
 * Cómo se ganan puntos:
 *   Host        → 25 pts por cada 2 h de sesión (proporcional, sin tope de sesión)
 *   Co-host     → 15 pts por cada 2 h (proporcional)
 *   Supervisión → 20 pts por cada 2 h (proporcional)
 *   Ticket      → 10 pts fijos
 *   Ajuste manual (/cargar-cuota puntos) → suma o resta directa
 *
 * Meta para APROBAR: 40 puntos (mínimo).
 * Tope semanal: 50 puntos (máximo que cuenta el score/cuota).
 */

export const PTS_HOST = 25;
export const PTS_COHOST = 15;
export const PTS_SUPERVISION = 20;
export const PTS_TICKET = 10;
/** Mínimo para aprobar la cuota semanal */
export const PUNTOS_META = 40;
/** Máximo de puntos que cuentan en la semana */
export const PUNTOS_MAX = 50;


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
  const ajuste = Number(cuotas.puntosAjuste) || 0;
  const bruto =
    host * PTS_HOST +
    cohost * PTS_COHOST +
    sup * PTS_SUPERVISION +
    tkt * PTS_TICKET +
    ajuste;
  // Tope semanal 50; el mínimo de aprobación es PUNTOS_META (40)
  return Math.min(bruto, PUNTOS_MAX);
}

/** Desglose legible para embeds */
export function desglosePuntos(cuotas = {}) {
  const host = Number(cuotas.sesionesOrganizadas) || 0;
  const cohost = Number(cuotas.sesionesCohost) || 0;
  const sup = Number(cuotas.sesionesSupervisadas) || 0;
  const tkt = Number(cuotas.ticketsCerrados) || 0;
  const ajuste = Number(cuotas.puntosAjuste) || 0;
  return {
    host,
    cohost,
    sup,
    tkt,
    ajuste,
    ptsHost: host * PTS_HOST,
    ptsCohost: cohost * PTS_COHOST,
    ptsSup: sup * PTS_SUPERVISION,
    ptsTkt: tkt * PTS_TICKET,
    ptsAjuste: ajuste,
    total: calcularPuntosSemana(cuotas)
  };
}
