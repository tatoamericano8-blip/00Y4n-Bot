import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { agregarSaldo } from './gestorEconomia.js';
import { PRIMARIO } from './colores.js';

/** Banner de oportunidad (solo imagen) — se envía como primer embed */
const BANNER_OPORTUNIDAD_URL =
    'https://cdn.discordapp.com/attachments/1505017301089652898/1536043756028166155/Oportunidad_Economica_1.png?ex=6a7f3db9&is=6a7dec39&hm=11d83177fd097666ca2b954c59cbf095c1f521f4f851ea4d416819e23fc8a81a&';

const historiasOportunidades = [
    "de un lavaplatos del Diner local que te pagó por decirle a los clientes que la sopa era 'especial del chef' y no las sobras de ayer.",
    "de un conductor en Siesta Key que te pagó por cuidarle el lugar de estacionamiento durante 10 minutos.",
    "por ayudar a empujar un vehículo averiado fuera del carril rápido en la Interestatal de Sarasota.",
    "de un fotógrafo de autos de lujo que te dio una propina por mover tu auto para que no arruinara su toma.",
    "por encontrar las llaves perdidas de un Ferrari cerca del centro comercial de Sarasota.",
    "de un mecánico local que te pagó por ir a buscar un repuesto urgente a la tienda de repuestos.",
    "por ayudar a limpiar un choque menor en la avenida principal antes de que llegara la policía de Sarasota."
];

function crearEmbedBanner() {
    return new EmbedBuilder()
        .setColor(PRIMARIO)
        .setImage(BANNER_OPORTUNIDAD_URL);
}

/**
 * Lanza una Oportunidad Económica en un canal específico.
 * @param {import('discord.js').Client} client
 * @param {string} canalId
 */
export async function lanzarOportunidadEconomica(client, canalId) {
    try {
        const canal = await client.channels.fetch(canalId);
        if (!canal) return;

        // Ganancia aleatoria: $500 – $3.500
        const monto = Math.floor(Math.random() * (3500 - 500 + 1)) + 500;
        const historia = historiasOportunidades[Math.floor(Math.random() * historiasOportunidades.length)];

        const embedBanner = crearEmbedBanner();

        const embedInicial = new EmbedBuilder()
            .setColor(PRIMARIO)
            .setTitle('<a:est:1534954231138746488> ¡Oportunidad Economica!')
            .setDescription(`<:dinero:1534938520861413376> **$${monto.toLocaleString('es-AR')}** ${historia}`)
            .setTimestamp();

        const botonActivo = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('reclamar_oportunidad')
                .setLabel('Reclamar')
                .setEmoji('1534937419231527036')
                .setStyle(ButtonStyle.Secondary)
        );

        const mensaje = await canal.send({
            embeds: [embedBanner, embedInicial],
            components: [botonActivo]
        });

        const collector = mensaje.createMessageComponentCollector({
            filter: (i) => i.customId === 'reclamar_oportunidad',
            time: 120000,
            max: 1
        });

        collector.on('collect', async (interaction) => {
            try {
                const usuarioId = interaction.user.id;
                await agregarSaldo(usuarioId, monto);

                const embedGanador = EmbedBuilder.from(embedInicial)
                    .setColor('#57F287')
                    .setDescription(
                        `<:dinero:1534938520861413376> **$${monto.toLocaleString('es-AR')}** ${historia}\n\n` +
                        `<:fle:1534937306191102125> **Reclamado por:** <@${usuarioId}>`
                    );

                const botonDesactivado = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('reclamado_done')
                        .setLabel('Reclamado')
                        .setEmoji('1534938648665915577')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

                const payload = {
                    embeds: [embedBanner, embedGanador],
                    components: [botonDesactivado]
                };

                if (interaction.deferred) {
                    await interaction.editReply(payload);
                } else if (!interaction.replied) {
                    await interaction.update(payload);
                }
            } catch (error) {
                console.error('Error al procesar el reclamo en el collector:', error);
            }
        });

        collector.on('end', async (collected) => {
            try {
                if (collected.size === 0) {
                    const embedExpirado = EmbedBuilder.from(embedInicial)
                        .setDescription(
                            `~~💵 **$${monto.toLocaleString('es-AR')}** ${historia}~~\n\n` +
                            `⏰ *Esta oportunidad ha expirado.*`
                        );

                    const botonExpirado = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('expirado_done')
                            .setLabel('Expirado')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true)
                    );

                    await mensaje.edit({
                        embeds: [embedBanner, embedExpirado],
                        components: [botonExpirado]
                    }).catch(() => {});
                }
            } catch (error) {
                console.error('Error al finalizar el collector de oportunidades:', error);
            }
        });
    } catch (error) {
        console.error('Error al lanzar Oportunidad Económica:', error);
    }
}
