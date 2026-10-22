/**
 * 00Y4n Times — noticias de la bolsa (SVG → sharp).
 * Estilo diario #FFC28D.
 */
import sharp from 'sharp';
import { formatMoney, formatDelta } from './gestorBolsa.js';

const W = 720;

function esc(s) {
  return String(s)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function fechaEs() {
  try {
    return new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires'
    });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function capitalizar(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function headline(gainers, losers) {
  const topG = gainers[0];
  const topL = losers[0];
  if (topG && (!topL || Math.abs(topG.pct) >= Math.abs(topL.pct))) {
    return {
      title: `${topG.symbol} lidera el avance del mercado`,
      sub: `Compradores activos en la rueda. ${topG.name} destacó entre las mayores subidas.`
    };
  }
  if (topL) {
    return {
      title: `${topL.symbol} presiona a la baja`,
      sub: `Los vendedores marcaron el ritmo. ${topL.name} encabezó las pérdidas.`
    };
  }
  return {
    title: 'Mercado estable en la sesión',
    sub: 'Sin movimientos extremos. Los operadores esperan el próximo catalizador.'
  };
}

function resumenMercado(gainers, losers) {
  const nG = gainers.length;
  const nL = losers.length;
  if (nG > nL) {
    return 'Sesgo alcista: más títulos en verde. El volumen acompañó a los compradores.';
  }
  if (nL > nG) {
    return 'Cierre débil: predominaron las bajas tras la última actualización de precios.';
  }
  return 'Sesión mixta. Subidas y bajadas se equilibraron sin un claro dominador.';
}

/**
 * @param {{ gainers: any[], losers: any[] }} movers
 */
export async function renderBolsaNoticias({ gainers = [], losers = [] }) {
  const g = gainers.slice(0, 3);
  const l = losers.slice(0, 3);
  const h = headline(g, l);
  const resumen = resumenMercado(g, l);
  const fecha = capitalizar(fechaEs());

  const rowH = 36;
  const yUpStart = 300;
  const yDownLabel = yUpStart + Math.max(g.length, 1) * rowH + 28;
  const yDownStart = yDownLabel + 24;
  const H = yDownStart + Math.max(l.length, 1) * rowH + 56;

  const upRows = g.length
    ? g
        .map((x, i) => {
          const y = yUpStart + i * rowH;
          const pct = `${x.pct >= 0 ? '+' : ''}${x.pct.toFixed(2)}%`;
          return `
      <rect x="40" y="${y - 18}" width="${W - 80}" height="30" rx="8" fill="#e6f4ea" opacity="0.85"/>
      <text x="56" y="${y}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="14" font-weight="700" fill="#0d5c2e">${esc(x.symbol)}</text>
      <text x="130" y="${y}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="13" fill="#1a2330">${esc(x.name)}</text>
      <text x="${W - 56}" y="${y}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#0d5c2e" text-anchor="end">${esc(pct)} · ${esc(formatDelta(x.delta))}</text>`;
        })
        .join('')
    : `<text x="48" y="${yUpStart}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="13" fill="#5a6a7a">Sin subidas relevantes en esta rueda.</text>`;

  const downRows = l.length
    ? l
        .map((x, i) => {
          const y = yDownStart + i * rowH;
          const pct = `${x.pct.toFixed(2)}%`;
          return `
      <rect x="40" y="${y - 18}" width="${W - 80}" height="30" rx="8" fill="#fce8e6" opacity="0.85"/>
      <text x="56" y="${y}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="14" font-weight="700" fill="#9b1c1c">${esc(x.symbol)}</text>
      <text x="130" y="${y}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="13" fill="#1a2330">${esc(x.name)}</text>
      <text x="${W - 56}" y="${y}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#9b1c1c" text-anchor="end">${esc(pct)} · ${esc(formatDelta(x.delta))}</text>`;
        })
        .join('')
    : `<text x="48" y="${yDownStart}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="13" fill="#5a6a7a">Sin bajadas relevantes en esta rueda.</text>`;

  const title = h.title.length > 52 ? h.title.slice(0, 50) + '…' : h.title;
  const sub = h.sub.length > 90 ? h.sub.slice(0, 87) + '…' : h.sub;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#dff6fc"/>
      <stop offset="45%" stop-color="#f2fbfe"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="14" fill="url(#paper)"/>
  <rect x="0" y="0" width="8" height="${H}" fill="#FFC28D"/>

  <text x="${W / 2}" y="46" font-family="Georgia, Times New Roman, serif" font-size="30" font-weight="700" fill="#6b3f1a" text-anchor="middle" letter-spacing="1.5">00Y4n TIMES</text>
  <text x="${W / 2}" y="68" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="12" fill="#7a5a3a" text-anchor="middle">Bolsa de Valores · Southwest Florida Mercado</text>
  <text x="${W / 2}" y="88" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="11" fill="#8a6a4a" text-anchor="middle">${esc(fecha)}</text>
  <line x1="36" y1="100" x2="${W - 36}" y2="100" stroke="#FFC28D" stroke-width="2"/>

  <text x="48" y="136" font-family="Georgia, Times New Roman, serif" font-size="20" font-weight="700" fill="#6b3f1a">${esc(title)}</text>
  <text x="48" y="160" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="13" fill="#3a5560">${esc(sub)}</text>

  <text x="48" y="196" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="#6b3f1a" letter-spacing="1.2">RESUMEN DEL MERCADO</text>
  <text x="48" y="218" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="13" fill="#1a2330">${esc(resumen)}</text>
  <line x1="36" y1="236" x2="${W - 36}" y2="236" stroke="#FFD9B5" stroke-width="1"/>

  <text x="48" y="268" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="12" font-weight="700" fill="#0d5c2e" letter-spacing="1">▲ MAYORES SUBIDAS</text>
  ${upRows}

  <text x="48" y="${yDownLabel}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="12" font-weight="700" fill="#9b1c1c" letter-spacing="1">▼ MAYORES BAJADAS</text>
  ${downRows}

  <line x1="36" y1="${H - 34}" x2="${W - 36}" y2="${H - 34}" stroke="#FFD9B5" stroke-width="1"/>
  <text x="48" y="${H - 14}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="11" fill="#8a6a4a">Actualización cada 5 min · 00Y4n Bolsa de Valores</text>
  <rect x="${W - 148}" y="${H - 28}" width="108" height="18" rx="9" fill="#FFC28D" opacity="0.4"/>
  <text x="${W - 94}" y="${H - 15}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="10" font-weight="600" fill="#6b3f1a" text-anchor="middle">00Y4n Markets</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}
