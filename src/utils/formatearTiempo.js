/**
 * Convierte horas decimales (ej: 0.23, 1.5) a texto legible.
 * 0.23 → "14 min"
 * 1.5  → "1h 30 min"
 * 2    → "2h"
 */
export function formatearHoras(horasDecimal) {
  const n = Number(horasDecimal);
  if (!n || isNaN(n) || n <= 0) return '0 min';

  const totalMin = Math.round(n * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  if (h <= 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m} min`;
}

/**
 * Para barras de progreso: muestra actual/meta con formato legible.
 * ej: "14 min / 3h"
 */
export function formatearHorasProgreso(actual, meta) {
  return `${formatearHoras(actual)} / ${formatearHoras(meta)}`;
}
