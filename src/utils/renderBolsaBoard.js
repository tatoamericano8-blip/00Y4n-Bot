/**
 * Renderiza el panel de la 00Y4n Bolsa de Valores como PNG (SVG → sharp).
 * Estilo: fondo degradé celeste #8ae6fa → blanco, cards blancas.
 */
import sharp from 'sharp';
import { STOCKS, PAGE_SIZE, formatMoney, formatDelta } from './gestorBolsa.js';

const W = 900;
const ROW_H = 72;
const PAD = 28;
const HEADER_H = 110;
const FOOTER_H = 56;

function esc(s) {
  return String(s)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function deltaColor(delta) {
  if (delta > 0) return '#1a7f37';
  if (delta < 0) return '#c62828';
  return '#5a6a7a';
}

function deltaBg(delta) {
  if (delta > 0) return '#e6f4ea';
  if (delta < 0) return '#fce8e6';
  return '#eef2f5';
}

export async function renderBolsaPage(page, prices, prev) {
  const totalPages = Math.max(1, Math.ceil(STOCKS.length / PAGE_SIZE));
  const p = Math.min(Math.max(0, page), totalPages - 1);
  const slice = STOCKS.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE);
  const H = HEADER_H + slice.length * ROW_H + FOOTER_H + PAD;

  const rows = slice
    .map((s, i) => {
      const now = Number(prices[s.symbol]) || s.base;
      const was = Number(prev[s.symbol]) || s.base;
      const delta = now - was;
      const y = HEADER_H + i * ROW_H;
      const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '•';
      const dStr = formatDelta(delta);
      const col = deltaColor(delta);
      const bg = deltaBg(delta);

      return `
      <rect x="${PAD}" y="${y + 6}" width="${W - PAD * 2}" height="${ROW_H - 12}" rx="14" fill="#ffffff" opacity="0.95"/>
      <text x="${PAD + 22}" y="${y + 34}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="#1a2330">${esc(s.symbol)}</text>
      <text x="${PAD + 22}" y="${y + 54}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="13" fill="#5a6a7a">${esc(s.name)}</text>
      <text x="${W - PAD - 160}" y="${y + 38}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="#1a2330" text-anchor="end">${esc(formatMoney(now))}</text>
      <rect x="${W - PAD - 130}" y="${y + 40}" width="110" height="22" rx="11" fill="${bg}"/>
      <text x="${W - PAD - 75}" y="${y + 56}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="12" font-weight="600" fill="${col}" text-anchor="middle">${esc(arrow + ' ' + dStr)}</text>
    `;
    })
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8ae6fa"/>
      <stop offset="55%" stop-color="#c5f3fc"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="${W / 2}" y="48" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="28" font-weight="800" fill="#0d2a36" text-anchor="middle">00Y4n BOLSA DE VALORES</text>
  <text x="${W / 2}" y="76" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="14" fill="#2a5566" text-anchor="middle">Southwest Florida Exchange · Página ${p + 1}/${totalPages}</text>
  <text x="${W / 2}" y="98" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="12" fill="#3d6a7a" text-anchor="middle">Actualización cada 5 minutos · Fee 1.2%</text>
  ${rows}
  <text x="${W / 2}" y="${H - 22}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="12" fill="#3d6a7a" text-anchor="middle">/bolsa comprar  ·  /bolsa vender  ·  /bolsa cartera</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export function totalPages() {
  return Math.max(1, Math.ceil(STOCKS.length / PAGE_SIZE));
}
