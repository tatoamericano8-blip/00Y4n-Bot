import Staff from '../../models/Staff.js';
import StaffLog from '../../models/StaffLog.js';
import { programarRefreshClasificacion } from './clasificacionStaffLive.js';

/**
 * Suma cuota / stats a un staff. Crea el registro si no existe.
 */
export async function sumarCuotaStaff(guildId, userId, {
  horas = 0,
  sesionesOrganizadas = 0,
  sesionesSupervisadas = 0,
  ticketsCerrados = 0,
  motivo = 'Actualización automática',
  executorId = null
} = {}) {
  if (!guildId || !userId) return null;
  if (horas === 0 && sesionesOrganizadas === 0 && sesionesSupervisadas === 0 && ticketsCerrados === 0) {
    return null;
  }

  const update = {
    $inc: {
      'cuotas.horasServicio': horas,
      'cuotas.sesionesOrganizadas': sesionesOrganizadas,
      'cuotas.sesionesSupervisadas': sesionesSupervisadas,
      'cuotas.ticketsCerrados': ticketsCerrados,
      'estadisticasHistoricas.horasTotales': horas,
      'estadisticasHistoricas.sesionesHosteadasTotales': sesionesOrganizadas,
      'estadisticasHistoricas.sesionesSupervisadasTotales': sesionesSupervisadas,
      'estadisticasHistoricas.ticketsCerradosTotales': ticketsCerrados
    },
    $setOnInsert: {
      guildId,
      userId,
      estado: 'ACTIVO',
      rango: 'Staff Trainee'
    }
  };

  const staff = await Staff.findOneAndUpdate(
    { guildId, userId },
    update,
    { upsert: true, new: true }
  );

  try {
    await StaffLog.create({
      guildId,
      tipo: ticketsCerrados > 0 ? 'TICKET_CERRADO' : 'SESION_LOG',
      targetUserId: userId,
      executorId: executorId || userId,
      detalles: {
        horas,
        sesionesOrganizadas,
        sesionesSupervisadas,
        ticketsCerrados,
        motivo
      }
    });
  } catch {
    // Log no crítico
  }

  try {
    const client = global.discordClient || global.client || null;
    if (client) programarRefreshClasificacion(client, guildId);
  } catch (_) {}

  return staff;
}
