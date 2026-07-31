import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';
import { logModerationAction } from '../../utils/moderation.js';
import { logger } from '../../utils/logger.js';
import { TitanBotError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const durationChoices = [
    { name: '5 minutos', value: 5 },
    { name: '10 minutos', value: 10 },
    { name: '30 minutos', value: 30 },
    { name: '1 hora', value: 60 },
    { name: '6 horas', value: 360 },
    { name: '1 día', value: 1440 },
    { name: '1 semana', value: 10080 }
];

export default {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Silencia temporalmente a un usuario (timeout).')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Usuario a silenciar.')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('duracion')
                .setDescription('Duración del silencio.')
                .setRequired(true)
                .addChoices(...durationChoices)
        )
        .addStringOption(option =>
            option
                .setName('motivo')
                .setDescription('Motivo del timeout.')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    category: 'moderation',

    async execute(interaction, config, client) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction);
        if (!deferSuccess) {
            logger.warn('Timeout: falló el defer', {
                userId: interaction.user.id,
                guildId: interaction.guildId
            });
            return;
        }

        try {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                throw new TitanBotError(
                    'Sin permiso',
                    ErrorTypes.PERMISSION,
                    'Necesitás el permiso **Moderar Miembros** para usar timeout.'
                );
            }

            const targetUser = interaction.options.getUser('usuario');
            const member = interaction.options.getMember('usuario');
            const durationMinutes = interaction.options.getInteger('duracion');
            const reason = interaction.options.getString('motivo') || 'Sin motivo especificado';

            if (targetUser.id === interaction.user.id) {
                throw new TitanBotError(
                    'Auto-timeout',
                    ErrorTypes.VALIDATION,
                    'No podés silenciarte a vos mismo.'
                );
            }
            if (targetUser.id === client.user.id) {
                throw new TitanBotError(
                    'Timeout al bot',
                    ErrorTypes.VALIDATION,
                    'No podés silenciar al bot.'
                );
            }
            if (!member) {
                throw new TitanBotError(
                    'Usuario no encontrado',
                    ErrorTypes.USER_INPUT,
                    'Ese usuario no está en el servidor.'
                );
            }
            if (!member.moderatable) {
                throw new TitanBotError(
                    'No moderable',
                    ErrorTypes.PERMISSION,
                    'No puedo silenciar a este usuario. Puede tener un rol más alto que el mío o el tuyo.'
                );
            }

            const durationMs = durationMinutes * 60 * 1000;
            await member.timeout(durationMs, reason);

            const durationDisplay =
                durationChoices.find(c => c.value === durationMinutes)?.name ||
                `${durationMinutes} minutos`;

            const caseId = await logModerationAction({
                client,
                guild: interaction.guild,
                event: {
                    action: 'Member Timed Out',
                    target: `${targetUser.tag} (${targetUser.id})`,
                    executor: `${interaction.user.tag} (${interaction.user.id})`,
                    reason: `${reason}\nDuración: ${durationDisplay}`,
                    duration: durationDisplay,
                    metadata: {
                        userId: targetUser.id,
                        moderatorId: interaction.user.id,
                        durationMinutes,
                        timeoutEnds: new Date(Date.now() + durationMs).toISOString()
                    }
                }
            });

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [
                    successEmbed(
                        `⏳ **Silenciado** ${targetUser.tag} por ${durationDisplay}.`,
                        `**Motivo:** ${reason}\n**Caso:** #${caseId}`
                    )
                ]
            });
        } catch (error) {
            logger.error('Error en comando timeout:', error);
            await InteractionHelper.safeEditReply(interaction, {
                embeds: [
                    errorEmbed(
                        error.userMessage ||
                            'Ocurrió un error al aplicar el timeout. Revisá los permisos del bot.'
                    )
                ]
            });
        }
    }
};
