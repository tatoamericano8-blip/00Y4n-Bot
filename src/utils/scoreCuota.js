import { obtenerMetasPorRango, sesionesSemana } from './metasCuota.js';

/**
 * Score de rendimiento semanal (0–100 aprox, puede pasar 100 si supera meta).
 *
 * Fórmula base:
 *  - Sesiones (host+sup) vs meta → hasta 50 pts
 *  - Tickets vs meta → hasta 30 pts
 *  - Tiempo (horas) bonus → hasta 20 pts (1h = 4 pts, tope 5h)
 *
 * Si no hay meta de sesiones (Alto Comando): score por actividad pura.
 */
export function calcularScore(cuotas = {}, rangoNombre = '') {
  const metas = obtenerMetasPorRango(rangoNombre);
  const ses = sesionesSemana(cuotas);
  const tkt = Number(cuotas.ticketsCerrados) || 0;
  const horas = Number(cuotas.horasServicio) || 0;

  let score = 0;

  if (metas.sesionesMeta > 0) {
    score += Math.min(50, (ses / metas.sesionesMeta) * 50);
  } else {
    score += Math.min(50, ses * 8); // sin meta: 8 pts por sesión
  }

  if (metas.ticketsMeta > 0) {
    score += Math.min(30, (tkt / metas.ticketsMeta) * 30);
  } else {
    score += Math.min(30, tkt * 10);
  }

  score += Math.min(20, horas * 4);

  return Math.round(score * 10) / 10;
}

/**
 * ¿Cumplió la meta semanal?
 * @returns {{ cumplio: boolean|null, enLoa: boolean, motivo: string }}
 *   cumplio = null → exento (LOA), no cuenta como fallo ni como éxito de racha
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

  // Sin meta obligatoria (Alto Comando, etc.)
  if (metas.sesionesMeta <= 0 && metas.ticketsMeta <= 0) {
    return { cumplio: true, enLoa: false, motivo: 'Sin cuota mínima de rango' };
  }

  const okSes = metas.sesionesMeta <= 0 || ses >= metas.sesionesMeta;
  const okTkt = metas.ticketsMeta <= 0 || tkt >= metas.ticketsMeta;

  if (okSes && okTkt) {
    return { cumplio: true, enLoa: false, motivo: 'Meta cumplida' };
  }

  const faltas = [];
  if (!okSes) faltas.push(`sesiones ${ses}/${metas.sesionesMeta}`);
  if (!okTkt) faltas.push(`tickets ${tkt}/${metas.ticketsMeta}`);
  return { cumplio: false, enLoa: false, motivo: `Falta: ${faltas.join(', ')}` };
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
