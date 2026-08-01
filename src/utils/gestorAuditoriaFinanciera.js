import { getFromDb, setInDb } from './database.js';

const KEY = (userId) => `economy:audit:${userId}`;
const MAX_ENTRIES = 100;

/**
 * Registra un movimiento financiero para auditoría.
 */
export async function registrarMovimiento({
  usuarioId,
  tipo,
  monto,
  saldoAnterior,
  saldoNuevo,
  motivo = '',
  executorId = null,
  extra = {}
}) {
  if (!usuarioId) return;
  try {
    const lista = await getFromDb(KEY(usuarioId), []);
    const arr = Array.isArray(lista) ? lista : [];
    arr.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tipo: String(tipo || 'DESCONOCIDO'),
      monto: Number(monto) || 0,
      saldoAnterior: Number(saldoAnterior) || 0,
      saldoNuevo: Number(saldoNuevo) || 0,
      motivo: String(motivo || ''),
      executorId: executorId || null,
      extra,
      fecha: new Date().toISOString()
    });
    await setInDb(KEY(usuarioId), arr.slice(0, MAX_ENTRIES));
  } catch (e) {
    console.error('Error registrando movimiento financiero:', e.message);
  }
}

export async function obtenerHistorialFinanciero(usuarioId, limite = 25) {
  const lista = await getFromDb(KEY(usuarioId), []);
  const arr = Array.isArray(lista) ? lista : [];
  return arr.slice(0, limite);
}
