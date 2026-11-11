import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { db } from './database.js';
import { PRIMARIO } from './colores.js';
import { E, EMOJI_DEF } from '../config/emojis.js';
import { logger } from './logger.js';

const INDEX_KEY = 'sorteos:activos';
const msgKey = (messageId) => `sorteo:msg:${messageId}`;

const ROL_EQUIPO_PROPIETARIOS = '1528877296977711256';

export function esEquipoPropietarios(member) {
  return Boolean(member?.roles?.cache?.has(ROL_EQUIPO_PROPIETARIOS));
}

/** Parsea 10s, 30m, 2h, 11d → ms. Min 30s, max 30d. */
export function parseDuracionSorteo(raw) {
  const s = String(raw || '').trim().toLowerCase();
  const m = s.match(/^(\d+)\s*([smhd])$/i);
  if (!m) {
    return { ok: false, error: 'Formato inválido. Usá por ejemplo: `30m`, `2h`, `11d`.' };
  }
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  if (!n || n < 1 || n > 999) {
    return { ok: false, error: 'La cantidad debe ser entre 1 y 999.' };
  }
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const ms = n * mult[u];
  if (ms < 30_000) return { ok: false, error: 'Mínimo **30 segundos**.' };
  if (ms > 30 * 86_400_000) return { ok: false, error: 'Máximo **30 días**.' };
  return { ok: true, ms };
}

export function buildEmbedSorteo(data, { finalizado = false, ganadores = [] } = {}) {
  const endsTs = Math.floor(Number(data.endsAt) / 1000);
  const participantes = Array.isArray(data.participantes) ? data.participantes : [];
  const winnerCount = Math.max(1, Number(data.winnerCount) || 1);

  let desc;
  if (finalizado) {
    const lista =
      ganadores.length > 0
        ? ganadores.map((id) => `<@${id}>`).join(', ')
        : '*Nadie participó.*';
    desc = [
      `${E.dot} **Finalizó:** <t:${endsTs}:F>`,
      `${E.dot} **Hosteado por:** <@${data.hostId}>`,
      `${E.dot} **Entradas:** **${participantes.length}**`,
      `${E.dot} **Ganador${ganadores.length === 1 ? '' : 'es'}:** ${lista}`
    ].join('\n');
  } else {
    desc = [
      `${E.dot} **Finaliza:** <t:${endsTs}:R> (<t:${endsTs}:F>)`,
      `${E.dot} **Hosteado por:** <@${data.hostId}>`,
      `${E.dot} **Entradas:** **${participantes.length}**`,
      `${E.dot} **Ganador${winnerCount === 1 ? '' : 'es'}:** **${winnerCount}**`
    ].join('\n');
  }

  return new EmbedBuilder()
    .setColor(PRIMARIO)
    .setTitle(`${E.gift || E.premio || '🎁'} ${data.premio}`)
    .setDescription(desc)
    .setTimestamp(finalizado ? new Date(data.endsAt) : new Date());
}

export function buildRowSorteo({ finalizado = false } = {}) {
  const btn = new ButtonBuilder()
    .setCustomId('sorteo_entrar')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(finalizado);

  const emoji = EMOJI_DEF.premio || EMOJI_DEF.gift;
  if (emoji?.id) {
    btn.setEmoji({ id: emoji.id, name: emoji.name });
  } else {
    btn.setEmoji('🎉');
  }

  return new ActionRowBuilder().addComponents(btn);
}

async function getIndex() {
  const idx = await db.get(INDEX_KEY, []);
  return Array.isArray(idx) ? idx : [];
}

async function setIndex(arr) {
  await db.set(INDEX_KEY, arr);
}

export async function guardarSorteo(data) {
  await db.set(msgKey(data.messageId), data);
  const idx = await getIndex();
  if (!idx.includes(data.messageId)) {
    idx.push(data.messageId);
    await setIndex(idx);
  }
}

export async function obtenerSorteo(messageId) {
  return await db.get(msgKey(messageId), null);
}

export async function eliminarDeIndice(messageId) {
  const idx = await getIndex();
  const next = idx.filter((id) => id !== messageId);
  await setIndex(next);
}

