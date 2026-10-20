/**
 * Lotería 00Y4n — 5 números (1–39), pozo acumulable, sorteo cada 4 h.
 */
import { EmbedBuilder } from 'discord.js';
import { getFromDb, setInDb } from './database.js';
import { obtenerSaldo, restarSaldoExacto, agregarSaldo } from './gestorEconomia.js';
import { PRIMARIO } from './colores.js';
import { E } from '../config/emojis.js';
import { logger } from './logger.js';

export const PRECIO_BOLETO = 500;
export const MAX_BOLETOS_POR_USUARIO = 6;
export const NUMEROS_POR_BOLETO = 5;
export const NUM_MIN = 1;
export const NUM_MAX = 39;
export const CANAL_RESULTADOS = '1505615426305130657';
export const PCT_POZO = 0.8;
export const INTERVALO_HORAS = 4;
export const PREMIO_4 = 2500;
export const PREMIO_3 = 500;
export const INSTANT_MONTOS = [250, 100, 50, 25, 5];

const STATE_KEY = 'loteria:state';

function fmt(n) {
  return `$${Number(n || 0).toLocaleString('es-AR')}`;
}

function fmtNums(arr) {
  return (arr || []).map((n) => String(n).padStart(2, '0')).join(' · ');
}

function randomUnique(count, min, max) {
  const pool = [];
  for (let i = min; i <= max; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

function nextDrawDate(from = new Date()) {
  const d = new Date(from);
  d.setTime(d.getTime() + INTERVALO_HORAS * 60 * 60 * 1000);
  return d;
}

export async function getState() {
  const raw = await getFromDb(STATE_KEY, null);
  if (raw && typeof raw === 'object') {
    return {
      drawId: Number(raw.drawId) || 1,
      pool: Math.max(0, Number(raw.pool) || 0),
      nextDrawAt: raw.nextDrawAt || nextDrawDate().toISOString(),
      tickets: Array.isArray(raw.tickets) ? raw.tickets : [],
      lastResult: raw.lastResult || null
    };
  }
  const init = {
    drawId: 1,
    pool: 0,
    nextDrawAt: nextDrawDate().toISOString(),
    tickets: [],
    lastResult: null
  };
  await setInDb(STATE_KEY, init);
  return init;
}

async function saveState(state) {
  await setInDb(STATE_KEY, state);
}

export function parseNumeros(input) {
  if (!input || typeof input !== 'string') {
    return { ok: false, error: 'Indicá **5 números** del 1 al 39 (ej: `1 5 12 23 39`).' };
  }
  const parts = input.trim().split(/[\s,;.|/-]+/).filter(Boolean);
  if (parts.length !== NUMEROS_POR_BOLETO) {
    return {
      ok: false,
      error: `Debés indicar **exactamente ${NUMEROS_POR_BOLETO} números** (recibí ${parts.length}). Ejemplo: \`1 5 12 23 39\`.`
    };
  }
  const numbers = [];
  for (const p of parts) {
    if (!/^\d{1,2}$/.test(p)) {
      return { ok: false, error: `Valor inválido: \`${p}\`. Solo enteros del ${NUM_MIN} al ${NUM_MAX}.` };
    }
    const n = parseInt(p, 10);
    if (n < NUM_MIN || n > NUM_MAX) {
      return { ok: false, error: `\`${n}\` fuera de rango. Usá del **${NUM_MIN} al ${NUM_MAX}**.` };
    }
    numbers.push(n);
  }
  if (new Set(numbers).size !== numbers.length) {
    return { ok: false, error: 'Los 5 números deben ser **distintos** (sin repetir).' };
  }
  return { ok: true, numbers: numbers.sort((a, b) => a - b) };
}

function contarAciertos(ticketNums, winning) {
  const set = new Set(winning);
  return ticketNums.filter((n) => set.has(n)).length;
}

export async function comprarBoleto(userId, numbersInput) {
  const parsed = parseNumeros(numbersInput);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const state = await getState();
  const uid = String(userId);
  const ya = state.tickets.filter((t) => String(t.userId) === uid).length;
  if (ya >= MAX_BOLETOS_POR_USUARIO) {
    return {
      ok: false,
      error: `Ya tenés **${ya}/${MAX_BOLETOS_POR_USUARIO}** boletos en el sorteo #${state.drawId}. Máximo ${MAX_BOLETOS_POR_USUARIO} por sorteo.`
    };
  }

  const saldo = await obtenerSaldo(uid);
  if (saldo < PRECIO_BOLETO) {
    return {
      ok: false,
      error: `Saldo insuficiente. El boleto cuesta **${fmt(PRECIO_BOLETO)}** y tenés **${fmt(saldo)}**.`
    };
  }

  const cobro = await restarSaldoExacto(uid, PRECIO_BOLETO, {
    reason: 'loteria_boleto',
    drawId: state.drawId
  });
  if (!cobro || cobro.ok === false) {
    return { ok: false, error: 'No se pudo debitar el saldo. Intentá de nuevo.' };
  }

  const alPozo = Math.floor(PRECIO_BOLETO * PCT_POZO);
  state.pool += alPozo;

  const instantNums = randomUnique(INSTANT_MONTOS.length, NUM_MIN, NUM_MAX);
  const instantMap = {};
  instantNums.forEach((n, i) => {
    instantMap[n] = INSTANT_MONTOS[i];
  });
  let instantWin = 0;
  const instantHits = [];
  for (const n of parsed.numbers) {
    if (instantMap[n] != null) {
      instantWin += instantMap[n];
      instantHits.push({ n, amount: instantMap[n] });
    }
  }
  if (instantWin > 0) {
    await agregarSaldo(uid, instantWin, { reason: 'loteria_instantaneo', drawId: state.drawId });
  }

  const ticket = {
    userId: uid,
    numbers: parsed.numbers,
    ticketId: `${state.drawId}-${uid}-${ya + 1}`,
    createdAt: new Date().toISOString()
  };
  state.tickets.push(ticket);
  await saveState(state);

  return {
    ok: true,
    drawId: state.drawId,
    numbers: parsed.numbers,
    pool: state.pool,
    nextDrawAt: state.nextDrawAt,
    ticketsUser: ya + 1,
    ticketsMax: MAX_BOLETOS_POR_USUARIO,
    price: PRECIO_BOLETO,
    instantHits,
    instantWin
  };
}

export async function infoPozo() {
  const state = await getState();
  return {
    drawId: state.drawId,
    pool: state.pool,
    nextDrawAt: state.nextDrawAt,
    totalTickets: state.tickets.length
  };
}

export async function infoUltimo() {
  const state = await getState();
  return state.lastResult;
}

export async function ejecutarSorteo(client) {
  const state = await getState();
  const winning = randomUnique(NUMEROS_POR_BOLETO, NUM_MIN, NUM_MAX);
  const tickets = state.tickets || [];
  let pool = state.pool;

  const byMatch = { 5: [], 4: [], 3: [] };
  for (const t of tickets) {
    const m = contarAciertos(t.numbers, winning);
    if (m >= 3) byMatch[m].push(t);
  }

  const pagos = [];
  let poolRestante = pool;

  for (const t of byMatch[3]) {
    const premio = Math.min(PREMIO_3, poolRestante);
    if (premio > 0) {
      poolRestante -= premio;
      pagos.push({ userId: t.userId, amount: premio, match: 3, ticketId: t.ticketId });
    }
  }
  for (const t of byMatch[4]) {
    const premio = Math.min(PREMIO_4, poolRestante);
    if (premio > 0) {
      poolRestante -= premio;
      pagos.push({ userId: t.userId, amount: premio, match: 4, ticketId: t.ticketId });
    }
  }

  const jackpotWinners = byMatch[5];
  if (jackpotWinners.length > 0 && poolRestante > 0) {
    const each = Math.floor(poolRestante / jackpotWinners.length);
    const remainder = poolRestante - each * jackpotWinners.length;
    jackpotWinners.forEach((t, i) => {
      const amount = each + (i === 0 ? remainder : 0);
      if (amount > 0) {
        pagos.push({ userId: t.userId, amount, match: 5, ticketId: t.ticketId });
      }
    });
    poolRestante = 0;
  }

  for (const p of pagos) {
    try {
      await agregarSaldo(p.userId, p.amount, {
        reason: 'loteria_premio',
        match: p.match,
        drawId: state.drawId
      });
    } catch (e) {
      logger.error('[loteria] pago falló', p, e?.message || e);
    }
  }

  if (client && jackpotWinners.length > 0) {
    for (const t of jackpotWinners) {
      const pago = pagos.find((p) => p.ticketId === t.ticketId && p.match === 5);
      if (!pago) continue;
      try {
        const user = await client.users.fetch(t.userId).catch(() => null);
        if (!user) continue;
        const emb = new EmbedBuilder()
          .setColor(PRIMARIO)
          .setTitle(`${E.premio || ''} ¡Ganaste el pozo de la Lotería!`)
          .setDescription(
            `${E.tilde || ''} Sorteo **#${state.drawId}**\n` +
              `Números ganadores: **${fmtNums(winning)}**\n` +
              `Tus números: **${fmtNums(t.numbers)}**\n` +
              `Premio: **${fmt(pago.amount)}**\n\nYa está acreditado en tu saldo.`
          )
          .setFooter({ text: 'Southwest Florida 00Y4n · Lotería' })
          .setTimestamp();
        await user.send({ embeds: [emb] }).catch(() => null);
      } catch (_) {}
    }
  }

  const lastResult = {
    drawId: state.drawId,
    at: new Date().toISOString(),
    winning,
    totalTickets: tickets.length,
    poolBefore: pool,
    poolAfter: poolRestante,
    pagos,
    jackpotWinners: jackpotWinners.map((t) => t.userId),
    matchCounts: {
      5: byMatch[5].length,
      4: byMatch[4].length,
      3: byMatch[3].length
    }
  };

  if (client) {
    try {
      const ch = await client.channels.fetch(CANAL_RESULTADOS).catch(() => null);
      if (ch && ch.isTextBased && ch.isTextBased()) {
        const lines = [];
        if (jackpotWinners.length) {
          lines.push(
            `${E.premio || ''} **Pozo (5 aciertos):** ${jackpotWinners.map((t) => `<@${t.userId}>`).join(', ')}`
          );
        } else {
          lines.push(`${E.dot || '•'} **Pozo (5 aciertos):** nadie — el pozo se acumula.`);
        }
        if (byMatch[4].length) {
          lines.push(
            `${E.tilde || ''} **4 aciertos (${fmt(PREMIO_4)}):** ${byMatch[4].map((t) => `<@${t.userId}>`).join(', ')}`
          );
        }
        if (byMatch[3].length) {
          lines.push(
            `${E.dot || '•'} **3 aciertos (${fmt(PREMIO_3)}):** ${byMatch[3].map((t) => `<@${t.userId}>`).join(', ')}`
          );
        }
        if (!byMatch[5].length && !byMatch[4].length && !byMatch[3].length) {
          lines.push('Sin ganadores de 3+ aciertos en este sorteo.');
        }

        const emb = new EmbedBuilder()
          .setColor(PRIMARIO)
          .setTitle(`${E.trofeoalas || E.premio || ''} Lotería — Resultados`)
          .addFields(
            {
              name: 'Sorteo',
              value: `**#${state.drawId}** · <t:${Math.floor(Date.now() / 1000)}:f>`,
              inline: false
            },
            {
              name: 'Números ganadores',
              value: `**${fmtNums(winning)}**`,
              inline: false
            },
            {
              name: 'Pozo',
              value: `Antes **${fmt(pool)}** → ahora **${fmt(poolRestante)}**\nBoletos: **${tickets.length}**`,
              inline: false
            },
            {
              name: 'Ganadores',
              value: lines.join('\n').slice(0, 1000),
              inline: false
            }
          )
          .setFooter({ text: 'Southwest Florida 00Y4n · Próximo sorteo en 4 horas' })
          .setTimestamp();
        await ch.send({ embeds: [emb] });
      }
    } catch (e) {
      logger.error('[loteria] anuncio resultados:', e?.message || e);
    }
  }

  await saveState({
    drawId: state.drawId + 1,
    pool: poolRestante,
    nextDrawAt: nextDrawDate().toISOString(),
    tickets: [],
    lastResult
  });
  logger.info(`[loteria] Sorteo #${state.drawId} ok. Pagos: ${pagos.length}. Pozo: ${poolRestante}`);
  return lastResult;
}

export function buildTicketEmbed(result) {
  const instantLines =
    result.instantHits?.length > 0
      ? result.instantHits.map((h) => `**${String(h.n).padStart(2, '0')}** → ${fmt(h.amount)}`).join('\n')
      : 'Sin coincidencias instantáneas.';

  return new EmbedBuilder()
    .setColor(PRIMARIO)
    .setTitle(`${E.premio || ''} Lotería — Boleto`)
    .addFields(
      {
        name: 'SORTEO',
        value: `**#${result.drawId}** — Próximo: <t:${Math.floor(new Date(result.nextDrawAt).getTime() / 1000)}:R>`,
        inline: false
      },
      {
        name: 'TUS NÚMEROS',
        value: `**${fmtNums(result.numbers)}**`,
        inline: false
      },
      {
        name: 'INSTANTÁNEO',
        value:
          instantLines +
          (result.instantWin > 0
            ? `\n${E.tilde || ''} Ganaste **${fmt(result.instantWin)}** al instante.`
            : `\n${E.cruz || ''} Sin premio instantáneo.`),
        inline: false
      },
      {
        name: 'Pozo actual',
        value: `**${fmt(result.pool)}** · Tus boletos: **${result.ticketsUser}/${result.ticketsMax}**`,
        inline: false
      }
    )
    .setFooter({ text: `Southwest Florida 00Y4n · Boleto ${fmt(result.price)}` })
    .setTimestamp();
}

export { fmt, fmtNums };
