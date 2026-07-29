import { getFromDb, setInDb } from './database.js'; // Ajusta la ruta si es necesario

export const cooldownsWork = new Map();
export const saldosDB = new Map(); // Variable de compatibilidad

/**
 * Obtener el saldo de un usuario desde la Base de Datos
 */
export async function obtenerSaldo(usuarioId) {
    const key = `economy:${usuarioId}`;
    const saldo = await getFromDb(key, 0);
    return Number(saldo) || 0;
}

/**
 * Agregar saldo a un usuario
 */
export async function agregarSaldo(usuarioId, cantidad) {
    const saldoActual = await obtenerSaldo(usuarioId);
    const monto = Number(cantidad) || 0;
    const nuevoSaldo = saldoActual + monto;
    const key = `economy:${usuarioId}`;
    await setInDb(key, nuevoSaldo);
    return nuevoSaldo;
}

/**
 * Restar saldo a un usuario (evitando saldos negativos)
 */
export async function restarSaldo(usuarioId, cantidad) {
    const saldoActual = await obtenerSaldo(usuarioId);
    const monto = Number(cantidad) || 0;
    const nuevoSaldo = Math.max(0, saldoActual - monto);
    const key = `economy:${usuarioId}`;
    await setInDb(key, nuevoSaldo);
    return nuevoSaldo;
}
