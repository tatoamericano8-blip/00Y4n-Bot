import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getFromDb, setInDb } from './database.js';

const KEY = 'fastpass:links:globales';
const EMOJI_CERRADO = '1536868110571806830';

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
        cerrado: false,
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

/** Deshabilita el boton del FastPass (estilo Early Access Closed). */
export async function cerrarFastPassesDeGuild(client, guildId, channelId = null) {
    const all = await loadAll();
    let cerrados = 0;

    for (const [messageId, data] of Object.entries(all)) {
        if (!data || typeof data !== 'object') continue;
        if (data.guildId && String(data.guildId) !== String(guildId)) continue;
        if (channelId && data.channelId && String(data.channelId) !== String(channelId)) continue;
        if (data.cerrado) continue;

        try {
            const chId = data.channelId;
            if (!chId) continue;

            const channel = await client.channels.fetch(chId).catch(() => null);
            if (!channel || !channel.messages) continue;

            const msg = await channel.messages.fetch(messageId).catch(() => null);
            if (!msg) {
                all[messageId] = {
                    ...data,
                    cerrado: true,
                    cerradoEn: new Date().toISOString()
                };
                if (global.coleccionFastPass) global.coleccionFastPass.delete(messageId);
                cerrados++;
                continue;
            }

            const filaCerrada = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('verificar_fastpass_swfl')
                    .setLabel('FastPass Cerrado')
                    .setEmoji(EMOJI_CERRADO)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

            await msg.edit({ components: [filaCerrada] });

            all[messageId] = {
                ...data,
                cerrado: true,
                cerradoEn: new Date().toISOString()
            };
            if (global.coleccionFastPass) global.coleccionFastPass.delete(messageId);
            cerrados++;
        } catch (err) {
            console.error(`[fastpass] Error cerrando mensaje ${messageId}:`, err?.message || err);
        }
    }

    await setInDb(KEY, all);
    return cerrados;
}
