/**
 * Redirige setColor hardcodeados a las categorías de colores.js.
 *
 * Cambiá PRIMARIO en utils/colores.js y redeploy:
 *   - marca / celeste / naranja viejo  → PRIMARIO
 *   - verdes de éxito                 → COLORES.exito (no cambian con PRIMARIO)
 *   - rojos de error / strike         → COLORES.error / strike
 *   - amarillos de aviso / LOA        → COLORES.advertencia
 */
import { EmbedBuilder } from 'discord.js';
import { PRIMARIO, COLORES } from './colores.js';

function normHex(c) {
  if (typeof c !== 'string') return null;
  let s = c.trim();
  if (!s.startsWith('#')) s = `#${s}`;
  if (s.length === 4) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  return s.toLowerCase();
}

function intToHex(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  return `#${(n >>> 0).toString(16).padStart(6, '0').slice(-6).toLowerCase()}`;
}

/** Hexes de marca → PRIMARIO (cualquier histórico de marca del bot) */
const MARCA = new Set(
  [
    '#74d4fc',
    '#8ae6fa',
    '#fb8b66',
    '#fec18c',
    '#fec08a',
    '#00b0f4',
    '#3498db',
    '#5865f2',
    '#5dade2',
    '#1abc9c',
  ].map((h) => h.toLowerCase())
);

/** Verdes de éxito / dinero — NO siguen a PRIMARIO */
const EXITO = new Set(
  ['#57f287', '#2ecc71', '#00ff00', '#3ba55d', '#23a559'].map((h) =>
    h.toLowerCase()
  )
);

/** Rojos de error / strike — críticos */
const ERROR = new Set(
  [
    '#e60404',
    '#ed4245',
    '#ff3333',
    '#e74c3c',
    '#ff0000',
    '#c0392b',
    '#f04747',
    '#ff6363',
    '#ff5555',
  ].map((h) => h.toLowerCase())
);

/** Amarillos / aviso / LOA — críticos */
const ADVERTENCIA = new Set(
  ['#faa61a', '#f1c40f', '#fee75c', '#ffa500', '#e67e22', '#f39c12', '#ffc107'].map(
    (h) => h.toLowerCase()
  )
);

function resolverCategoria(hex) {
  if (!hex) return null;
  // Orden: marca primero, luego semánticos críticos
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

// Auto-aplicar al importar (app.js lo carga al inicio)
aplicarParcheColorEmbed();

export default aplicarParcheColorEmbed;
