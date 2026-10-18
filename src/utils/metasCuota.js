/**
 * Cuota semanal por PUNTOS (unificada para todo staff con rol 00Y4n Staff).
 *
 * Cómo se ganan puntos:
 *   Host (sesión organizada)     → 25 pts
 *   Co-host                      → 15 pts
 *   Supervisión (Alto Comando)   → 20 pts
 *   Ticket cerrado/atendido      → 10 pts
 *
 * Meta semanal: 100 puntos → cuota cumplida.
 * Ejemplo: 4 hosts = 100 | 2 hosts + 2 co-host + 2 tickets = 100 | mix libre.
 *
 * Ya no hay mínimo obligatorio de “4 sesiones” ni “2 tickets”:
 * todo suma puntos hacia la misma meta.
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
