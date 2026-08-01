import { Events } from 'discord.js';
import { logEvent, EVENT_TYPES } from '../services/loggingService.js';
import { logger } from '../utils/logger.js';
import { getReactionRoleMessage, deleteReactionRoleMessage } from '../services/reactionRoleService.js';
import { guardarSnipe } from '../utils/gestorSnipe.js';

const MAX_LOGGED_MESSAGE_CONTENT_LENGTH = 1024;
const ROLE_STAFF = '1512120103771050005';

export default {
  name: Events.MessageDelete,
  once: false,

  async execute(message) {
    try {
      if (!message.guild) return;

      try {
        const reactionRoleData = await getReactionRoleMessage(message.client, message.guild.id, message.id);
        if (reactionRoleData) {
          await deleteReactionRoleMessage(message.client, message.guild.id, message.id);
          logger.info(`Cleaned up reaction role database entry for manually deleted message ${message.id} in guild ${message.guild.id}`);

          try {
            await logEvent({
              client: message.client,
              guildId: message.guild.id,
              eventType: EVENT_TYPES.REACTION_ROLE_DELETE,
              data: {
                description: `Reaction role message was deleted manually and removed from database.`,
                channelId: message.channel?.id,
                fields: [
                  {
                    name: '🗑️ Message ID',
                    value: message.id,
                    inline: true
                  },
                  {
                    name: '📍 Channel',
                    value: message.channel ? `${message.channel.toString()} (${message.channel.id})` : 'Unknown',
                    inline: true
                  },
                  {
                    name: '🧹 Cleanup',
                    value: 'Database entry removed automatically',
                    inline: false
                  }
                ]
              }
            });
          } catch (logCleanupError) {
            logger.warn('Failed to log reaction role cleanup after manual message deletion:', logCleanupError);
          }
        }
      } catch (reactionRoleCleanupError) {
        logger.warn(`Failed to clean up reaction role data for deleted message ${message.id}:`, reactionRoleCleanupError);
      }

      // Snipe: guardar último mensaje borrado del canal (sin bots, solo texto)
      try {
        if (message.author && !message.author.bot && message.channel?.id) {
          // Opcional: no snippear mensajes de staff si el autor tiene el rol
          // (pedido: ignorar staff). Si partial message no tiene member, intentamos cache.
          let esStaff = false;
          try {
            const member =
              message.member ||
              (await message.guild.members.fetch(message.author.id).catch(() => null));
            esStaff = member?.roles?.cache?.has(ROLE_STAFF) || false;
          } catch {}

          if (!esStaff) {
            const content = message.content
              ? message.content.slice(0, 1900)
              : '';
            if (content.trim().length > 0) {
              guardarSnipe(message.channel.id, {
                content,
                authorId: message.author.id,
                authorTag: message.author.tag,
                authorAvatar: message.author.displayAvatarURL?.({ size: 64 }) || null,
                createdAt: message.createdTimestamp || Date.now()
              });
            }
          }
        }
      } catch (snipeErr) {
        logger.warn('No se pudo guardar snipe:', snipeErr.message);
      }

      if (message.author?.bot) return;

      const fields = [];

      if (message.author) {
        fields.push({
          name: '👤 Author',
          value: `${message.author.tag} (${message.author.id})`,
          inline: true
        });
      }

      fields.push({
        name: '💬 Channel',
        value: `${message.channel.toString()} (${message.channel.id})`,
        inline: true
      });

      if (message.content) {
        const content =
          message.content.length > MAX_LOGGED_MESSAGE_CONTENT_LENGTH
            ? message.content.substring(0, MAX_LOGGED_MESSAGE_CONTENT_LENGTH - 3) + '...'
            : message.content;
        fields.push({
          name: '📝 Content',
          value: content || '*(empty message)*',
          inline: false
        });
      }

      fields.push({
        name: '🆔 Message ID',
        value: message.id,
        inline: true
      });

      fields.push({
        name: '📅 Created',
        value: `<t:${Math.floor(message.createdTimestamp / 1000)}:R>`,
        inline: true
      });

      if (message.attachments.size > 0) {
        fields.push({
          name: '📎 Attachments',
          value: message.attachments.size.toString(),
          inline: true
        });
      }

      await logEvent({
        client: message.client,
        guildId: message.guild.id,
        eventType: EVENT_TYPES.MESSAGE_DELETE,
        data: {
          description: `A message was deleted in ${message.channel.toString()}`,
          userId: message.author?.id,
          channelId: message.channel.id,
          fields
        }
      });
    } catch (error) {
      logger.error('Error in messageDelete event:', error);
    }
  }
};
