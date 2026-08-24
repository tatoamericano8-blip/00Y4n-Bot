import Restriccion from '../../models/Restriccion.js';
import GuildModConfig from '../../models/GuildModConfig.js';
import { PermissionFlagsBits } from 'discord.js';

const NOMBRE_ROL = 'Restringido | 00Y4n';
const COLOR_ROL = 0x992d22;

/**
 * Obtiene o crea el rol de restringido en el guild.
 */
export async function obtenerOCrearRolRestringido(guild) {
  let config = await GuildModConfig.findOne({ guildId: guild.id });
  if (config?.rolRestringidoId) {
    const existing = guild.roles.cache.get(config.rolRestringidoId)
      || await guild.roles.fetch(config.rolRestringidoId).catch(() => null);
    if (existing) return existing;
  }

  let role = guild.roles.cache.find(r => r.name === NOMBRE_ROL);
  if (!role) {
    role = await guild.roles.create({
      name: NOMBRE_ROL,
      color: COLOR_ROL,
      reason: 'Sistema de restricción 00Y4n — no borrar',
      permissions: [],
      mentionable: false,
      hoist: false
    });
  }

  await GuildModConfig.findOneAndUpdate(
    { guildId: guild.id },
    { rolRestringidoId: role.id },
    { upsert: true, new: true }
  );

  return role;
}

export function parseDuracionRestriccion(valor) {
  const map = {
    '1h': 1 * 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    permanente: null
  };
  if (!(valor in map)) return { ok: false };
  if (valor === 'permanente') return { ok: true, permanente: true, expiraEn: null, label: 'Permanente' };
  return {
    ok: true,
    permanente: false,
    expiraEn: new Date(Date.now() + map[valor]),
    label: valor
  };
}

/** Roles que no se deben quitar / no se pueden gestionar */
export function rolesRemovibles(member, botMember, rolRestringidoId) {
  return member.roles.cache.filter(role => {
    if (role.id === member.guild.id) return false;
    if (role.managed) return false;
    if (rolRestringidoId && role.id === rolRestringidoId) return false;
    if (botMember && role.position >= botMember.roles.highest.position) return false;
    return true;
  });
}

export async function obtenerRestriccionActiva(guildId, userId) {
  const r = await Restriccion.findOne({ guildId, userId, activa: true }).sort({ createdAt: -1 });
  if (!r) return null;
  if (!r.permanente && r.expiraEn && r.expiraEn.getTime() <= Date.now()) {
    return null;
  }
  return r;
}

export async function listarRestriccionesVencidas(guildId) {
  return Restriccion.find({
    guildId,
    activa: true,
    permanente: false,
    expiraEn: { $lte: new Date() }
  });
}
