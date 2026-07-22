import { getFromDb, setInDb } from './database.js'; // Ajusta la ruta si es necesario

export const cooldownsWork = new Map();
export const saldosDB = new Map(); // Variable de compatibilidad para evitar crash al iniciar

/**
 * Obtener el saldo de un usuario desde PostgreSQL
 */
export async function obtenerSaldo(usuarioId) {
    const key = `economy:${usuarioId}`;
    return await getFromDb(key, 0);
}

/**
 * Agregar saldo a un usuario en PostgreSQL
 */
export async function agregarSaldo(usuarioId, cantidad) {
    const saldoActual = await obtenerSaldo(usuarioId);
    const nuevoSaldo = saldoActual + cantidad;
    const key = `economy:${usuarioId}`;
    await setInDb(key, nuevoSaldo);
    return nuevoSaldo;
}

/**
 * Restar saldo a un usuario en PostgreSQL
 */
export async function restarSaldo(usuarioId, cantidad) {
    const saldoActual = await obtenerSaldo(usuarioId);
    if (saldoActual < cantidad) return false;
    
    const nuevoSaldo = saldoActual - cantidad;
    const key = `economy:${usuarioId}`;
    await setInDb(key, nuevoSaldo);
    return true;
}
