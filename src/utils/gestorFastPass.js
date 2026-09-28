import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getFromDb, setInDb } from './database.js';
import { EMOJI_DEF } from '../config/emojis.js';

const KEY = 'fastpass:links:globales';

async function loadAll() {
    const data = await getFromDb(KEY, {});
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

export async function guardarFastPass(messageId, datos) {
    const all = await loadAll();
    all[String(messageId)] = {
        link: datos.link,
        guildId: datos.guildId ? String(datos.guildId) : null,
        channelId: datos.channelId ? String(datos.channelId) : null,
        por: datos.por || null,
        cerrado: false,
        fecha: new Date().toISOString()
    };
    await setInDb(KEY, all);
    return all[String(messageId)];
}

export async function obtenerFastPass(messageId) {
    const all = await loadAll();
    return all[String(messageId)] || null;
}

export async function eliminarFastPass(messageId) {
    const all = await loadAll();
    const id = String(messageId);
    if (!all[id]) return null;
    const copia = all[id];
    delete all[id];
    await setInDb(KEY, all);
    return copia;
}

function filaBotonCerrado() {
    const btn = new ButtonBuilder()
        .setCustomId('verificar_fastpass_swfl')
        .setLabel('FastPass Cerrado')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
    try {
        if (EMOJI_DEF?.lock?.id) btn.setEmoji(EMOJI_DEF.lock.id);
    } catch (_) {}
    return new ActionRowBuilder().addComponents(btn);
}

function mensajeTieneFastPassActivo(msg) {
    if (!msg?.components?.length) return false;
    for (const row of msg.components) {
        const comps = row.components || [];
        for (const c of comps) {
            if (c.customId === 'verificar_fastpass_swfl' && !c.disabled) return true;
        }
    }
    return false;
}

async function deshabilitarMensaje(msg, all, dataExtra = {}) {
    const messageId = String(msg.id);
    try {
        await msg.edit({ components: [filaBotonCerrado()] });
    } catch (err) {
        console.error(`[fastpass] No se pudo editar mensaje ${messageId}:`, err?.message || err);
        return false;
    }
    const prev = all[messageId] || {};
    all[messageId] = {
        ...prev,
        ...dataExtra,
        guildId: dataExtra.guildId || prev.guildId || null,
        channelId: dataExtra.channelId || prev.channelId || (msg.channelId ? String(msg.channelId) : null),
        cerrado: true,
        cerradoEn: new Date().toISOString()
    };
    if (global.coleccionFastPass) global.coleccionFastPass.delete(messageId);
    return true;
}

/**
 * Deshabilita el botón FastPass en todos los mensajes abiertos del guild.
 * 1) Registros en DB
 * 2) Fallback: escanea mensajes recientes en canales de texto del servidor
 */
export async function cerrarFastPassesDeGuild(client, guildId, channelId = null) {
    const all = await loadAll();
    let cerrados = 0;
    const yaProcesados = new Set();
    const gid = String(guildId);

    // 1) Desde DB
    for (const [messageId, data] of Object.entries(all)) {
        if (!data || typeof data !== 'object') continue;
        if (data.guildId && String(data.guildId) !== gid) continue;
        if (channelId && data.channelId && String(data.channelId) !== String(channelId)) continue;
        if (data.cerrado) continue;

        const chId = data.channelId;
        if (!chId) continue;

        try {
            const channel = await client.channels.fetch(chId).catch(() => null);
            if (!channel?.messages) {
                all[messageId] = { ...data, cerrado: true, cerradoEn: new Date().toISOString() };
                if (global.coleccionFastPass) global.coleccionFastPass.delete(messageId);
                cerrados++;
                yaProcesados.add(messageId);
                continue;
            }

            const msg = await channel.messages.fetch(messageId).catch(() => null);
            if (!msg) {
                all[messageId] = { ...data, cerrado: true, cerradoEn: new Date().toISOString() };
                if (global.coleccionFastPass) global.coleccionFastPass.delete(messageId);
                cerrados++;
                yaProcesados.add(messageId);
                continue;
            }

            if (await deshabilitarMensaje(msg, all, data)) {
                cerrados++;
                yaProcesados.add(messageId);
            }
        } catch (err) {
            console.error(`[fastpass] Error cerrando mensaje ${messageId}:`, err?.message || err);
        }
    }

    // 2) Fallback: escanear canales
    try {
        const guild = client.guilds.cache.get(gid) || (await client.guilds.fetch(gid).catch(() => null));
        if (guild) {
            let channels = [];
            if (channelId) {
                const ch = await client.channels.fetch(channelId).catch(() => null);
                if (ch) channels = [ch];
            }
            if (!channels.length) {
                channels = [...guild.channels.cache.values()].filter(
                    (c) => c && typeof c.isTextBased === 'function' && c.isTextBased() && c.viewable !== false
                );
            }

            for (const channel of channels) {
                try {
                    if (!channel.messages) continue;
                    const messages = await channel.messages.fetch({ limit: 40 }).catch(() => null);
                    if (!messages) continue;
                    for (const msg of messages.values()) {
                        const mid = String(msg.id);
                        if (yaProcesados.has(mid)) continue;
                        if (!mensajeTieneFastPassActivo(msg)) continue;
                        if (await deshabilitarMensaje(msg, all, { guildId: gid, channelId: String(channel.id) })) {
                            cerrados++;
                            yaProcesados.add(mid);
                        }
                    }
                } catch (err) {
                    console.error(`[fastpass] Error escaneando canal ${channel.id}:`, err?.message || err);
                }
            }
        }
    } catch (err) {
        console.error('[fastpass] Error en fallback de escaneo:', err?.message || err);
    }

    await setInDb(KEY, all);
    return cerrados;
}
