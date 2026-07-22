import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { agregarSaldo } from './gestorEconomia.js';

// Historias divertidas al estilo SWFL / Sarasota
const historiasOportunidades = [
    "de un lavaplatos del Diner local que te pagó por decirle a los clientes que la sopa era 'especial del chef' y no las sobras de ayer.",
    "de un conductor en Siesta Key que te pagó por cuidarle el lugar de estacionamiento durante 10 minutos.",
    "por ayudar a empujar un vehículo averiado fuera del carril rápido en la Interestatal de Sarasota.",
    "de un fotógrafo de autos de lujo que te dio una propina por mover tu auto para que no arruinara su toma.",
    "por encontrar las llaves perdidas de un Ferrari cerca del centro comercial de Sarasota.",
    "de un mecánico local que te pagó por ir a buscar un repuesto urgente a la tienda de repuestos.",
    "por ayudar a limpiar un choque menor en la avenida principal antes de que llegara la policía de Sarasota."
];

/**
 * Función para lanzar una Oportunidad Económica en un canal específico
 * @param {Client} client Client de Discord
 * @param {string} canalId ID del canal de chat general
 */
export async function lanzarOportunidadEconomica(client, canalId) {
    try {
        const canal = await client.channels.fetch(canalId);
        if (!canal) return;

        // 1. Generar ganancia aleatoria (ej: $1,500 - $6,000)
        const monto = Math.floor(Math.random() * (6000 - 1500 + 1)) + 1500;
        const historia = historiasOportunidades[Math.floor(Math.random() * historiasOportunidades.length)];

        // 2. Crear Embed inicial
        const embedInicial = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<a:est:1523027045532045453>¡Oportunidad Económica!')
            .setDescription(`<a:dinero:1529160799392632832> **$${monto.toLocaleString()}** ${historia}`)
            .setFooter({ 
                text: '00Y4n Comunidad SWFL • Eventos del Chat', 
                iconURL: canal.guild.iconURL() 
            })
            .setTimestamp();

        // 3. Crear Botón de Reclamar
        const botonActivo = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('reclamar_oportunidad')
                .setLabel('Reclamar')
                .setEmoji('💸')
                .setStyle(ButtonStyle.Success)
        );

        // Enviar el mensaje al canal
        const mensaje = await canal.send({
            embeds: [embedInicial],
            components: [botonActivo]
        });

        // 4. Crear recolector (Dura 2 minutos o 1 solo reclamo)
        const collector = mensaje.createMessageComponentCollector({
            filter: (i) => i.customId === 'reclamar_oportunidad',
            time: 120000, // 2 minutos para reclamar
            max: 1        // Solo el PRIMERO gana
        });

        collector.on('collect', async (interaction) => {
            const usuarioId = interaction.user.id;

            // Sumar dinero a la cuenta del ganador
            const nuevoSaldo = await agregarSaldo(usuarioId, monto);

            // Embed actualizado (con el formato de la imagen)
            const embedGanador = EmbedBuilder.from(embedInicial)
                .setDescription(
                    `<a:dinero:1529160799392632832> **$${monto.toLocaleString()}** ${historia}\n\n` +
                    `<:fle:1523041359441952970> **Reclamado por:** <@${usuarioId}> (\`${interaction.user.username}\`)`
                );

            // Botón desactivado (Claimed)
            const botonDesactivado = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('reclamado_done')
                    .setLabel('Reclamado')
                    .setEmoji('1523041298796384418')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

            // Responder al usuario y editar mensaje
            await interaction.update({
                embeds: [embedGanador],
                components: [botonDesactivado]
            });
        });

        collector.on('end', async (collected, reason) => {
            // Si nadie lo reclamó en 2 minutos
            if (collected.size === 0) {
                const embedExpirado = EmbedBuilder.from(embedInicial)
                    .setDescription(`~~💵 **$${monto.toLocaleString()}** ${historia}~~\n\n⏰ *Esta oportunidad ha expirado.*`);

                const botonExpirado = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('expirado_done')
                        .setLabel('Expirado')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );

                await mensaje.edit({
                    embeds: [embedExpirado],
                    components: [botonExpirado]
                }).catch(() => {});
            }
        });

    } catch (error) {
        console.error("Error al lanzar Oportunidad Económica:", error);
    }
}
