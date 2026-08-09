import { getFromDb, setInDb } from './database.js';

const KEY = 'fastpass:links:globales';

async function loadAll() {
    const data = await getFromDb(KEY, {});
    return data && typeof data === 'object' ? data : {};
}

export async function guardarFastPass(messageId, datos) {
    const all = await loadAll();
    all[messageId] = {
        link: datos.link,
        guildId: datos.guildId || null,
        channelId: datos.channelId || null,
        por: datos.por || null,
        fecha: new Date().toISOString()
    };
    await setInDb(KEY, all);
    return all[messageId];
}

export async function obtenerFastPass(messageId) {
    const all = await loadAll();
    return all[messageId] || null;
}

export async function eliminarFastPass(messageId) {
    const all = await loadAll();
    if (!all[messageId]) return null;
    const copia = all[messageId];
    delete all[messageId];
    await setInDb(KEY, all);
    return copia;
}
