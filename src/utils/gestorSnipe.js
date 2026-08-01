/** Cache en memoria del último mensaje borrado por canal */
const snipes = new Map();

export function guardarSnipe(channelId, data) {
  snipes.set(channelId, {
    ...data,
    guardadoEn: Date.now()
  });
}

export function obtenerSnipe(channelId) {
  const data = snipes.get(channelId);
  if (!data) return null;
  // Expira a los 30 minutos
  if (Date.now() - data.guardadoEn > 30 * 60 * 1000) {
    snipes.delete(channelId);
    return null;
  }
  return data;
}

export function limpiarSnipe(channelId) {
  snipes.delete(channelId);
}
