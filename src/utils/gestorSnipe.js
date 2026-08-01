/** Cache del último mensaje borrado por canal (para /snipe) */
const snipes = new Map();

/** Cache de mensajes recientes por canal (para recuperar contenido si Discord manda partial) */
const recentMessages = new Map();
const MAX_RECENT_PER_CHANNEL = 50;

export function cachearMensaje(message) {
  if (!message?.channel?.id || !message.id) return;
  if (message.author?.bot) return;

  const channelId = message.channel.id;
  if (!recentMessages.has(channelId)) recentMessages.set(channelId, new Map());
  const map = recentMessages.get(channelId);

  map.set(message.id, {
    content: message.content || '',
    authorId: message.author?.id,
    authorTag: message.author?.tag,
    authorAvatar: message.author?.displayAvatarURL?.({ size: 64 }) || null,
    createdAt: message.createdTimestamp || Date.now()
  });

  // Limitar tamaño
  if (map.size > MAX_RECENT_PER_CHANNEL) {
    const firstKey = map.keys().next().value;
    map.delete(firstKey);
  }
}

export function obtenerMensajeCacheado(channelId, messageId) {
  return recentMessages.get(channelId)?.get(messageId) || null;
}

export function guardarSnipe(channelId, data) {
  snipes.set(channelId, {
    ...data,
    guardadoEn: Date.now()
  });
}

export function obtenerSnipe(channelId) {
  const data = snipes.get(channelId);
  if (!data) return null;
  // Expira a los 60 minutos
  if (Date.now() - data.guardadoEn > 60 * 60 * 1000) {
    snipes.delete(channelId);
    return null;
  }
  return data;
}

export function limpiarSnipe(channelId) {
  snipes.delete(channelId);
}
