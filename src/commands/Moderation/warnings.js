import { getColor } from '../../config/bot.js';
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logEvent } from '../../utils/moderation.js';
import { logger } from '../../utils/logger.js';
import { WarningService } from '../../services/warningService.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Muestra todas las advertencias de un usuario.')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setRequired(true)
                .setDescription('Usuario a consultar.')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    category: 'moderation',

    async execute(interaction, config, client) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction);
        if (!deferSuccess) {
            logger.warn('Warnings: falló el defer', {
                userId: interaction.user.id,
                guildId: interaction.guildId
            });
            return;
        }

        try {
            const target = interaction.options.getUser('usuario');
            const guildId = interaction.guildId;

            const validWarnings = await WarningService.getWarnings(guildId, target.id);
            const totalWarns = validWarnings.length;

            if (totalWarns === 0) {
                await InteractionHelper.safeEditReply(interaction, {
                    embeds: [
                        createEmbed({
                            title: `Advertencias: ${target.tag}`,
                            description: '✅ Este usuario no tiene advertencias registradas.'
                        }).setColor(getColor('success'))
                    ]
                });
                return;
            }

            const embed = createEmbed({
                title: `Advertencias: ${target.tag}`,
                description: `Total de advertencias: **${totalWarns}**`
            }).setColor(getColor('warning'));

            const warningFields = validWarnings
                .map((w, i) => {
                    const discordTimestamp = Math.floor(w.timestamp / 1000);
                    return {
                        name: `[#${i + 1}] Motivo: ${w.reason.substring(0, 100)}`,
                        value: `**Moderador:** <@${w.moderatorId}>\n**Fecha:** <t:${discordTimestamp}:F> (<t:${discordTimestamp}:R>)`,
                        inline: false
                    };
                })
                .slice(0, 25);

            embed.addFields(warningFields);

            await logEvent({
                client,
                guild: interaction.guild,
                event: {
                    action: 'Warnings Viewed',
                    target: `${target.tag} (${target.id})`,
                    executor: `${interaction.user.tag} (${interaction.user.id})`,
                    reason: `Consultó ${totalWarns} advertencias`,
                    metadata: {
                        userId: target.id,
                        moderatorId: interaction.user.id,
                        totalWarnings: totalWarns
                    }
                }
            });

            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        } catch (error) {
            logger.error('Error en comando warnings:', error);
            await handleInteractionError(interaction, error, { subtype: 'warnings_view_failed' });
        }
    }
};
