/**
 * Detecta el rango de Staff más alto según los roles de Discord del miembro.
 * Ordena por posición real del rol en el servidor (el más alto gana).
 */

// Palabras clave de roles de staff (de menor a mayor no importa: usamos position)
const KEYWORDS_RANGO_STAFF = [
  'co-fundador',
  'co fundador',
  'cofundador',
  'gerente de staff',
  'gerente staff',
  'senior administrador',
  'senior admin',
  'alto mando',
  'alto comando',
  'senior staff',
  'server staff',
  'host carmeet',
  'junior staff',
  'staff aprendiz',
  'staff trainee',
  'staff team',
  '00y4n | staff',
  '00y4n staff',
  'staff'
];

function esRolDeStaff(nombreRol) {
  const n = String(nombreRol || '').toLowerCase().trim();
  if (!n || n === '@everyone') return false;
  return KEYWORDS_RANGO_STAFF.some(k => n.includes(k));
}

/**
 * @param {import('discord.js').GuildMember | null} member
 * @param {string} [fallback='Sin rango']
 * @returns {string}
 */
export function obtenerRangoMasAlto(member, fallback = 'Sin rango') {
  if (!member?.roles?.cache) return fallback;

  const rolesStaff = [...member.roles.cache.values()]
    .filter(r => r.id !== member.guild?.id) // excluye @everyone
    .filter(r => esRolDeStaff(r.name))
    .sort((a, b) => b.position - a.position);

  if (rolesStaff.length > 0) {
    return rolesStaff[0].name;
  }

  // Fallback: rol más alto del servidor (si no es @everyone)
  const highest = member.roles.highest;
  if (highest && highest.id !== member.guild?.id) {
    return highest.name;
  }

  return fallback;
}

/**
 * Obtiene el miembro y su rango más alto.
 * @param {import('discord.js').Guild} guild
 * @param {string} userId
 * @param {string} [fallback]
 */
export async function obtenerRangoDeUsuario(guild, userId, fallback = 'Sin rango') {
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    return {
      member,
      rango: obtenerRangoMasAlto(member, fallback)
    };
  } catch {
    return { member: null, rango: fallback };
  }
}
