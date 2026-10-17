/**
 * 00Y4n Bolsa de Valores
 * Precios simulados, portfolio por usuario, fee 1.2 %, tick cada 5 min.
 */
import { getFromDb, setInDb } from './database.js';
import { obtenerSaldo, agregarSaldo, restarSaldoExacto } from './gestorEconomia.js';
import { logger } from './logger.js';

export const FEE_RATE = 0.012;
export const TICK_MS = 5 * 60 * 1000;
export const PAGE_SIZE = 8;
export const OWNER_ROLE_ID = '1528877296977711256';

/** 16 empresas reales (referencia mercado) */
export const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', base: 224.68 },
  { symbol: 'AMZN', name: 'Amazon', base: 1954.31 },
  { symbol: 'DIS', name: 'Walt Disney', base: 94.99 },
  { symbol: 'GOOGL', name: 'Google', base: 950.29 },
  { symbol: 'HD', name: 'Home Depot', base: 320.36 },
  { symbol: 'JPM', name: 'JPMorgan Chase', base: 195.35 },
  { symbol: 'KO', name: 'Coca-Cola', base: 54.9 },
  { symbol: 'META', name: 'Meta', base: 519.99 },
  { symbol: 'MSFT', name: 'Microsoft', base: 1847.16 },
  { symbol: 'NFLX', name: 'Netflix', base: 1248.73 },
  { symbol: 'PEP', name: 'PepsiCo', base: 164.59 },
  { symbol: 'V', name: 'Visa', base: 284.46 },
  { symbol: 'NVDA', name: 'NVIDIA', base: 450.21 },
  { symbol: 'TSLA', name: 'Tesla', base: 264.34 },
  { symbol: 'WMT', name: 'Walmart', base: 85.1 },
  { symbol: 'MCDN', name: "McDonald's", base: 679.44 }
];

const PRICES_KEY = 'bolsa:prices';
const PREV_KEY = 'bolsa:prices_prev';
const META_KEY = 'bolsa:meta';

function portfolioKey(userId) {
  return `bolsa:portfolio:${String(userId)}`;
}

export function findStock(symbol) {
  const s = String(symbol || '').trim().toUpperCase();
  return STOCKS.find((x) => x.symbol === s) || null;
}

