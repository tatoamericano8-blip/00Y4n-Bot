import { getFromDb, setInDb, deleteFromDb } from './database.js';

const KEY = (guildId) => `heist:activo:${guildId}`;

export async function guardarHeistDb(guildId, heist) {
    const payload = {
        participantes: [...(heist.participantes || [])],
        channelId: heist.channelId,
        leaderId: heist.leaderId,
        fase: heist.fase,
        phaseEndsAt: heist.phaseEndsAt || null,
        updatedAt: new Date().toISOString()
    };
    await setInDb(KEY(guildId), payload);
    return payload;
}

export async function obtenerHeistDb(guildId) {
    const data = await getFromDb(KEY(guildId), null);
    if (!data || typeof data !== 'object') return null;
    return data;
}

export async function borrarHeistDb(guildId) {
    await deleteFromDb(KEY(guildId));
}
