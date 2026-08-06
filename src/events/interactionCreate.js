import { Events, MessageFlags } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getGuildConfig } from '../services/guildConfig.js';
import { handleApplicationModal } from '../commands/Community/apply.js';
import { handleInteractionError, createError, ErrorTypes } from '../utils/errorHandler.js';
import { MessageTemplates } from '../utils/messageTemplates.js';
import { InteractionHelper } from '../utils/interactionHelper.js';
import { createInteractionTraceContext, runWithTraceContext } from '../utils/traceContext.js';
import { validateChatInputPayloadOrThrow } from '../utils/commandInputValidation.js';
import { logComandoUsado } from '../utils/logComandoUsado.js';
import { enforceAbuseProtection, formatCooldownDuration } from '../utils/abuseProtection.js';
import Sesion from '../../models/Session.js';
import Historial from '../../models/Historial.js';

function withTraceContext(context = {}, traceContext = null) {
  return {
    ...context,
    traceId: traceContext?.traceId || context.traceId,
    command: context.commandName || traceContext?.command,
    guildId: context.guildId || traceContext?.guildId,
    userId: context.userId || traceContext?.userId
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
              const formattedRemaining = formatRemainingDuration(abuseProtection.remainingMs);
              throw createError(
                `Risky command cooldown active for ${interaction.commandName}`,
                ErrorTypes.RATE_LIMIT,
                `This command is on cooldown. Please wait ${formattedRemaining} before trying again.`,
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
            logComandoUsado(client, interaction, { ok: true }).catch(() => null);
          } catch (error) {
            logComandoUsado(client, interaction, { ok: false, error }).catch(() => null);
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
              await interaction.respond([]).catch(() => null);
            }
          } catch (error) {
            logger.error('Error en autocomplete:', { error: error.message, commandName: interaction.commandName });
            await interaction.respond([]).catch(() => null);
          }
        } else if (interaction.isButton()) {
          try {
            const customId = interaction.customId || '';
            const [name, ...rest] = customId.split(':');
            const args = rest;
            const button = client.buttons?.get(name) || client.buttons?.get(customId);
            if (button?.execute) {
              await button.execute(interaction, client, args);
            }
          } catch (error) {
            await handleInteractionError(interaction, error, withTraceContext({ type: 'button' }, interactionTraceContext));
          }
        } else if (interaction.isAnySelectMenu()) {
          try {
            const customId = interaction.customId || '';
            const [name, ...rest] = customId.split(':');
            const args = rest;
            const selectMenu = client.selectMenus?.get(name) || client.selectMenus?.get(customId);
            if (selectMenu?.execute) {
              await selectMenu.execute(interaction, client, args);
            }
          } catch (error) {
            await handleInteractionError(interaction, error, withTraceContext({ type: 'selectMenu' }, interactionTraceContext));
          }
        } else if (interaction.isModalSubmit()) {
          try {
            if (interaction.customId?.startsWith('application_modal')) {
              return await handleApplicationModal(interaction, client);
            }
            const customId = interaction.customId || '';
            const [name, ...rest] = customId.split(':');
            const args = rest;
            const modal = client.modals?.get(name) || client.modals?.get(customId);
            if (modal?.execute) {
              await modal.execute(interaction, client, args);
            }
          } catch (error) {
            await handleInteractionError(interaction, error, withTraceContext({ type: 'modal' }, interactionTraceContext));
          }
        }
      } catch (error) {
        await handleInteractionError(interaction, error, withTraceContext({ type: 'interaction' }, interactionTraceContext));
      }
    });
  }
};
