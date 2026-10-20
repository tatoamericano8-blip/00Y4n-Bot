/**
 * Redirige setColor hardcodeados a colores.js (server principal RP).
 *
 * - Marca + verdes de “éxito” viejos → PRIMARIO
 * - Rojos de error/strike → ROJO_CRITICO (un solo rojo suave)
 * - Amarillos aviso/LOA → COLORES.advertencia
 * - #1a1a1a (Servicios Públicos) → NO se toca
 */
import { EmbedBuilder } from 'discord.js';
import { PRIMARIO, COLORES, ROJO_CRITICO } from './colores.js';

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

/** Color oscuro de Servicios Públicos — nunca remapear */
const SP_PROTECTED = new Set(['#1a1a1a', '#000000', '#111111', '#0d0d0d'].map((h) => h.toLowerCase()));

/** Hexes de marca → PRIMARIO */
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

/**
 * Verdes que antes eran “éxito/dinero” → ahora marca (PRIMARIO).
 * No incluye colores de SP.
 */
const EXITO_A_MARCA = new Set(
  ['#57f287', '#2ecc71', '#00ff00', '#3ba55d', '#23a559'].map((h) => h.toLowerCase())
);

/** Todos los rojos de error/strike → un solo rojo suave */
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

/** Amarillos aviso / LOA */
const ADVERTENCIA = new Set(
  ['#faa61a', '#f1c40f', '#fee75c', '#ffa500', '#e67e22', '#f39c12', '#ffc107'].map(
    (h) => h.toLowerCase()
  )
);

function resolverCategoria(hex) {
  if (!hex) return null;
  // Servicios Públicos y negros de UI: no tocar
  if (SP_PROTECTED.has(hex)) return null;
  if (MARCA.has(hex)) return COLORES.primario || PRIMARIO;
  if (EXITO_A_MARCA.has(hex)) return COLORES.exito || PRIMARIO;
  if (ERROR.has(hex)) return COLORES.error || ROJO_CRITICO;
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

aplicarParcheColorEmbed();

export default aplicarParcheColorEmbed;
