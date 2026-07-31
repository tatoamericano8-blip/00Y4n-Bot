import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { ModerationService } from '../../services/moderationService.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banea a un usuario del servidor.')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Usuario a banear.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('motivo')
                .setDescription('Motivo del ban.')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    category: 'moderation',

    async execute(interaction, config, client) {
        try {
            const user = interaction.options.getUser('usuario');
            const reason = interaction.options.getString('motivo') || 'Sin motivo especificado';

            if (user.id === interaction.user.id) {
                throw new Error('No podés banearte a vos mismo.');
            }
            if (user.id === client.user.id) {
                throw new Error('No podés banear al bot.');
            }

            const result = await ModerationService.banUser({
                guild: interaction.guild,
                user,
                moderator: interaction.member,
                reason
            });

            await InteractionHelper.universalReply(interaction, {
                embeds: [
                    successEmbed(
                        `🚫 **Baneado** ${user.tag}`,
                        `**Motivo:** ${reason}\n**Caso:** #${result.caseId}`
                    )
                ]
            });
        } catch (error) {
            logger.error('Error en comando ban:', error);
            await handleInteractionError(interaction, error, { subtype: 'ban_failed' });
        }
    }
};
