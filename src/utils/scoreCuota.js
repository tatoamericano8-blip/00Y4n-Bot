import {
  obtenerMetasPorRango,
  sesionesSemana,
  calcularPuntosSemana
} from './metasCuota.js';

/**
 * Score semanal = puntos de cuota (host, co-host, supervisión, tickets).
 * Se muestra tal cual; la meta de cumplimiento es puntosMeta (100).
 */
export function calcularScore(cuotas = {}, rangoNombre = '') {
  void rangoNombre;
  return calcularPuntosSemana(cuotas);
}

/**
 * ¿Cumplió la meta semanal por puntos?
 * @returns {{ cumplio: boolean|null, enLoa: boolean, motivo: string, puntos: number, meta: number }}
 *   cumplio = null → exento (LOA)
 */
export function evaluarCumplimiento(staffData, rangoNombre = '') {
  const enLoa =
    staffData?.estado === 'LOA' || staffData?.loa?.activo === true;

  if (enLoa) {
    return {
      cumplio: null,
      enLoa: true,
      motivo: 'En LOA — exento de cuota',
      puntos: 0,
      meta: 0
    };
  }

  const metas = obtenerMetasPorRango(rangoNombre);
  const meta = Number(metas.puntosMeta) || 0;
  const puntos = calcularPuntosSemana(staffData?.cuotas || {});

  if (meta <= 0) {
    return {
      cumplio: true,
      enLoa: false,
      motivo: 'Sin cuota mínima de rango',
      puntos,
      meta
    };
  }

  if (puntos >= meta) {
    return {
      cumplio: true,
      enLoa: false,
      motivo: 'Meta de puntos cumplida',
      puntos,
      meta
    };
  }

  return {
    cumplio: false,
    enLoa: false,
    motivo: `Faltan puntos: ${puntos}/${meta}`,
    puntos,
    meta
  };
}

/** ID de semana ISO (UTC) */
export function semanaIdActual() {
  const d = new Date();
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function textoScore(score) {
  const s = Number(score) || 0;
  if (s >= 100) return `🔥 ${s}`;
  if (s >= 70) return `✅ ${s}`;
  if (s >= 40) return `🟡 ${s}`;
  return `🔴 ${s}`;
}
