import { getFromDb, setInDb } from './database.js';

const KEY_BLACKLIST = (guildId) => `staff:blacklist:${guildId}`;

export async function estaEnBlacklistStaff(guildId, userId) {
  const lista = await getFromDb(KEY_BLACKLIST(guildId), []);
  return Array.isArray(lista) && lista.some((e) => e.userId === userId);
}

export async function agregarBlacklistStaff(guildId, entry) {
  const lista = await getFromDb(KEY_BLACKLIST(guildId), []);
  const arr = Array.isArray(lista) ? lista : [];
  if (arr.some((e) => e.userId === entry.userId)) return arr;
  arr.push(entry);
  await setInDb(KEY_BLACKLIST(guildId), arr);
  return arr;
}

export async function removerBlacklistStaff(guildId, userId) {
  const lista = await getFromDb(KEY_BLACKLIST(guildId), []);
  const arr = Array.isArray(lista) ? lista : [];
  const next = arr.filter((e) => e.userId !== userId);
  await setInDb(KEY_BLACKLIST(guildId), next);
  return next;
}

export async function listarBlacklistStaff(guildId) {
  const lista = await getFromDb(KEY_BLACKLIST(guildId), []);
  return Array.isArray(lista) ? lista : [];
}
