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
        // 1. Limpiar memoria local
        saldosDB.clear();

        // 2. Borrar datos en MongoDB de forma segura
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            // Intentar borrar en todos los modelos cargados de Mongoose
            for (const modelName of Object.keys(mongoose.models)) {
                try {
                    await mongoose.models[modelName].deleteMany({
                        $or: [
                            { key: { $regex: '^economy:' } },
                            { _id: { $regex: '^economy:' } }
                        ]
                    });
                } catch (e) {
                    // Ignorar modelos que no compartan este esquema
                }
            }

            // Intentar borrar directamente en las colecciones nativas de la BD
            if (mongoose.connection.db) {
                const collections = await mongoose.connection.db.collections().catch(() => []);
                for (const col of collections) {
                    try {
                        await col.deleteMany({
                            $or: [
                                { key: { $regex: '^economy:' } },
                                { _id: { $regex: '^economy:' } }
                            ]
                        });
                    } catch (e) {
                        // Ignorar errores de índices o colecciones del sistema
                    }
                }
            }
        }
        return true;
    } catch (error) {
        console.error('Error al resetear la economía en la base de datos:', error);
        throw error;
    }
}
