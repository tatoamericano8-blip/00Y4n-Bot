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
          // Handle autocomplete interactions
          const focusedOption = interaction.options.getFocused(true);
          
          if (interaction.commandName === 'apply' && focusedOption.name === 'application') {
            try {
              const { getApplicationRoles } = await import('../utils/database.js');
              const roles = await getApplicationRoles(client, interaction.guildId);
              const roleName = interaction.options.getString('application', false);
              
              // Filter: only show enabled applications
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
            } catch (error) {
              logger.error('Error handling autocomplete:', {
                error: error.message,
                guildId: interaction.guildId,
                commandName: interaction.commandName
              });
              await interaction.respond([]);
            }
          } else if (interaction.commandName === 'app-admin' && focusedOption.name === 'application') {
            try {
              const { getApplicationRoles } = await import('../utils/database.js');
              const roles = await getApplicationRoles(client, interaction.guildId);
              const appName = interaction.options.getString('application', false);
              
              // Show all applications (enabled and disabled), but mark disabled ones
              const filtered = roles.filter(role =>
                role.name.toLowerCase().startsWith(appName?.toLowerCase() || '')
              );
              
              await interaction.respond(
                filtered.slice(0, 25).map(role => ({
                  name: `${role.name}${role.enabled === false ? ' (disabled)' : ''}`,
                  value: role.name
                }))
              );
            } catch (error) {
              logger.error('Error handling app-admin autocomplete:', {
                error: error.message,
                guildId: interaction.guildId,
                commandName: interaction.commandName
              });
              await interaction.respond([]);
            }
          } else if (interaction.commandName === 'reactroles' && focusedOption.name === 'panel') {
            try {
              const { getAllReactionRoleMessages, deleteReactionRoleMessage } = await import('../services/reactionRoleService.js');
              const guildId = interaction.guildId;
              const guild = interaction.guild;
              
              let panels = await getAllReactionRoleMessages(client, guildId);
              
              if (!panels || panels.length === 0) {
                await interaction.respond([]);
                return;
              }
              
              // Filter out panels whose messages no longer exist
              const validPanels = [];
              for (const panel of panels) {
                if (!panel.messageId || !panel.channelId) {
                  continue;
                }
                
                const channel = guild.channels.cache.get(panel.channelId);
                if (!channel) {
                  await deleteReactionRoleMessage(client, guildId, panel.messageId).catch(() => {});
                  continue;
                }
                
                const msg = await channel.messages.fetch(panel.messageId).catch(() => null);
                if (!msg) {
                  await deleteReactionRoleMessage(client, guildId, panel.messageId).catch(() => {});
                  continue;
                }
                validPanels.push(panel);
              }
              
              if (validPanels.length === 0) {
                await interaction.respond([]);
                return;
              }
              
              const choices = await Promise.all(
                validPanels.slice(0, 25).map(async panel => {
                  try {
                    const channel = guild.channels.cache.get(panel.channelId);
                    if (!channel) return null;
                    
                    const msg = await channel.messages.fetch(panel.messageId).catch(() => null);
                    if (!msg) return null;
                    
                    const title = msg?.embeds?.[0]?.title ?? 'Untitled Panel';
                    const channelName = channel?.name ?? 'unknown';
                    
                    return {
                      name: `${title} (${channelName})`.substring(0, 100),
                      value: panel.messageId
                    };
                  } catch (e) {
                    return null;
                  }
                })
              );
              
              const validChoices = choices.filter(c => c !== null);
              await interaction.respond(validChoices);
            } catch (error) {
              logger.error(`Error al verificar voto: ${error.message}`);
              await interaction.respond([]);
            }
          }
        } else if (interaction.isButton()) {
          // 00Y4n: Interceptamos el botón de la sesión de SWFL antes de que busque en otros lados
          if (interaction.customId === 'verificar_voto_swfl') {
            const sesion = global.coleccionSesiones?.get(interaction.message.id);
            if (!sesion) {
                return await interaction.reply({
                    content: '<:cruz00y4n:1519476959606734998> **Error:** No se encontraron los registros de esta sesión en la memoria.',
                    ephemeral: true
                });
            }

            try {
                const msgInicio = await interaction.channel.messages.fetch(sesion.idInicio);
                const reaccionTilde = msgInicio.reactions.cache.get('1519476900995666101');

                let haVotado = false;
                if (reaccionTilde) {
                    const usuariosQueVotaron = await reaccionTilde.users.fetch();
                    haVotado = usuariosQueVotaron.has(interaction.user.id);
                }

                if (!haVotado) {
                    return await interaction.reply({
                        content: '<:cruz00y4n:1519476959606734998> **¡No has votado!** Primero debes dejar tu reacción con el tilde naranja en el mensaje de inicio de la sesión para poder acceder al link.',
                        ephemeral: true
                    });
                }

                let tituloEmbed = '<a:caram00y4nmov:1519474823309426699> Southwest Florida - *_Recordatorio de Sesión_* <a:caram00y4nmov:1519474823309426699>';
                let descripcionEmbed = `> <:00y4ncirpunto:1519474782117171392> **Por favor, asegúrate de registrar tu(s) vehículo(s) en <#1516832509222981864>, ¡ya que podrías ser citado o recibir multas por parte de las Fuerzas del Orden!**\n\n**Enlace de la Sesión**\n> <:link00y4n:1519476984932073482> Haz clic [aquí](${sesion.linkSesion}) para unirte.`;

                if (sesion.tipo === 'meet') {
                    tituloEmbed = '<a:caram00y4nmov:1519474823309426699> Southwest Florida - *_Enlace del Car Meet_* <a:caram00y4nmov:1519474823309426699>';
                    descripcionEmbed = `> <:00y4ncirpunto:1519474782117171392> **¡Disfruta del Car Meet Oficial! Recuerda respetar las indicaciones del Staff, ingresar despacio a los spots y mantener una buena conducta.**\n\n**Enlace del Car Meet**\n> <:link00y4n:1519476984932073482> Haz clic [aquí](${sesion.linkSesion}) para unirte.`;
                }

                const embedLink = {
                    title: tituloEmbed,
                    description: descripcionEmbed,
                    color: 0xff6600
                };

                return await interaction.reply({
                    embeds: [embedLink],
                    ephemeral: true
                });

            } catch (error) {
                logger.error(`Error al verificar voto: ${error.message}`);
                return await interaction.reply({
                    content: '<:warn00y4n:1519476933988061295> **Error interno:** No se pudo comprobar tu voto. Asegúrate de que el Startup no haya sido eliminado.',
                    ephemeral: true
                });
            }
          }

          // Check for underscore-delimited button format (e.g., todo_list_item_123)
          const parts = interaction.customId.split('_');
          if (parts.length >= 4) {
            const buttonType = parts.slice(0, 3).join('_');
            const listId = parts[3];
            const button = client.buttons.get(buttonType);

            if (button) {
              try {
                await button.execute(interaction, client, [listId]);
                return;
              } catch (error) {
                await handleInteractionError(interaction, error, withTraceContext({
                  type: 'button',
                  customId: interaction.customId,
                  handler: 'todo'
                }, interactionTraceContext));
                return;
              }
            }
          }

          // Check for colon-delimited button format (e.g., button_name:arg1:arg2)
          const [customId, ...args] = interaction.customId.split(':');
          const button = client.buttons.get(customId);

          if (button) {
            try {
              await button.execute(interaction, client, args);
            } catch (error) {
              await handleInteractionError(interaction, error, withTraceContext({
                type: 'button',
                customId: interaction.customId,
                handler: 'general'
              }, interactionTraceContext));
            }
          } else if (interaction.customId.includes(':')) {
            throw createError(
              `No button handler found for ${customId}`,
              ErrorTypes.CONFIGURATION,
              'This button is not available.',
              withTraceContext({ customId }, interactionTraceContext)
            );
          }
        } else if (interaction.isStringSelectMenu()) {
          const [customId, ...args] = interaction.customId.split(':');
          const selectMenu = client.selectMenus.get(customId);

          if (!selectMenu) {
            if (!interaction.customId.includes(':')) {
              return;
            }

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
            logger.debug(`Skipping modal handler lookup for inline-awaited modal: ${interaction.customId}`, {
              event: 'interaction.modal.inline_skipped',
              traceId: interactionTraceContext.traceId
            });
            return;
          }

          const [customId, ...args] = interaction.customId.split(':');
          const modal = client.modals.get(customId);

          if (!modal) {
            if (!interaction.customId.includes(':')) {
              return;
            }

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
          errorCode: 'INTERACTION_UNHANDLED_ERROR',
          error,
          traceId: interactionTraceContext.traceId,
          interactionId: interaction.id,
          guildId: interaction.guildId,
          userId: interaction.user?.id
        });

        try {
          const ephemeralErrorMessage = {
            embeds: [MessageTemplates.ERRORS.DATABASE_ERROR('processing your interaction')],
            flags: MessageFlags.Ephemeral
          };
          const editErrorMessage = {
            embeds: [MessageTemplates.ERRORS.DATABASE_ERROR('processing your interaction')]
          };

          if (interaction.deferred) {
            await interaction.editReply(editErrorMessage);
          } else if (interaction.replied) {
            await interaction.followUp(ephemeralErrorMessage);
          } else {
            await interaction.reply(ephemeralErrorMessage);
          }
        } catch (replyError) {
          logger.error('Failed to send fallback error response:', {
            event: 'interaction.error_response_failed',
            errorCode: 'INTERACTION_ERROR_RESPONSE_FAILED',
            error: replyError,
            traceId: interactionTraceContext.traceId
          });
        }
      }
    });
  }
};

