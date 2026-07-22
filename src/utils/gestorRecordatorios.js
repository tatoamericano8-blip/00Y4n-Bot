import { EmbedBuilder } from 'discord.js';
import { logger } from './logger.js';

/**
 * Envía el recordatorio del estado en el canal especificado.
 * @param {import('discord.js').Client} client 
 * @param {string} channelId 
 */
export async function enviarRecordatorioEstado(client, channelId) {
    try {
        const canal = await client.channels.fetch(channelId);
        if (!canal || !canal.isTextBased()) {
            logger.warn(`[Recordatorio] No se encontró el canal con ID: ${channelId}`);
            return;
        }

        const embedRecordatorio = new EmbedBuilder()
            .setColor('#74d4fc')
            .setDescription('<a:brilla:1523026270911332483> **Recordatorio:** ¡Pónte `/00Y4n` en tu estado de Discord para obtener el rol de **Server Contribuidor**!');

        await canal.send({ embeds: [embedRecordatorio] });
    } catch (error) {
        logger.error('[Recordatorio] Error al enviar el aviso de estado:', error);
    }
}
