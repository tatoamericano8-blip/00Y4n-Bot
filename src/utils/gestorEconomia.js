import { getFromDb, setInDb } from './database.js';
import mongoose from 'mongoose';
import { registrarMovimiento } from './gestorAuditoriaFinanciera.js';
import { logger } from './logger.js';

export const cooldownsWork = new Map();
export const saldosDB = new Map();

/** Clave única de economía global (misma para /work, /tienda, /pagar, etc.) */
function economyKey(usuarioId) {
    return `economy:${String(usuarioId)}`;
}

/**
 * Saldo actual en la economía global.
 */
export async function obtenerSaldo(usuarioId) {
    const key = economyKey(usuarioId);
    const saldo = await getFromDb(key, 0);
    const n = Number(saldo);
    return Number.isFinite(n) ? n : 0;
}

/**
 * Persiste el saldo y verifica que quedó guardado.
 * Reintenta 1 vez si la lectura no coincide.
 */
async function guardarSaldoVerificado(usuarioId, nuevoSaldo) {
    const key = economyKey(usuarioId);
    const valor = Math.max(0, Math.floor(Number(nuevoSaldo) || 0));

    const ok = await setInDb(key, valor);
    if (ok === false) {
        throw new Error(`setInDb falló al guardar ${key}`);
    }

    let leido = await obtenerSaldo(usuarioId);
    if (leido !== valor) {
        logger.warn(`[economia] Discrepancia al guardar ${key}: esperado=${valor} leido=${leido}. Reintento.`);
        await setInDb(key, valor);
        leido = await obtenerSaldo(usuarioId);
        if (leido !== valor) {
            throw new Error(`No se pudo persistir el saldo (esperado ${valor}, quedó ${leido})`);
        }
    }
    return leido;
}

/**
 * Agregar saldo. meta opcional: { tipo, motivo, executorId }
 * Devuelve el saldo real leído de la DB después de guardar.
 */
export async function agregarSaldo(usuarioId, cantidad, meta = {}) {
    const uid = String(usuarioId);
    const saldoActual = await obtenerSaldo(uid);
    const monto = Number(cantidad) || 0;
    if (!Number.isFinite(monto) || monto === 0) {
        return saldoActual;
    }

    const nuevoSaldo = Math.max(0, saldoActual + monto);
    const saldoFinal = await guardarSaldoVerificado(uid, nuevoSaldo);

    await registrarMovimiento({
        usuarioId: uid,
        tipo: meta.tipo || (monto >= 0 ? 'INGRESO' : 'EGRESO'),
        monto,
        saldoAnterior: saldoActual,
        saldoNuevo: saldoFinal,
        motivo: meta.motivo || '',
        executorId: meta.executorId ? String(meta.executorId) : null
    }).catch((e) => logger.warn('[economia] auditoria:', e.message));

    return saldoFinal;
}

/**
 * Restar saldo. meta opcional: { tipo, motivo, executorId }
 * Devuelve el saldo real leído de la DB después de guardar.
 */
export async function restarSaldo(usuarioId, cantidad, meta = {}) {
    const uid = String(usuarioId);
    const saldoActual = await obtenerSaldo(uid);
    const monto = Math.abs(Number(cantidad) || 0);
    if (!Number.isFinite(monto) || monto === 0) {
        return saldoActual;
    }

    const nuevoSaldo = Math.max(0, saldoActual - monto);
    const realDescontado = saldoActual - nuevoSaldo;
    const saldoFinal = await guardarSaldoVerificado(uid, nuevoSaldo);

    if (realDescontado !== 0) {
        await registrarMovimiento({
            usuarioId: uid,
            tipo: meta.tipo || 'EGRESO',
            monto: -realDescontado,
            saldoAnterior: saldoActual,
            saldoNuevo: saldoFinal,
            motivo: meta.motivo || '',
            executorId: meta.executorId ? String(meta.executorId) : null
        }).catch((e) => logger.warn('[economia] auditoria:', e.message));
    }

    return saldoFinal;
}

/**
 * Descuenta exactamente `cantidad` solo si hay saldo suficiente.
 * Si no alcanza, no modifica nada y devuelve { ok: false, saldo }.
 */
export async function restarSaldoExacto(usuarioId, cantidad, meta = {}) {
    const uid = String(usuarioId);
    const saldoActual = await obtenerSaldo(uid);
    const monto = Math.abs(Number(cantidad) || 0);
    if (monto <= 0) {
        return { ok: true, saldo: saldoActual, descontado: 0 };
    }
    if (saldoActual < monto) {
        return { ok: false, saldo: saldoActual, descontado: 0 };
    }
    const saldoFinal = await restarSaldo(uid, monto, meta);
    return { ok: true, saldo: saldoFinal, descontado: monto };
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
