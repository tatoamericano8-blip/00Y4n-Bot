/**
 * Redirige setColor de hex legacy al color PRIMARIO de colores.js.
 * Así, cambiar PRIMARIO en un solo archivo afecta TODOS los embeds
 * aunque todavía tengan el hex hardcodeado.
 */
import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from './colores.js';

/** Celeste anterior + naranja de marca vieja */
const HEX_LEGACY = new Set([
  '#74d4fc',
  '#74D4FC',
  '74d4fc',
  '74D4FC',
  '#fb8b66',
  '#FB8B66',
  'fb8b66',
  'FB8B66'
]);
const INT_LEGACY = new Set([
  0x74d4fc,
  0x74d4fc,
  0xfb8b66,
  0xfb8b66
]);

let aplicado = false;

export function aplicarParcheColorEmbed() {
  if (aplicado) return;
  aplicado = true;

  const original = EmbedBuilder.prototype.setColor;
  EmbedBuilder.prototype.setColor = function setColorParcheado(color) {
    let c = color;
    if (typeof c === 'string' && HEX_LEGACY.has(c)) {
      c = PRIMARIO;
    } else if (typeof c === 'number' && INT_LEGACY.has(c)) {
      c = PRIMARIO;
    }
    return original.call(this, c);
  };
}

// Auto-aplicar al importar
aplicarParcheColorEmbed();

export default aplicarParcheColorEmbed;
