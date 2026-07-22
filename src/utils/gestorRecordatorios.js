import { EmbedBuilder } from 'discord.js';
import { logger } from './logger.js';

const CANAL_GENERAL_ID = '1451939726230683753'; // ID de tu canal general
let contadorMensajes = 0;
let ultimoMensajeId = null; // Guardará el ID del último recordatorio enviado

/**
 * Escucha los mensajes enviados en el general y gestiona el recordatorio.
 * @param {import('discord.js').Message} message 
 */
export async function procesarMensajeRecordatorio(message) {
    // Ignorar mensajes de bots o que no sean del canal general
    if (message.author.bot || message.channel.id !== CANAL_GENERAL_ID) return;

    contadorMensajes++;

    // Cuando llega a 11 mensajes
    if (contadorMensajes >= 11) {
        contadorMensajes = 0; // Reiniciamos el contador

        try {
            // 1. Borrar el mensaje anterior si existe en el canal
            if (ultimoMensajeId) {
                try {
                    const mensajeAnterior = await message.channel.messages.fetch(ultimoMensajeId);
                    if (mensajeAnterior) {
                        await mensajeAnterior.delete();
                    }
                } catch (error) {
                    // Si el mensaje anterior ya fue borrado manualmente, solo ignoramos el error
                    logger.warn('[Recordatorio] El mensaje anterior no se encontró o ya fue eliminado.');
                }
            }

            // 2. Crear y enviar el nuevo embed
            const embedRecordatorio = new EmbedBuilder()
                .setColor('#74d4fc')
                .setDescription('<a:est:1523026270911332483> **Recordatorio:** ¡Pónte `/00Y4n` en tu estado de Discord para obtener el rol de **Server Contributor**!');

            const nuevoMensaje = await message.channel.send({ embeds: [embedRecordatorio] });

            // 3. Guardar el ID del nuevo mensaje para eliminarlo la próxima vez
            ultimoMensajeId = nuevoMensaje.id;

        } catch (error) {
            logger.error('[Recordatorio] Error al procesar el recordatorio automático:', error);
        }
    }
}
