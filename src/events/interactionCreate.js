import { Events, MessageFlags } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getGuildConfig } from '../services/guildConfig.js';
import { handleApplicationModal } from '../commands/Community/apply.js';
import { handleApplicationReviewModal } from '../commands/Community/app-admin.js';
import { handleInteractionError, createError, ErrorTypes } from '../utils/errorHandler.js';
import { MessageTemplates } from '../utils/messageTemplates.js';
import { InteractionHelper } from '../utils/interactionHelper.js';
import { createInteractionTraceContext, runWithTraceContext } from '../utils/traceContext.js';
import { validateChatInputPayloadOrThrow } from '../utils/commandInputValidation.js';
import { enforceAbuseProtection, formatCooldownDuration } from '../utils/abuseProtection.js';
import Sesion from '../../models/Session.js';

function withTraceContext(context = {}, traceContext = {}) {
  return {
    traceId: traceContext.traceId,
    guildId: context.guildId || traceContext.guildId,
    userId: context.userId || traceContext.userId,
    command: context.commandName || traceContext.command,
    ...context
  };
}

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    const interactionTraceContext = createInteractionTraceContext(interaction);
    interaction.traceContext = interactionTraceContext;
    interaction.traceId = interactionTraceContext.traceId;

    return runWithTraceContext(interactionTraceContext, async () => {
      try {
        InteractionHelper.patchInteractionResponses(interaction);

        if (interaction.isChatInputCommand()) {
          try {
            logger.info(`Command executed: /${interaction.commandName} by ${interaction.user.tag}`, {
              event: 'interaction.command.received',
              traceId: interactionTraceContext.traceId,
              guildId: interaction.guildId,
              userId: interaction.user?.id,
              command: interaction.commandName
            });

            validateChatInputPayloadOrThrow(interaction, withTraceContext({
              type: 'command_input_validation',
              commandName: interaction.commandName
            }, interactionTraceContext));

            const command = client.commands.get(interaction.commandName);

            if (!command) {
              throw createError(
                `No command matching ${interaction.commandName} was found.`,
                ErrorTypes.CONFIGURATION,
                'Sorry, that command does not exist.',
                withTraceContext({ commandName: interaction.commandName }, interactionTraceContext)
              );
            }

            const abuseProtection = await enforceAbuseProtection(interaction, command, interaction.commandName);
            if (!abuseProtection.allowed) {
              const formattedCooldown = formatCooldownDuration(abuseProtection.remainingMs);
              throw createError(
                `Risky command cooldown active for ${interaction.commandName}`,
                ErrorTypes.RATE_LIMIT,
                `This command is on cooldown. Please wait ${formattedCooldown} before trying again.`,
                withTraceContext({
                  commandName: interaction.commandName,
                  subtype: 'command_cooldown',
                  expected: true,
                  cooldownMs: abuseProtection.remainingMs,
                  cooldownWindowMs: abuseProtection.policy?.windowMs,
                  cooldownMaxAttempts: abuseProtection.policy?.maxAttempts
                }, interactionTraceContext)
              );
            }

            let guildConfig = null;
            if (interaction.guild) {
              guildConfig = await getGuildConfig(client, interaction.guild.id, interactionTraceContext);
              if (guildConfig?.disabledCommands?.[interaction.commandName]) {
                throw createError(
                  `Command ${interaction.commandName} is disabled in this guild`,
                  ErrorTypes.CONFIGURATION,
                  'This command has been disabled for this server.',
                  withTraceContext({ commandName: interaction.commandName, guildId: interaction.guild.id }, interactionTraceContext)
                );
              }
            }

            await command.execute(interaction, guildConfig, client);
          } catch (error) {
            await handleInteractionError(interaction, error, withTraceContext({
              type: 'command',
              commandName: interaction.commandName
            }, interactionTraceContext));
          }

        } else if (interaction.isAutocomplete()) {
          try {
            const command = client.commands?.get(interaction.commandName);
            if (command && typeof command.autocomplete === 'function') {
              await command.autocomplete(interaction);
            } else {
              const focusedOption = interaction.options.getFocused(true);
              if (interaction.commandName === 'apply' && focusedOption.name === 'application') {
                const { getApplicationRoles } = await import('../utils/database.js');
                const roles = await getApplicationRoles(client, interaction.guildId);
                const roleName = interaction.options.getString('application', false);
                const filtered = roles.filter(role =>
                  role.enabled !== false &&
                  role.name.toLowerCase().startsWith(roleName?.toLowerCase() || '')
                );
                await interaction.respond(
                  filtered.slice(0, 25).map(role => ({
                    name: `${role.name}${role.enabled === false ? ' (disabled)' : ''}`,
                    value: role.name
                  }))
                );
              } else if (interaction.commandName === 'app-admin' && focusedOption.name === 'application') {
                const { getApplicationRoles } = await import('../utils/database.js');
                const roles = await getApplicationRoles(client, interaction.guildId);
                const appName = interaction.options.getString('application', false);
                const filtered = roles.filter(role =>
                  role.name.toLowerCase().startsWith(appName?.toLowerCase() || '')
                );
                await interaction.respond(
                  filtered.slice(0, 25).map(role => ({
                    name: `${role.name}${role.enabled === false ? ' (disabled)' : ''}`,
                    value: role.name
                  }))
                );
              } else {
                await interaction.respond([]);
              }
            }
          } catch (error) {
            logger.error('Error en autocomplete:', { error: error.message, commandName: interaction.commandName });
            try { await interaction.respond([]); } catch (_) {}
          }

        } else if (interaction.isButton()) {
          if (interaction.customId === 'verificar_voto_swfl') {
            let sesion = global.coleccionSesiones?.get(interaction.message.id);
            if (!sesion) {
              try {
                sesion = await Sesion.findOne({
                  $or: [
                    { idLanzamiento: interaction.message.id },
                    { idInicio: interaction.message.id },
                    { 'reinvitaciones.idMensaje': interaction.message.id }
                  ]
                });
                if (sesion && global.coleccionSesiones) {
                  global.coleccionSesiones.set(interaction.message.id, sesion);
                }
              } catch (dbErr) {
                logger.error(`Error consultando MongoDB en verificar_voto_swfl: ${dbErr.message}`);
              }
            }
            if (!sesion) {
              return await interaction.reply({
                content: '**Error:** No se encontraron los registros de esta sesion activa.',
                flags: MessageFlags.Ephemeral
              });
            }
            if (!sesion.idInicio) {
              return await interaction.reply({
                content: '**Error:** No se encontro el mensaje de inicio asociado a esta sesion.',
                flags: MessageFlags.Ephemeral
              });
            }
            try {
              const msgInicio = await interaction.channel.messages.fetch(sesion.idInicio);
              let haVotado = false;
              for (const reaction of msgInicio.reactions.cache.values()) {
                const usuariosQueVotaron = await reaction.users.fetch();
                if (usuariosQueVotaron.has(interaction.user.id)) {
                  haVotado = true;
                  break;
                }
              }
              if (!haVotado) {
                return await interaction.reply({
                  content: '**No has votado!** Primero debes dejar tu reaccion en el mensaje de inicio.',
                  flags: MessageFlags.Ephemeral
                });
              }
              const embedLink = {
                title: 'Southwest Florida - Enlace de Sesion',
                description: `**Enlace de la Sesion**\nHaz clic [aqui](${sesion.linkSesion}) para unirte.`,
                color: 0x74d4fc
              };
              return await interaction.reply({ embeds: [embedLink], flags: MessageFlags.Ephemeral });
            } catch (error) {
              logger.error(`Error al verificar voto: ${error.message}`);
              return await interaction.reply({
                content: '**Error interno:** No se pudo comprobar tu voto.',
                flags: MessageFlags.Ephemeral
              });
            }
          }

          const customIdRaw = interaction.customId;
          let button = null;
          let args = [];

          if (client.buttons.has(customIdRaw)) {
            button = client.buttons.get(customIdRaw);
            args = [];
          } else if (customIdRaw.split('_').length >= 4) {
            const parts = customIdRaw.split('_');
            const buttonType = parts.slice(0, 3).join('_');
            button = client.buttons.get(buttonType);
            if (button) args = parts.slice(3);
          }
          if (!button && customIdRaw.includes(':')) {
            const [customId, ...colonArgs] = customIdRaw.split(':');
            button = client.buttons.get(customId);
            args = colonArgs;
          }
          if (!button && customIdRaw.includes('_')) {
            const parts = customIdRaw.split('_');
            const buttonType2 = parts.slice(0, 2).join('_');
            button = client.buttons.get(buttonType2) || client.buttons.get(parts[0]);
            if (button) args = parts.slice(parts.length > 2 ? 2 : 1);
          }

          if (button) {
            try {
              await button.execute(interaction, client, args);
              return;
            } catch (error) {
              logger.error(`Error ejecutando boton ${interaction.customId}:`, {
                message: error.message,
                stack: error.stack
              });
              await handleInteractionError(interaction, error, withTraceContext({
                type: 'button',
                customId: interaction.customId,
                handler: 'general'
              }, interactionTraceContext));
              return;
            }
          }
          return;

        } else if (interaction.isStringSelectMenu()) {
          const [customId, ...args] = interaction.customId.split(':');
          const selectMenu = client.selectMenus.get(customId) || client.selectMenus.get(interaction.customId);
          if (!selectMenu) {
            if (!interaction.customId.includes(':')) return;
            throw createError(
              `No select menu handler found for ${customId}`,
              ErrorTypes.CONFIGURATION,
              'This select menu is not available.',
              withTraceContext({ customId }, interactionTraceContext)
            );
          }
          try {
            await selectMenu.execute(interaction, client, args);
          } catch (error) {
            await handleInteractionError(interaction, error, withTraceContext({
              type: 'select_menu',
              customId: interaction.customId
            }, interactionTraceContext));
          }

        } else if (interaction.isModalSubmit()) {
          if (interaction.customId.startsWith('app_modal_')) {
            try {
              await handleApplicationModal(interaction);
            } catch (error) {
              await handleInteractionError(interaction, error, withTraceContext({
                type: 'modal',
                customId: interaction.customId,
                handler: 'application'
              }, interactionTraceContext));
            }
            return;
          }
          if (interaction.customId.startsWith('app_review_')) {
            try {
              await handleApplicationReviewModal(interaction);
            } catch (error) {
              await handleInteractionError(interaction, error, withTraceContext({
                type: 'modal',
                customId: interaction.customId,
                handler: 'application_review'
              }, interactionTraceContext));
            }
            return;
          }
          if (interaction.customId.startsWith('jtc_')) {
            return;
          }
          const [customId, ...args] = interaction.customId.split(':');
          const modal = client.modals.get(customId) || client.modals.get(interaction.customId);
          if (!modal) {
            if (!interaction.customId.includes(':')) return;
            throw createError(
              `No modal handler found for ${customId}`,
              ErrorTypes.CONFIGURATION,
              'This form is not available.',
              withTraceContext({ customId }, interactionTraceContext)
            );
          }
          try {
            await modal.execute(interaction, client, args);
          } catch (error) {
            await handleInteractionError(interaction, error, withTraceContext({
              type: 'modal',
              customId: interaction.customId,
              handler: 'general'
            }, interactionTraceContext));
          }
        }
      } catch (error) {
        logger.error('Unhandled error in interactionCreate:', {
          event: 'interaction.unhandled_error',
          message: error?.message,
          stack: error?.stack,
          traceId: interactionTraceContext.traceId
        });
        try {
          const ephemeralErrorMessage = {
            embeds: [MessageTemplates.ERRORS.DATABASE_ERROR('processing your interaction')],
            flags: MessageFlags.Ephemeral
          };
          if (interaction.deferred) {
            await interaction.editReply({ embeds: ephemeralErrorMessage.embeds });
          } else if (interaction.replied) {
            await interaction.followUp(ephemeralErrorMessage);
          } else {
            await interaction.reply(ephemeralErrorMessage);
          }
        } catch (replyError) {
          logger.error('Failed to send fallback error response:', { error: replyError });
        }
      }
    });
  }
};
