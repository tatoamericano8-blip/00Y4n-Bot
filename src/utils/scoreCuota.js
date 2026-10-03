import { obtenerMetasPorRango, sesionesSemana } from './metasCuota.js';

/**
 * Score de rendimiento semanal (0–100 aprox).
 *
 * Pesos de sesión:
 *  - Host (sesionesOrganizadas): 1.0
 *  - Co-host (sesionesCohost):   0.65  → un poco menos que host
 *  - Supervisor:                 0.50
 *
 * Fórmula:
 *  - Sesiones ponderadas vs meta → hasta 50 pts
 *  - Tickets vs meta → hasta 30 pts
 *  - Tiempo (horas) → hasta 25 pts (refuerza al que más tiempo hosteó)
 *
 * Si no hay meta de sesiones (Alto Comando): score por actividad pura.
 */
export function calcularScore(cuotas = {}, rangoNombre = '') {
  const metas = obtenerMetasPorRango(rangoNombre);
  const host = Number(cuotas.sesionesOrganizadas) || 0;
  const cohost = Number(cuotas.sesionesCohost) || 0;
  const sup = Number(cuotas.sesionesSupervisadas) || 0;
  const tkt = Number(cuotas.ticketsCerrados) || 0;
  const horas = Number(cuotas.horasServicio) || 0;

  const sesPonderadas = host * 1.0 + cohost * 0.65 + sup * 0.5;

  let score = 0;

  if (metas.sesionesMeta > 0) {
    score += Math.min(50, (sesPonderadas / metas.sesionesMeta) * 50);
  } else {
    score += Math.min(50, sesPonderadas * 12);
  }

  if (metas.ticketsMeta > 0) {
    score += Math.min(30, (tkt / metas.ticketsMeta) * 30);
  } else {
    score += Math.min(30, tkt * 10);
  }

  score += Math.min(25, horas * 6);

  return Math.round(score * 10) / 10;
}

/**
 * ¿Cumplió la meta semanal?
 * @returns {{ cumplio: boolean|null, enLoa: boolean, motivo: string }}
 *   cumplio = null → exento (LOA)
 */
export function evaluarCumplimiento(staffData, rangoNombre = '') {
  const enLoa =
    staffData?.estado === 'LOA' || staffData?.loa?.activo === true;

  if (enLoa) {
    return { cumplio: null, enLoa: true, motivo: 'En LOA — exento de cuota' };
  }

  const metas = obtenerMetasPorRango(rangoNombre);
  const ses = sesionesSemana(staffData?.cuotas || {});
  const tkt = Number(staffData?.cuotas?.ticketsCerrados) || 0;

  if (metas.sesionesMeta <= 0 && metas.ticketsMeta <= 0) {
    return { cumplio: true, enLoa: false, motivo: 'Sin cuota mínima de rango' };
  }

  // Sesiones obligatorias; tickets opcionales (suman score / se muestran, no bloquean cumplimiento)
  const okSes = metas.sesionesMeta <= 0 || ses >= metas.sesionesMeta;

  if (okSes) {
    return { cumplio: true, enLoa: false, motivo: 'Meta cumplida' };
  }

  return {
    cumplio: false,
    enLoa: false,
    motivo: `Falta: sesiones ${ses}/${metas.sesionesMeta}`
  };
}

/** ID de semana ISO simple YYYY-Www */
export function idSemanaActual(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function textoScore(score) {
  if (score >= 90) return `🔥 ${score}`;
  if (score >= 70) return `✅ ${score}`;
  if (score >= 40) return `🟡 ${score}`;
  return `🔴 ${score}`;
}
