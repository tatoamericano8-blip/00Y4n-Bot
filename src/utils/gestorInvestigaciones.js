import Investigacion from '../../models/Investigacion.js';

export const ROL_EQUIPO_PROPIETARIOS = '1528877296977711256';
export const ROL_BAJO_INVESTIGACION = '1548450572489859353';
export const CANAL_LOG_INVESTIGACION = '1505015805891579934';

/**
 * Roles que se pueden quitar al iniciar investigación.
 * No incluye @everyone, roles managed ni roles >= al del bot.
 */
export function rolesRemoviblesInvestigacion(member, botMember, rolInvestigacionId) {
  return member.roles.cache.filter((role) => {
    if (role.id === member.guild.id) return false;
    if (role.managed) return false;
    if (rolInvestigacionId && role.id === rolInvestigacionId) return false;
    if (botMember && role.position >= botMember.roles.highest.position) return false;
    return true;
  });
}

export async function obtenerInvestigacionActiva(guildId, userId) {
  return Investigacion.findOne({ guildId, userId, activa: true }).sort({ iniciadoEn: -1 });
}
