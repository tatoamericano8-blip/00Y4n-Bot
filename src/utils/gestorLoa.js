import Staff from '../../models/Staff.js';
import StaffLog from '../../models/StaffLog.js';
import { logger } from './logger.js';

export const ROLE_LOA = '1532459272690991318';

/** Parsea fechas comunes DD/MM/YYYY, DD-MM-YYYY o ISO. Fin del día local. */
export function parseFechaFlexible(str) {
  if (!str) return null;
  const s = String(str).trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 23, 59, 59, 999);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d2 = new Date(s);
  if (Number.isNaN(d2.getTime())) return null;
  d2.setHours(23, 59, 59, 999);
  return d2;
}

/** Finaliza LOAs cuya fecha fin ya pasó: estado ACTIVO, quita rol, log. */
export async function limpiarLoaVencidas(client) {
  const ahora = new Date();
  const vencidas = await Staff.find({
    estado: 'LOA',
    'loa.activo': true,
    'loa.fin': { $ne: null, $lte: ahora }
  });

  let n = 0;
  for (const staff of vencidas) {
    try {
      const inicioAnterior = staff.loa?.inicio || null;
      staff.estado = 'ACTIVO';
      staff.loa = staff.loa || {};
      staff.loa.activo = false;
      staff.loa.fin = ahora;
      if (!Array.isArray(staff.loa.historial)) staff.loa.historial = [];
      staff.loa.historial.push({
        inicio: inicioAnterior || ahora,
        fin: ahora,
        motivo: 'LOA finalizada automáticamente por fecha de fin',
        solicitadoEn: inicioAnterior || ahora
      });
      await staff.save();

      try {
        await StaffLog.create({
          guildId: staff.guildId,
          tipo: 'LOA_FIN',
          targetUserId: staff.userId,
          executorId: client.user?.id || 'system',
          detalles: { automatico: true, motivo: 'Fecha de fin alcanzada' }
        });
      } catch {}

      if (client?.guilds) {
        const guild =
          client.guilds.cache.get(staff.guildId) ||
          (await client.guilds.fetch(staff.guildId).catch(() => null));
        if (guild) {
          const member = await guild.members.fetch(staff.userId).catch(() => null);
          if (member) await member.roles.remove(ROLE_LOA).catch(() => null);
        }
      }
      n++;
    } catch (e) {
      logger.warn(`[loa] Error finalizando LOA de ${staff.userId}: ${e.message}`);
    }
  }
  if (n > 0) logger.info(`[loa] LOAs finalizadas automáticamente: ${n}`);
  return n;
}
