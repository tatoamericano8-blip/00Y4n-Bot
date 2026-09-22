import { getFromDb, setInDb } from './database.js';
import Staff from '../../models/Staff.js';

const keySup = (guildId, userId) => `supscore:${guildId}:${userId}`;

/**
 * Registra rating de supervisión (1-5) hacia un host.
 */
export async function registrarNotaSupervision(guildId, hostId, {
  nota,
  deUserId = null,
  notas = '',
  sesionId = null
} = {}) {
  const n = Math.max(1, Math.min(5, Number(nota) || 0));
  if (!guildId || !hostId || !n) return null;

  const prev = (await getFromDb(keySup(guildId, hostId), null)) || {
    suma: 0,
    cantidad: 0,
    promedio: 0,
    historial: []
  };

  prev.suma += n;
  prev.cantidad += 1;
  prev.promedio = Math.round((prev.suma / prev.cantidad) * 10) / 10;
  prev.historial = [
    {
      nota: n,
      de: deUserId,
      notas: String(notas || '').slice(0, 500),
      sesionId: sesionId || null,
      fecha: new Date().toISOString()
    },
    ...(Array.isArray(prev.historial) ? prev.historial : [])
  ].slice(0, 50);

  await setInDb(keySup(guildId, hostId), prev);

  try {
    await Staff.findOneAndUpdate(
      { guildId, userId: hostId },
      {
        $set: {
          'supervisionScore.promedio': prev.promedio,
          'supervisionScore.cantidad': prev.cantidad,
          'supervisionScore.actualizado': new Date()
        }
      },
      { upsert: false }
    );
  } catch (_) {}

  return prev;
}

export async function obtenerScoreSupervision(guildId, userId) {
  const data = await getFromDb(keySup(guildId, userId), null);
  if (!data) return { promedio: 0, cantidad: 0, historial: [] };
  return data;
}
