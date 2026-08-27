import Sesion from '../../models/Session.js';

/**
 * Sesion activa del guild (esperando reacciones o activa).
 */
export async function obtenerSesionEnCurso(guildId) {
  if (!guildId) return null;
  try {
    return await Sesion.findOne({
      guildId,
      estado: { $in: ['esperando_reacciones', 'activa'] }
    })
      .sort({ fechaInicio: -1 })
      .lean();
  } catch (e) {
    console.error('[sessionBarGate] obtenerSesionEnCurso:', e?.message || e);
    return null;
  }
}

export async function obtenerSesionPorIdInicio(idInicio) {
  if (!idInicio) return null;
  try {
    return await Sesion.findOne({ idInicio }).lean();
  } catch (e) {
    console.error('[sessionBarGate] obtenerSesionPorIdInicio:', e?.message || e);
    return null;
  }
}

/**
 * true si el usuario esta barred en esa sesion.
 */
export function estaBarredEnSesion(sesion, userId) {
  if (!sesion || !userId) return false;
  const list = Array.isArray(sesion.barredUserIds) ? sesion.barredUserIds : [];
  return list.includes(String(userId));
}

/**
 * Default true si el campo no existe (sesiones viejas).
 */
export function requiereReaccionEnSesion(sesion) {
  if (!sesion) return true;
  if (typeof sesion.requiereReaccionLink === 'boolean') return sesion.requiereReaccionLink;
  return true;
}

export async function barUsuarioSesion(idInicio, userId, { por = null, motivo = null } = {}) {
  const uid = String(userId);
  const doc = await Sesion.findOneAndUpdate(
    { idInicio, estado: { $in: ['esperando_reacciones', 'activa'] } },
    {
      $addToSet: { barredUserIds: uid }
    },
    { new: true }
  ).lean();
  return doc;
}

export async function unbarUsuarioSesion(idInicio, userId) {
  const uid = String(userId);
  const doc = await Sesion.findOneAndUpdate(
    { idInicio, estado: { $in: ['esperando_reacciones', 'activa'] } },
    {
      $pull: { barredUserIds: uid }
    },
    { new: true }
  ).lean();
  return doc;
}

export async function setRequiereReaccionLink(idInicio, enabled) {
  const doc = await Sesion.findOneAndUpdate(
    { idInicio, estado: { $in: ['esperando_reacciones', 'activa'] } },
    { $set: { requiereReaccionLink: !!enabled } },
    { new: true }
  ).lean();
  return doc;
}
