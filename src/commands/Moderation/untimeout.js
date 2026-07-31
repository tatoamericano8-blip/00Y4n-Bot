import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { ModerationService } from '../../services/moderationService.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Quita el silencio (timeout) de un usuario.')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Usuario al que se le quita el timeout.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('motivo')
                .setDescription('Motivo de la remoción (opcional).')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    category: 'moderation',

    async execute(interaction, config, client) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction);
        if (!deferSuccess) {
            logger.warn('Untimeout: falló el defer', {
                userId: interaction.user.id,
                guildId: interaction.guildId
            });
            return;
        }

        try {
            const targetUser = interaction.options.getUser('usuario');
            const member = interaction.options.getMember('usuario');
            const reason =
                interaction.options.getString('motivo') || 'Timeout removido por un moderador';

            if (!member) {
                throw new Error('Ese usuario no está en el servidor.');
            }

            await ModerationService.removeTimeoutUser({
                guild: interaction.guild,
                member,
                moderator: interaction.member,
                reason
            });

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [
                    successEmbed(
                        `🔓 **Timeout removido** de ${targetUser.tag}`,
                        `**Motivo:** ${reason}`
                    )
                ]
            });
        } catch (error) {
            logger.error('Error en comando untimeout:', error);
            await handleInteractionError(interaction, error, { subtype: 'untimeout_failed' });
        }
    }
};
