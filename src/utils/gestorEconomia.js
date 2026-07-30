import { getFromDb, setInDb } from './database.js'; // Ajusta la ruta si es necesario
import mongoose from 'mongoose';

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

/**
 * Reiniciar por completo toda la economía a $0
 */
export async function resetearTodaLaEconomia() {
    try {
        // Limpiar la memoria local si aplica
        saldosDB.clear();

        // Borrar todos los registros con clave 'economy:*' en la BD de MongoDB
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            const collections = await mongoose.connection.db.collections();
            for (const collection of collections) {
                await collection.deleteMany({
                    $or: [
                        { key: { $regex: '^economy:' } },
                        { _id: { $regex: '^economy:' } }
                    ]
                });
            }
        }
        return true;
    } catch (error) {
        console.error('Error al resetear la economía en la base de datos:', error);
        throw error;
    }
}