export function elegirGanadores(participantes, winnerCount) {
  const unique = [...new Set(participantes.map(String))];
  if (!unique.length) return [];
  const n = Math.min(Math.max(1, winnerCount), unique.length);
  const pool = [...unique];
  const winners = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

export async function unirseSorteo(messageId, userId) {
  const data = await obtenerSorteo(messageId);
  if (!data) return { ok: false, reason: 'no_existe' };
  if (data.ended) return { ok: false, reason: 'finalizado' };
  if (Date.now() >= Number(data.endsAt)) return { ok: false, reason: 'finalizado' };

  const participantes = Array.isArray(data.participantes) ? data.participantes.map(String) : [];
  if (participantes.includes(String(userId))) {
    return { ok: false, reason: 'ya_entro', data };
  }
  participantes.push(String(userId));
  data.participantes = participantes;
  await guardarSorteo(data);
  return { ok: true, data };
}

export async function finalizarSorteo(client, messageId, { endedBy = null } = {}) {
  const data = await obtenerSorteo(messageId);
  if (!data) return { ok: false, reason: 'no_existe' };
  if (data.ended) return { ok: false, reason: 'ya_finalizado', data };

  const participantes = Array.isArray(data.participantes) ? data.participantes : [];
  const winners = elegirGanadores(participantes, data.winnerCount || 1);

  data.ended = true;
  data.endedAt = Date.now();
  data.endedBy = endedBy;
  data.winnerIds = winners;
  await guardarSorteo(data);
  await eliminarDeIndice(messageId);

  try {
    const channel = await client.channels.fetch(data.channelId).catch(() => null);
    if (channel?.isTextBased?.()) {
      const msg = await channel.messages.fetch(data.messageId).catch(() => null);
      if (msg) {
        await msg.edit({
          embeds: [buildEmbedSorteo(data, { finalizado: true, ganadores: winners })],
          components: [buildRowSorteo({ finalizado: true })]
        }).catch(() => null);

        if (winners.length) {
          const menciones = winners.map((id) => `<@${id}>`).join(', ');
          await channel
            .send({
              content:
                `${E.gift || '🎁'} **Sorteo finalizado:** **${data.premio}**\n` +
                `${E.dot} Ganador${winners.length === 1 ? '' : 'es'}: ${menciones}`
            })
            .catch(() => null);
        } else {
          await channel
            .send({
              content: `${E.warn || '⚠️'} El sorteo **${data.premio}** finalizó sin participantes.`
            })
            .catch(() => null);
        }
      }
    }
  } catch (e) {
    logger.error?.(`[sorteo] Error al finalizar ${messageId}: ${e?.message || e}`);
  }

  return { ok: true, data, winners };
}

export async function rerollSorteo(client, messageId) {
  const data = await obtenerSorteo(messageId);
  if (!data) return { ok: false, reason: 'no_existe' };
  if (!data.ended) return { ok: false, reason: 'no_finalizado' };

  const participantes = Array.isArray(data.participantes) ? data.participantes : [];
  if (!participantes.length) return { ok: false, reason: 'sin_participantes' };

  const winners = elegirGanadores(participantes, data.winnerCount || 1);
  data.winnerIds = winners;
  data.rerolledAt = Date.now();
  await guardarSorteo(data);

  try {
    const channel = await client.channels.fetch(data.channelId).catch(() => null);
    if (channel?.isTextBased?.()) {
      const msg = await channel.messages.fetch(data.messageId).catch(() => null);
      if (msg) {
        await msg.edit({
          embeds: [buildEmbedSorteo(data, { finalizado: true, ganadores: winners })],
          components: [buildRowSorteo({ finalizado: true })]
        }).catch(() => null);
      }
      const menciones = winners.map((id) => `<@${id}>`).join(', ');
      await channel
        .send({
          content:
            `${E.gift || '🎁'} **Reroll** — **${data.premio}**\n` +
            `${E.dot} Nuevo${winners.length === 1 ? '' : 's'} ganador${winners.length === 1 ? '' : 'es'}: ${menciones}`
        })
        .catch(() => null);
    }
  } catch (e) {
    logger.error?.(`[sorteo] Reroll error ${messageId}: ${e?.message || e}`);
  }

  return { ok: true, data, winners };
}

/** Llamar cada minuto (cron) */
export async function checkSorteosVencidos(client) {
  try {
    const idx = await getIndex();
    if (!idx.length) return;
    const now = Date.now();
    for (const messageId of [...idx]) {
      const data = await obtenerSorteo(messageId);
      if (!data) {
        await eliminarDeIndice(messageId);
        continue;
      }
      if (data.ended) {
        await eliminarDeIndice(messageId);
        continue;
      }
      if (now >= Number(data.endsAt)) {
        await finalizarSorteo(client, messageId, { endedBy: 'auto' });
      }
    }
  } catch (e) {
    logger.error?.(`[sorteo] checkSorteosVencidos: ${e?.message || e}`);
  }
}
