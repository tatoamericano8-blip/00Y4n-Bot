import { logger } from '../utils/logger.js';
import { logEvent, EVENT_TYPES } from './loggingService.js';

/** Formato: ⤷ ݁⋆ [cantidad] Miembros ⋆ ݁ 〃 */
export const NAME_FORMAT_DEFAULT = '⤷ ݁⋆ {count} {label} ⋆ ݁ 〃';

export const COUNTER_TYPE_CONFIG = {
  members: {
    label: 'Miembros totales',
    channelLabel: 'Miembros',
    baseName: 'Miembros',
    emoji: '👥'
  },
  members_only: {
    label: 'Solo humanos (sin bots)',
    channelLabel: 'Humanos',
    baseName: 'Humanos',
    emoji: '👤'
  },
  bots: {
    label: 'Solo bots',
    channelLabel: 'Bots',
    baseName: 'Bots',
    emoji: '🤖'
  }
};

function getCounterConfig(type) {
  return (
    COUNTER_TYPE_CONFIG[type] || {
      label: 'Desconocido',
      channelLabel: 'Contador',
      baseName: 'Contador',
      emoji: '❓'
    }
  );
}

export function getCounterTypeLabel(type) {
  return getCounterConfig(type).label;
}

export function getCounterBaseName(type) {
  return getCounterConfig(type).baseName;
}

export function getCounterEmoji(type) {
  return getCounterConfig(type).emoji;
}

export function formatCounterChannelName(type, count, customFormat) {
  const cfg = getCounterConfig(type);
  const n = Number(count) || 0;
  const formatted = n.toLocaleString('es-AR');
  const template = customFormat || NAME_FORMAT_DEFAULT;
  return template
    .replace(/\{count\}/g, formatted)
    .replace(/\{label\}/g, cfg.channelLabel)
    .slice(0, 100);
}

export async function getGuildCounterStats(guild) {
  let memberCollection = guild.members.cache;

  try {
    memberCollection = await guild.members.fetch();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(
        `Failed to fetch all guild members for ${guild.id}, using cache only`,
        error
      );
    }
  }

  const botCount = memberCollection.filter((member) => member.user.bot).size;
  const totalCount =
    typeof guild.memberCount === 'number' ? guild.memberCount : memberCollection.size;
  const humanCount = Math.max(totalCount - botCount, 0);

  return {
    totalCount,
    botCount,
    humanCount
  };
}

export async function getCounterCount(guild, type) {
  const stats = await getGuildCounterStats(guild);

  switch (type) {
    case 'members':
      return stats.totalCount;
    case 'bots':
      return stats.botCount;
    case 'members_only':
      return stats.humanCount;
    default:
      return null;
  }
}

function isValidCounterShape(counter) {
  return Boolean(
    counter &&
      typeof counter === 'object' &&
      typeof counter.id === 'string' &&
      counter.id.length > 0 &&
      typeof counter.type === 'string' &&
      typeof counter.channelId === 'string' &&
      counter.channelId.length > 0
  );
}

function normalizeCounter(counter, guildId) {
  const normalized = {
    id: String(counter.id),
    type: String(counter.type),
    channelId: String(counter.channelId),
    guildId: String(counter.guildId || guildId),
    createdAt: counter.createdAt || new Date().toISOString(),
    enabled: typeof counter.enabled === 'boolean' ? counter.enabled : true
  };

  if (counter.updatedAt) normalized.updatedAt = counter.updatedAt;
  if (counter.nameFormat) normalized.nameFormat = String(counter.nameFormat);
  if (counter.categoryId) normalized.categoryId = String(counter.categoryId);

  return normalized;
}

function sanitizeCounters(counters, guildId) {
  if (!Array.isArray(counters)) return [];
  return counters.filter(isValidCounterShape).map((c) => normalizeCounter(c, guildId));
}

export async function updateCounter(client, guild, counter) {
  try {
    if (!counter || !counter.type || !counter.channelId) {
      logger.warn('Skipping invalid counter in updateCounter:', counter);
      return false;
    }

    const { type, channelId } = counter;
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      logger.error('Channel not found for counter:', channelId);
      return false;
    }

    const count = await getCounterCount(guild, type);
    if (count === null) {
      logger.error('Unknown counter type:', type);
      return false;
    }

    const newName = formatCounterChannelName(type, count, counter.nameFormat);

    if (channel.name !== newName) {
      try {
        await channel.setName(newName);

        try {
          await logEvent({
            client,
            guildId: guild.id,
            eventType: EVENT_TYPES.COUNTER_UPDATE,
            data: {
              description: `Contador actualizado: ${getCounterTypeLabel(type)}`,
              channelId: channel.id,
              fields: [
                {
                  name: '📊 Tipo',
                  value: getCounterTypeLabel(type),
                  inline: true
                },
                {
                  name: '🔢 Nuevo valor',
                  value: count.toString(),
                  inline: true
                },
                {
                  name: '📍 Canal',
                  value: channel.toString(),
                  inline: true
                }
              ]
            }
          });
        } catch (error) {
          logger.debug('Error logging counter update:', error);
        }
      } catch (error) {
        logger.error(`Failed to update channel name for ${channel.id}:`, error);
        return false;
      }
    }
    return true;
  } catch (error) {
    logger.error('Error updating counter:', error);
    return false;
  }
}

export async function getServerCounters(client, guildId) {
  try {
    if (!client || !client.db) {
      logger.warn('Database not available for getServerCounters');
      return [];
    }

    const data = await client.db.get(`counters:${guildId}`);

    let counters = [];

    if (data && typeof data === 'object' && data.ok && Array.isArray(data.value)) {
      counters = data.value;
    } else if (Array.isArray(data)) {
      counters = data;
    } else if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        counters = Array.isArray(parsed) ? parsed : [];
      } catch {
        counters = [];
      }
    } else if (data && typeof data === 'object' && !data.ok && isValidCounterShape(data)) {
      counters = [data];
    } else {
      return [];
    }

    return sanitizeCounters(counters, guildId);
  } catch (error) {
    logger.error('Error getting server counters:', error);
    return [];
  }
}

export async function saveServerCounters(client, guildId, counters) {
  try {
    if (!client || !client.db) {
      logger.warn('Database not available for saveServerCounters');
      return false;
    }

    const sanitizedCounters = sanitizeCounters(counters, guildId);
    await client.db.set(`counters:${guildId}`, sanitizedCounters);
    return true;
  } catch (error) {
    logger.error('Error saving server counters:', error);
    return false;
  }
}
