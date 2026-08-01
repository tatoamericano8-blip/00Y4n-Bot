import { getFromDb, setInDb } from './database.js';

const KEY_BLACKLIST = (guildId) => `sesiones:blacklist:${guildId}`;
const KEY_SUSPEND = (guildId) => `sesiones:suspendidos:${guildId}`;

export async function obtenerBlacklistSesiones(guildId) {
  const data = await getFromDb(KEY_BLACKLIST(guildId), {});
  return data && typeof data === 'object' ? data : {};
}

export async function estaEnBlacklistSesiones(guildId, userId) {
  const bl = await obtenerBlacklistSesiones(guildId);
  return !!bl[userId];
}

export async function agregarBlacklistSesiones(guildId, userId, {
  motivo = 'Sin motivo',
  por = null
} = {}) {
  const bl = await obtenerBlacklistSesiones(guildId);
  bl[userId] = {
    motivo,
    por,
    fecha: new Date().toISOString()
  };
  await setInDb(KEY_BLACKLIST(guildId), bl);
  return bl[userId];
}

export async function removerBlacklistSesiones(guildId, userId) {
  const bl = await obtenerBlacklistSesiones(guildId);
  if (!bl[userId]) return null;
  const copia = bl[userId];
  delete bl[userId];
  await setInDb(KEY_BLACKLIST(guildId), bl);
  return copia;
}

export async function obtenerSuspendidos(guildId) {
  const data = await getFromDb(KEY_SUSPEND(guildId), {});
  return data && typeof data === 'object' ? data : {};
}

export async function obtenerSuspension(guildId, userId) {
  const data = await obtenerSuspendidos(guildId);
  const s = data[userId];
  if (!s) return null;
  if (s.hasta && new Date(s.hasta).getTime() <= Date.now()) {
    delete data[userId];
    await setInDb(KEY_SUSPEND(guildId), data);
    return null;
  }
  return s;
}

export async function suspenderSesiones(guildId, userId, {
  dias = 3,
  motivo = 'Sin motivo',
  por = null
} = {}) {
  const data = await obtenerSuspendidos(guildId);
  const hasta = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  data[userId] = {
    motivo,
    por,
    dias,
    desde: new Date().toISOString(),
    hasta: hasta.toISOString()
  };
  await setInDb(KEY_SUSPEND(guildId), data);
  return data[userId];
}

export async function quitarSuspension(guildId, userId) {
  const data = await obtenerSuspendidos(guildId);
  if (!data[userId]) return null;
  const copia = data[userId];
  delete data[userId];
  await setInDb(KEY_SUSPEND(guildId), data);
  return copia;
}

/** Bloquea participar en cualquier actividad de sesión */
export async function puedeUsarSesiones(guildId, userId) {
  if (await estaEnBlacklistSesiones(guildId, userId)) {
    return { ok: false, razon: 'blacklist' };
  }
  const susp = await obtenerSuspension(guildId, userId);
  if (susp) {
    return { ok: false, razon: 'suspendido', hasta: susp.hasta, motivo: susp.motivo };
  }
  return { ok: true };
}

/**
 * Limpia suspensiones vencidas y quita el rol en el guild.
 */
export async function limpiarSuspensionesVencidas(client, roleId) {
  let removidos = 0;
  for (const [guildId, guild] of client.guilds.cache) {
    const data = await obtenerSuspendidos(guildId);
    let cambio = false;
    for (const [userId, info] of Object.entries(data)) {
      if (info.hasta && new Date(info.hasta).getTime() <= Date.now()) {
        delete data[userId];
        cambio = true;
        removidos++;
        try {
          const member = await guild.members.fetch(userId).catch(() => null);
          if (member && roleId) await member.roles.remove(roleId).catch(() => null);
        } catch {}
      }
    }
    if (cambio) await setInDb(KEY_SUSPEND(guildId), data);
  }
  return removidos;
}
