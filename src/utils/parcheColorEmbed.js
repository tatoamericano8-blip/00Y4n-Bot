/**
 * Redirige setColor hardcodeados a las categorías de colores.js.
 *
 * Cambiá PRIMARIO / COLORES.* en utils/colores.js y redeploy:
 *   - primario / info / sesión / etc.  → marca
 *   - exito / dinero                   → verdes
 *   - error / strike / bomberos        → rojos
 *   - advertencia / loa                → amarillos
 */
import { EmbedBuilder } from 'discord.js';
import { PRIMARIO, COLORES } from './colores.js';

function normHex(c) {
  if (typeof c !== 'string') return null;
  let s = c.trim();
  if (!s.startsWith('#')) s = `#${s}`;
  if (s.length === 4) {
    // #abc → #aabbcc
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  return s.toLowerCase();
}

function intToHex(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  return `#${(n >>> 0).toString(16).padStart(6, '0').slice(-6).toLowerCase()}`;
}

/** Hexes de marca / celeste / naranja viejo → PRIMARIO */
const MARCA = new Set([
  '#74d4fc',
  '#8ae6fa',
  '#fb8b66',
  '#00b0f4',
  '#3498db',
  '#5865f2',
].map((h) => h.toLowerCase()));

/** Verdes de éxito / dinero */
const EXITO = new Set(
  ['#57f287', '#2ecc71', '#00ff00', '#57f287', '#3ba55d', '#23a559'].map((h) =>
    h.toLowerCase()
  )
);

/** Rojos de error / strike / policía */
const ERROR = new Set(
  [
    '#e60404',
    '#ed4245',
    '#ff3333',
    '#e74c3c',
    '#ff0000',
    '#c0392b',
    '#f04747'
  ].map((h) => h.toLowerCase())
);

/** Amarillos / naranja aviso / LOA */
const ADVERTENCIA = new Set(
  ['#faa61a', '#f1c40f', '#fee75c', '#ffa500', '#e67e22', '#f39c12'].map((h) =>
    h.toLowerCase()
  )
);

function resolverCategoria(hex) {
  if (!hex) return null;
  if (MARCA.has(hex)) return COLORES.primario || PRIMARIO;
  if (EXITO.has(hex)) return COLORES.exito;
  if (ERROR.has(hex)) return COLORES.error;
  if (ADVERTENCIA.has(hex)) return COLORES.advertencia;
  return null;
}

let aplicado = false;

export function aplicarParcheColorEmbed() {
  if (aplicado) return;
  aplicado = true;

  const original = EmbedBuilder.prototype.setColor;
  EmbedBuilder.prototype.setColor = function setColorParcheado(color) {
    let c = color;

    const hex =
      typeof c === 'string'
        ? normHex(c)
        : typeof c === 'number'
          ? intToHex(c)
          : null;

    const mapped = resolverCategoria(hex);
    if (mapped) c = mapped;

    return original.call(this, c);
  };
}

// Auto-aplicar al importar
aplicarParcheColorEmbed();

export default aplicarParcheColorEmbed;
