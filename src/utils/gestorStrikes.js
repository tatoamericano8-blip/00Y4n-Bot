import { getFromDb, setInDb } from './database.js';
import { randomBytes } from 'crypto';

const KEY_STRIKES = (guildId) => `strikes:comunidad:${guildId}`;

/**
 * Obtener todos los strikes de un servidor
 */
export async function obtenerTodosLosStrikes(guildId) {
    return await getFromDb(KEY_STRIKES(guildId), {});
}

/**
 * Obtener strikes de un usuario (activos e inactivos)
 */
export async function obtenerStrikesUsuario(guildId, userId) {
    const todos = await obtenerTodosLosStrikes(guildId);
    const delUsuario = todos[userId] || [];
    return Array.isArray(delUsuario) ? delUsuario : [];
}

/**
 * Obtener solo strikes activos de un usuario
 */
export async function obtenerStrikesActivos(guildId, userId) {
    const strikes = await obtenerStrikesUsuario(guildId, userId);
    return strikes.filter(s => s.activo);
}

/**
 * Generar ID único de strike (ej: STR-A1B2C3)
 */
export function generarIDStrike() {
    return `STR-${randomBytes(3).toString('hex').toUpperCase()}`;
}

/**
 * Aplicar un strike a un usuario
 */
export async function aplicarStrike(guildId, userId, datos) {
    const todos = await obtenerTodosLosStrikes(guildId);
    if (!todos[userId]) todos[userId] = [];

    const strike = {
        id: datos.id || generarIDStrike(),
        regulacion: datos.regulacion,
        motivo: datos.motivo,
        aplicadoPor: datos.aplicadoPor,
        activo: true,
        fecha: new Date().toISOString()
    };

    todos[userId].push(strike);
    await setInDb(KEY_STRIKES(guildId), todos);
    return strike;
}

/**
 * Remover (desactivar) un strike por ID
 */
export async function removerStrike(guildId, userId, strikeId, removidoPor, motivoRemocion) {
    const todos = await obtenerTodosLosStrikes(guildId);
    const lista = todos[userId] || [];
    const strike = lista.find(s => s.id === strikeId && s.activo);

    if (!strike) return null;

    strike.activo = false;
    strike.removidoPor = removidoPor;
    strike.motivoRemocion = motivoRemocion;
    strike.fechaRemocion = new Date().toISOString();

    await setInDb(KEY_STRIKES(guildId), todos);
    return strike;
}

/**
 * Buscar un strike activo por ID en todo el servidor (útil si no se sabe el userId)
 */
export async function buscarStrikePorId(guildId, strikeId) {
    const todos = await obtenerTodosLosStrikes(guildId);
    for (const [userId, lista] of Object.entries(todos)) {
        if (!Array.isArray(lista)) continue;
        const found = lista.find(s => s.id === strikeId);
        if (found) return { userId, strike: found };
    }
    return null;
}