export function formatMoney(n) {
  const v = Number(n) || 0;
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDelta(n) {
  const v = Number(n) || 0;
  const sign = v > 0 ? '+' : '';
  return `${sign}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clampPrice(p, base) {
  const min = Math.max(0.5, base * 0.25);
  const max = base * 4;
  return Math.min(max, Math.max(min, Math.round(p * 100) / 100));
}

export async function ensurePrices() {
  let prices = await getFromDb(PRICES_KEY, null);
  if (!prices || typeof prices !== 'object') {
    prices = {};
    for (const s of STOCKS) prices[s.symbol] = s.base;
    await setInDb(PRICES_KEY, prices);
    await setInDb(PREV_KEY, { ...prices });
  } else {
    let dirty = false;
    for (const s of STOCKS) {
      if (prices[s.symbol] == null) {
        prices[s.symbol] = s.base;
        dirty = true;
      }
    }
    if (dirty) await setInDb(PRICES_KEY, prices);
  }
  return prices;
}

export async function getPrices() {
  return ensurePrices();
}

export async function getPrevPrices() {
  const prev = await getFromDb(PREV_KEY, null);
  if (prev && typeof prev === 'object') return prev;
  return ensurePrices();
}

export async function tickPrices() {
  const prices = await ensurePrices();
  await setInDb(PREV_KEY, { ...prices });

  const next = { ...prices };
  for (const s of STOCKS) {
    const cur = Number(next[s.symbol]) || s.base;
    const rare = Math.random() < 0.08;
    const maxPct = rare ? 0.04 : 0.018;
    const pct = (Math.random() * 2 - 1) * maxPct;
    next[s.symbol] = clampPrice(cur * (1 + pct), s.base);
  }
  await setInDb(PRICES_KEY, next);
  await setInDb(META_KEY, { lastTick: Date.now() });
  return next;
}

export async function getPortfolio(userId) {
  const data = await getFromDb(portfolioKey(userId), null);
  if (!data || typeof data !== 'object') return {};
  return data;
}

async function savePortfolio(userId, data) {
  await setInDb(portfolioKey(userId), data);
}

export async function buyShares(userId, symbol, shares) {
  const stock = findStock(symbol);
  if (!stock) return { ok: false, error: 'Símbolo inválido. Usá `/stock-market` para ver la lista.' };
  const qty = Math.floor(Number(shares));
  if (!Number.isFinite(qty) || qty < 1) return { ok: false, error: 'La cantidad debe ser al menos 1.' };
  if (qty > 5000) return { ok: false, error: 'Máximo 5.000 acciones por operación.' };

  const prices = await getPrices();
  const price = Number(prices[stock.symbol]) || stock.base;
  const bruto = price * qty;
  const fee = Math.round(bruto * FEE_RATE * 100) / 100;
  const total = Math.round((bruto + fee) * 100) / 100;

  const pago = await restarSaldoExacto(userId, total, {
    tipo: 'EGRESO',
    motivo: `Bolsa compra ${qty}x ${stock.symbol}`
  });
  if (!pago.ok) {
    return {
      ok: false,
      error: `Saldo insuficiente. Necesitás ${formatMoney(total)} (incluye fee ${formatMoney(fee)}). Tenés ${formatMoney(pago.saldo)}.`
    };
  }

  const port = await getPortfolio(userId);
  const cur = port[stock.symbol] || { shares: 0, cost: 0 };
  const newShares = cur.shares + qty;
  const newCost = (cur.cost || 0) + bruto;
  port[stock.symbol] = { shares: newShares, cost: Math.round(newCost * 100) / 100 };
  await savePortfolio(userId, port);

  return { ok: true, stock, qty, price, bruto, fee, total, saldo: pago.saldo };
}

export async function sellShares(userId, symbol, sharesInput) {
  const stock = findStock(symbol);
  if (!stock) return { ok: false, error: 'Símbolo inválido.' };

  const port = await getPortfolio(userId);
  const cur = port[stock.symbol];
  if (!cur || !cur.shares) return { ok: false, error: `No tenés acciones de **${stock.symbol}**.` };

  let qty;
  if (String(sharesInput).toLowerCase() === 'all') {
    qty = cur.shares;
  } else {
    qty = Math.floor(Number(sharesInput));
  }
  if (!Number.isFinite(qty) || qty < 1) return { ok: false, error: 'Cantidad inválida.' };
  if (qty > cur.shares) return { ok: false, error: `Solo tenés ${cur.shares} de ${stock.symbol}.` };

  const prices = await getPrices();
  const price = Number(prices[stock.symbol]) || stock.base;
  const bruto = price * qty;
  const fee = Math.round(bruto * FEE_RATE * 100) / 100;
  const neto = Math.round((bruto - fee) * 100) / 100;

  const costPer = cur.shares > 0 ? cur.cost / cur.shares : price;
  const costSold = costPer * qty;
  const remain = cur.shares - qty;
  if (remain <= 0) {
    delete port[stock.symbol];
  } else {
    port[stock.symbol] = {
      shares: remain,
      cost: Math.round((cur.cost - costSold) * 100) / 100
    };
  }
  await savePortfolio(userId, port);

  const saldo = await agregarSaldo(userId, neto, {
    tipo: 'INGRESO',
    motivo: `Bolsa venta ${qty}x ${stock.symbol}`
  });

  return { ok: true, stock, qty, price, bruto, fee, neto, saldo };
}

export async function editStockPrice(target, percentImpact) {
  const prices = await ensurePrices();
  await setInDb(PREV_KEY, { ...prices });
  const pct = Number(percentImpact);
  if (!Number.isFinite(pct)) return { ok: false, error: 'Porcentaje inválido.' };
  const factor = 1 + pct / 100;

  const next = { ...prices };
  if (String(target).toUpperCase() === 'ALL') {
    for (const s of STOCKS) {
      next[s.symbol] = clampPrice((Number(next[s.symbol]) || s.base) * factor, s.base);
    }
  } else {
    const stock = findStock(target);
    if (!stock) return { ok: false, error: 'Símbolo inválido.' };
    next[stock.symbol] = clampPrice((Number(next[stock.symbol]) || stock.base) * factor, stock.base);
  }
  await setInDb(PRICES_KEY, next);
  return { ok: true, prices: next };
}

export function getMovers(prices, prev, limit = 5) {
  const rows = STOCKS.map((s) => {
    const now = Number(prices[s.symbol]) || s.base;
    const was = Number(prev[s.symbol]) || s.base;
    const delta = now - was;
    const pct = was !== 0 ? (delta / was) * 100 : 0;
    return { ...s, now, was, delta, pct };
  });
  const sorted = [...rows].sort((a, b) => b.pct - a.pct);
  return {
    gainers: sorted.filter((x) => x.delta > 0).slice(0, limit),
    losers: sorted.filter((x) => x.delta < 0).sort((a, b) => a.pct - b.pct).slice(0, limit),
    all: rows
  };
}

let tickStarted = false;
export function startBolsaTicker(client) {
  if (tickStarted) return;
  tickStarted = true;
  ensurePrices().catch((e) => logger.warn('[bolsa] ensurePrices:', e.message));
  setInterval(() => {
    tickPrices().catch((e) => logger.warn('[bolsa] tick:', e.message));
  }, TICK_MS);
  try {
    logger.info('[bolsa] Ticker iniciado (cada 5 min)');
  } catch (_) {}
}
