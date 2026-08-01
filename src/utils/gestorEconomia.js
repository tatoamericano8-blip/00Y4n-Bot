import { getFromDb, setInDb } from './database.js';
import mongoose from 'mongoose';
import { registrarMovimiento } from './gestorAuditoriaFinanciera.js';

export const cooldownsWork = new Map();
export const saldosDB = new Map();

export async function obtenerSaldo(usuarioId) {
    const key = `economy:${usuarioId}`;
    const saldo = await getFromDb(key, 0);
    return Number(saldo) || 0;
}

/**
 * Agregar saldo. meta opcional: { tipo, motivo, executorId }
 */
export async function agregarSaldo(usuarioId, cantidad, meta = {}) {
    const saldoActual = await obtenerSaldo(usuarioId);
    const monto = Number(cantidad) || 0;
    const nuevoSaldo = saldoActual + monto;
    const key = `economy:${usuarioId}`;
    await setInDb(key, nuevoSaldo);

    if (monto !== 0) {
        await registrarMovimiento({
            usuarioId,
            tipo: meta.tipo || 'INGRESO',
            monto,
            saldoAnterior: saldoActual,
            saldoNuevo: nuevoSaldo,
            motivo: meta.motivo || '',
            executorId: meta.executorId || null
        });
    }
    return nuevoSaldo;
}

/**
 * Restar saldo. meta opcional: { tipo, motivo, executorId }
 */
export async function restarSaldo(usuarioId, cantidad, meta = {}) {
    const saldoActual = await obtenerSaldo(usuarioId);
    const monto = Number(cantidad) || 0;
    const nuevoSaldo = Math.max(0, saldoActual - monto);
    const real = saldoActual - nuevoSaldo;
    const key = `economy:${usuarioId}`;
    await setInDb(key, nuevoSaldo);

    if (real !== 0) {
        await registrarMovimiento({
            usuarioId,
            tipo: meta.tipo || 'EGRESO',
            monto: -real,
            saldoAnterior: saldoActual,
            saldoNuevo: nuevoSaldo,
            motivo: meta.motivo || '',
            executorId: meta.executorId || null
        });
    }
    return nuevoSaldo;
}

export async function resetearTodaLaEconomia() {
    try {
        saldosDB.clear();
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            for (const modelName of Object.keys(mongoose.models)) {
                try {
                    await mongoose.models[modelName].deleteMany({
                        $or: [
                            { key: { $regex: '^economy:' } },
                            { _id: { $regex: '^economy:' } }
                        ]
                    });
                } catch (e) {}
            }
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
                    } catch (e) {}
                }
            }
        }
        return true;
    } catch (error) {
        console.error('Error al resetear la economía en la base de datos:', error);
        throw error;
    }
}
