import { getFromDb, setInDb } from './database.js';
import Staff from '../../models/Staff.js';

const keyScore = (guildId, userId) => `hostscore:${guildId}:${userId}`;

/**
 * Registra una nota de feedback (1-10) para un host.
 */
export async function registrarNotaHost(guildId, hostId, {
  nota,
  deUserId = null,
  comentario = '',
  sesionId = null
} = {}) {
  const n = Math.max(1, Math.min(10, Number(nota) || 0));
  if (!guildId || !hostId || !n) return null;

  const prev = (await getFromDb(keyScore(guildId, hostId), null)) || {
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
      comentario: String(comentario || '').slice(0, 200),
      sesionId: sesionId || null,
      fecha: new Date().toISOString()
    },
    ...(Array.isArray(prev.historial) ? prev.historial : [])
  ].slice(0, 50);

  await setInDb(keyScore(guildId, hostId), prev);

  try {
    await Staff.findOneAndUpdate(
      { guildId, userId: hostId },
      {
        $set: {
          'hostScore.promedio': prev.promedio,
          'hostScore.cantidad': prev.cantidad,
          'hostScore.actualizado': new Date()
        }
      },
      { upsert: false }
    );
  } catch (_) {}

  return prev;
}

export async function obtenerScoreHost(guildId, userId) {
  const data = await getFromDb(keyScore(guildId, userId), null);
  if (!data) return { promedio: 0, cantidad: 0, historial: [] };
  return data;
}

export async function rankingHostsSemana(guildId, limite = 10) {
  const staffList = await Staff.find({
    guildId,
    estado: { $nin: ['DESPEDIDO', 'RENUNCIADO'] }
  }).lean();

  const desde = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const rows = [];

  for (const s of staffList) {
    const score = await obtenerScoreHost(guildId, s.userId);
    const recientes = (score.historial || []).filter(
      (h) => h.fecha && new Date(h.fecha).getTime() >= desde
    );
    const hosteadas =
      s.cuotas?.sesionesOrganizadas ||
      s.estadisticasHistoricas?.sesionesHosteadasTotales ||
      0;

    if (recientes.length === 0 && !score.cantidad && !hosteadas) continue;

    const sumaRec = recientes.reduce((a, h) => a + (Number(h.nota) || 0), 0);
    const promRec =
      recientes.length > 0 ? Math.round((sumaRec / recientes.length) * 10) / 10 : score.promedio || 0;

    rows.push({
      userId: s.userId,
      promedioGlobal: score.promedio || 0,
      promedioSemana: promRec,
      feedbacksSemana: recientes.length,
      feedbacksTotal: score.cantidad || 0,
      sesionesSemana: s.cuotas?.sesionesOrganizadas || 0
    });
  }

  rows.sort((a, b) => {
    if (b.promedioSemana !== a.promedioSemana) return b.promedioSemana - a.promedioSemana;
    if (b.feedbacksSemana !== a.feedbacksSemana) return b.feedbacksSemana - a.feedbacksSemana;
    return b.sesionesSemana - a.sesionesSemana;
  });

  return rows.slice(0, limite);
}
