import { agregarSaldo } from './gestorEconomia.js';
import { logger } from './logger.js';

const MIN_MINUTOS = 20;
const BASE_HOST = 8000;
const POR_HORA = 4000;
const MAX_HOST = 20000;
const FRAC_COHOST = 0.5;
const FRAC_SUPERVISOR = 0.35;

function calcularPagoHost(duracionMinutos) {
  const mins = Math.max(0, Number(duracionMinutos) || 0);
  if (mins < MIN_MINUTOS) return 0;
  const extra = Math.floor((mins / 60) * POR_HORA);
  return Math.min(MAX_HOST, BASE_HOST + extra);
}

export async function pagarStaffSesion({
  hostId,
  coHostId = null,
  supervisorId = null,
  duracionMinutos = 0,
  cuentaParaCuota = true
} = {}) {
  const result = { host: 0, cohost: 0, supervisor: 0 };
  if (!cuentaParaCuota || !hostId) return result;

  const pagoHost = calcularPagoHost(duracionMinutos);
  if (pagoHost <= 0) return result;

  try {
    await agregarSaldo(hostId, pagoHost, {
      tipo: 'PAGO_HOST',
      motivo: `Pago host sesion (${duracionMinutos} min)`
    });
    result.host = pagoHost;
  } catch (e) {
    logger.warn('[pagoHost] host:', e?.message || e);
  }

  if (coHostId && coHostId !== hostId) {
    const monto = Math.floor(pagoHost * FRAC_COHOST);
    if (monto > 0) {
      try {
        await agregarSaldo(coHostId, monto, {
          tipo: 'PAGO_COHOST',
          motivo: `Pago co-host sesion (${duracionMinutos} min)`
        });
        result.cohost = monto;
      } catch (e) {
        logger.warn('[pagoHost] cohost:', e?.message || e);
      }
    }
  }

  if (supervisorId && supervisorId !== hostId && supervisorId !== coHostId) {
    const monto = Math.floor(pagoHost * FRAC_SUPERVISOR);
    if (monto > 0) {
      try {
        await agregarSaldo(supervisorId, monto, {
          tipo: 'PAGO_SUPERVISOR',
          motivo: `Pago supervisor sesion (${duracionMinutos} min)`
        });
        result.supervisor = monto;
      } catch (e) {
        logger.warn('[pagoHost] supervisor:', e?.message || e);
      }
    }
  }

  return result;
}

export { calcularPagoHost, MIN_MINUTOS, BASE_HOST };
