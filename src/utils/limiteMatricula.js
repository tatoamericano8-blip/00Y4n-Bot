import PermisoMatriculaExtra from '../../models/PermisoMatriculaExtra.js';

export const LIMITE_BASE_MATRICULA = 4;

export async function obtenerLimiteMatricula(guildId, userId) {
  const doc = await PermisoMatriculaExtra.findOne({ guildId, userId });
  const extra = Math.max(0, Number(doc?.extraSlots) || 0);
  return LIMITE_BASE_MATRICULA + extra;
}
