import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { logModerationAction } from '../../utils/moderation.js';
import { logger } from '../../utils/logger.js';
import { WarningService } from '../../services/warningService.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Advierte a un usuario (aviso leve).')
        .addUserOption(o =>
            o
                .setName('usuario')
                .setRequired(true)
                .setDescription('Usuario a advertir.')
        )
        .addStringOption(o =>
            o
                .setName('motivo')
                .setRequired(true)
                .setDescription('Motivo de la advertencia.')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    category: 'moderation',

    async execute(interaction, config, client) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction);
        if (!deferSuccess) {
            logger.warn('Warn: falló el defer', {
                userId: interaction.user.id,
                guildId: interaction.guildId
            });
            return;
        }

        try {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                throw new Error('Necesitás el permiso **Moderar Miembros** para advertir.');
            }

            const target = interaction.options.getUser('usuario');
            const member = interaction.options.getMember('usuario');
            const reason = interaction.options.getString('motivo');
            const moderator = interaction.user;
            const guildId = interaction.guildId;

            if (!member) {
                throw new Error('Ese usuario no está en el servidor.');
            }

            if (target.id === interaction.user.id) {
                throw new Error('No podés advertirte a vos mismo.');
            }

            const result = await WarningService.addWarning({
                guildId,
                userId: target.id,
                moderatorId: moderator.id,
                reason,
                timestamp: Date.now()
            });

            if (!result.success) {
                throw new Error('No se pudo guardar la advertencia en la base de datos.');
            }

            const totalWarns = result.totalCount;

            await logModerationAction({
                client,
                guild: interaction.guild,
                event: {
                    action: 'User Warned',
                    target: `${target.tag} (${target.id})`,
                    executor: `${moderator.tag} (${moderator.id})`,
                    reason,
                    metadata: {
                        userId: target.id,
                        moderatorId: moderator.id,
                        totalWarns,
                        warningNumber: totalWarns,
                        warningId: result.id
                    }
                }
            });

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [
                    successEmbed(
                        `⚠️ **Advertido** ${target.tag}`,
                        `**Motivo:** ${reason}\n**Total de advertencias:** ${totalWarns}`
                    )
                ]
            });

            // DM al usuario
            try {
                await target.send({
                    content:
                        `⚠️ Recibiste una **advertencia** en **${interaction.guild.name}**.\n` +
                        `**Motivo:** ${reason}\n` +
                        `**Total:** ${totalWarns}`
                });
            } catch {
                // DMs cerrados
            }
        } catch (error) {
            logger.error('Error en comando warn:', error);
            await handleInteractionError(interaction, error, { subtype: 'warn_failed' });
        }
    }
};
