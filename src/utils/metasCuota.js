/**
 * Cuotas semanales unificadas.
 *
 * Cualquier miembro con el rol 00Y4n Staff (1512120103771050005) — incluyendo
 * Alto Comando si lo tiene — cumple la misma meta:
 *   4 sesiones/semana (obligatorio)
 *   2 tickets (opcionales: suman score, no bloquean cumplimiento)
 *
 * Quién entra al sistema de cuotas lo decide el rol Staff en panel / perfil / reinicio.
 */
const META_STAFF = { sesionesMeta: 4, ticketsMeta: 2, horasMeta: 0 };

const DEFAULT = { ...META_STAFF, etiqueta: 'Staff' };

/**
 * @param {string} rangoNombre Nombre del rol / rango (solo para etiqueta)
 * @returns {{ sesionesMeta: number, ticketsMeta: number, horasMeta: number, etiqueta: string }}
 */
export function obtenerMetasPorRango(rangoNombre) {
  const etiqueta = String(rangoNombre || '').trim() || DEFAULT.etiqueta;
  // Misma meta para todos los rangos (Aprendiz → Alto Comando, etc.)
  return { ...META_STAFF, etiqueta };
}

/** Sesiones de la semana = host + co-host + supervisadas (para meta de cuota) */
export function sesionesSemana(cuotas = {}) {
  return (
    (Number(cuotas.sesionesOrganizadas) || 0) +
    (Number(cuotas.sesionesCohost) || 0) +
    (Number(cuotas.sesionesSupervisadas) || 0)
  );
}
