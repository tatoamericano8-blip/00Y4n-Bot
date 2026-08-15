import { EmbedBuilder } from 'discord.js';
import { getTicketData, saveTicketData } from '../../utils/database.js';
import { logger } from '../../utils/logger.js';
import { getColor } from '../../config/bot.js';
import { getGuildConfig } from '../../services/guildConfig.js';

const STAR_LABELS = {
    '1': '⭐ 1 — Malo',
    '2': '⭐⭐ 2 — Bajo',
    '3': '⭐⭐⭐ 3 — Regular',
    '4': '⭐⭐⭐⭐ 4 — Bueno',
    '5': '⭐⭐⭐⭐⭐ 5 — Excelente',
};

const feedbackHandler = {
    name: 'ticket_feedback',

    async execute(interaction, client, args) {
        const [guildId, channelId, ratingStr] = args;

        if (!guildId || !channelId || !ratingStr) {
            await interaction.update({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('⚠️ Enlace de feedback inválido')
                        .setDescription('Este enlace de feedback no es válido.')
                        .setColor(getColor('error')),
                ],
                components: [],
            });
            return;
        }

        let ticketData;
        try {
            ticketData = await getTicketData(guildId, channelId);
        } catch (err) {
            logger.warn('ticketFeedback: failed to load ticket data', { guildId, channelId, error: err.message });
        }

        if (!ticketData) {
            await interaction.update({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('⚠️ Ticket no encontrado')
                        .setDescription('No se encontró el ticket de esta encuesta.')
                        .setColor(getColor('error')),
                ],
                components: [],
            });
            return;
        }

        if (interaction.user.id !== ticketData.userId) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ No permitido')
                        .setDescription('Solo el creador del ticket puede calificar.')
                        .setColor(getColor('error')),
                ],
                ephemeral: true,
            });
            return;
        }

        if (ticketData.feedback?.rating) {
            await interaction.update({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('✅ Ya enviado')
                        .setDescription(`Ya calificaste este ticket **${STAR_LABELS[String(ticketData.feedback.rating)] || ticketData.feedback.rating}**.\n¡Gracias por tu opinión!`)
                        .setColor(getColor('success')),
                ],
                components: [],
            });
            return;
        }

        const rating = parseInt(ratingStr, 10);
        const ratingLabel = STAR_LABELS[String(rating)] || `⭐ ${rating}`;

        try {
            ticketData.feedback = {
                rating,
                submittedAt: new Date().toISOString(),
                userId: interaction.user.id,
            };
            await saveTicketData(guildId, channelId, ticketData);
        } catch (err) {
            logger.error('ticketFeedback: failed to save feedback', { guildId, channelId, rating, error: err.message });
        }

        try {
            const guildConfig = await getGuildConfig(client, guildId);
            if (guildConfig?.ticketLogsChannelId) {
                const logsChannel = await client.channels.fetch(guildConfig.ticketLogsChannelId).catch(() => null);
                if (logsChannel && logsChannel.isSendable()) {
                    const feedbackEmbed = new EmbedBuilder()
                        .setTitle('📋 Feedback de ticket recibido')
                        .setDescription('Un usuario envió feedback de un ticket')
                        .setColor(getColor('info'))
                        .addFields(
                            { name: 'Ticket ID', value: `\`${channelId}\``, inline: true },
                            { name: 'Calificación', value: ratingLabel, inline: true },
                            { name: 'Usuario', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Enviado', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                        )
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .setFooter({ text: `User ID: ${interaction.user.id}` })
                        .setTimestamp();

                    await logsChannel.send({ embeds: [feedbackEmbed] });
                }
            }
        } catch (err) {
            logger.warn('ticketFeedback: failed to send log', { guildId, channelId, error: err.message });
        }

        await interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setTitle('✅ ¡Gracias por tu opinión!')
                    .setDescription(`Calificaste tu experiencia de soporte **${ratingLabel}**.\n\nTu opinión quedó registrada y nos ayuda a mejorar.`)
                    .setColor(getColor('success'))
                    .setFooter({ text: 'Gracias por usar el sistema de soporte.' })
                    .setTimestamp(),
            ],
            components: [],
        });

        logger.info('Ticket feedback submitted', {
            guildId,
            channelId,
            userId: interaction.user.id,
            rating,
        });
    },
};

const declineHandler = {
    name: 'ticket_feedback_decline',

    async execute(interaction) {
        await interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setTitle('👋 ¡Sin problema!')
                    .setDescription('Podés volver a abrir un ticket si necesitás más ayuda.')
                    .setColor(getColor('default')),
            ],
            components: [],
        });
    },
};

export default [feedbackHandler, declineHandler];
