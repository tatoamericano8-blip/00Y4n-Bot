/**
 * Cuotas semanales unificadas (todos los rangos de staff iguales).
 *
 * Meta: 4 sesiones/semana + 2 tickets (opcionales: suman, no son obligatorios para cumplir).
 * Alto Comando / gerencia / fundadores: sin cuota mínima.
 */
const META_STAFF = { sesionesMeta: 4, ticketsMeta: 2, horasMeta: 0 };

const DEFAULT = { ...META_STAFF, etiqueta: 'Staff' };

/**
 * @param {string} rangoNombre Nombre del rol / rango
 * @returns {{ sesionesMeta: number, ticketsMeta: number, horasMeta: number, etiqueta: string }}
 */
export function obtenerMetasPorRango(rangoNombre) {
  const n = String(rangoNombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const etiqueta = rangoNombre || DEFAULT.etiqueta;

  // Alto Comando / gerencia: sin cuota mínima obligatoria
  if (
    n.includes('alto mando') ||
    n.includes('alto comando') ||
    n.includes('gerente') ||
    n.includes('fundador') ||
    n.includes('administrador') ||
    n.includes('supervisor ejecutivo') ||
    n.includes('equipo de propietarios') ||
    n.includes('propietario')
  ) {
    return { sesionesMeta: 0, ticketsMeta: 0, horasMeta: 0, etiqueta };
  }

  // Todos los rangos de staff: misma meta
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
