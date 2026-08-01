/**
 * Cuotas semanales por rango según #staff-requisitos-de-cuotas
 *
 * Staff Aprendiz  → 3 sesiones moderadas/asistidas
 * Junior Staff    → 5 sesiones + 1 ticket
 * Server Staff    → 5 sesiones + 2 tickets
 * Senior Staff    → 6 sesiones + 3 tickets
 */

const DEFAULT = { sesionesMeta: 3, ticketsMeta: 0, horasMeta: 0, etiqueta: 'Staff' };

/**
 * @param {string} rangoNombre Nombre del rol / rango
 * @returns {{ sesionesMeta: number, ticketsMeta: number, horasMeta: number, etiqueta: string }}
 */
export function obtenerMetasPorRango(rangoNombre) {
  const n = String(rangoNombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (n.includes('senior')) {
    return { sesionesMeta: 6, ticketsMeta: 3, horasMeta: 0, etiqueta: 'Senior Staff' };
  }
  if (n.includes('server staff') || (n.includes('server') && n.includes('staff'))) {
    return { sesionesMeta: 5, ticketsMeta: 2, horasMeta: 0, etiqueta: 'Server Staff' };
  }
  if (n.includes('junior')) {
    return { sesionesMeta: 5, ticketsMeta: 1, horasMeta: 0, etiqueta: 'Junior Staff' };
  }
  if (n.includes('aprendiz') || n.includes('trainee')) {
    return { sesionesMeta: 3, ticketsMeta: 0, horasMeta: 0, etiqueta: 'Staff Aprendiz' };
  }
  // Alto Comando / gerencia: sin cuota mínima obligatoria de rank básico
  if (
    n.includes('alto mando') ||
    n.includes('alto comando') ||
    n.includes('gerente') ||
    n.includes('fundador') ||
    n.includes('administrador')
  ) {
    return { sesionesMeta: 0, ticketsMeta: 0, horasMeta: 0, etiqueta: rangoNombre || 'Alto Comando' };
  }

  return { ...DEFAULT, etiqueta: rangoNombre || DEFAULT.etiqueta };
}

/** Sesiones de la semana = hosteadas + supervisadas */
export function sesionesSemana(cuotas = {}) {
  return (Number(cuotas.sesionesOrganizadas) || 0) + (Number(cuotas.sesionesSupervisadas) || 0);
}
