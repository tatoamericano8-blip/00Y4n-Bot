import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { ModerationService } from '../../services/moderationService.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Desbanea a un usuario del servidor.')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Usuario a desbanear (mención o ID).')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('motivo')
                .setDescription('Motivo del desbaneo.')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    category: 'moderation',

    async execute(interaction, config, client) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction);
        if (!deferSuccess) {
            logger.warn('Unban: falló el defer', {
                userId: interaction.user.id,
                guildId: interaction.guildId
            });
            return;
        }

        try {
            const targetUser = interaction.options.getUser('usuario');
            const reason = interaction.options.getString('motivo') || 'Sin motivo especificado';

            const result = await ModerationService.unbanUser({
                guild: interaction.guild,
                user: targetUser,
                moderator: interaction.member,
                reason
            });

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [
                    successEmbed(
                        '✅ Usuario desbaneado',
                        `Se desbaneó a **${targetUser.tag}**.\n\n**Motivo:** ${reason}\n**Caso:** #${result.caseId}`
                    )
                ]
            });
        } catch (error) {
            logger.error('Error en comando unban:', error);
            await handleInteractionError(interaction, error, { subtype: 'unban_failed' });
        }
    }
};
