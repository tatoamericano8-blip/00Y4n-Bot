/**
 * Fuerza el footer de marca en TODOS los EmbedBuilder del bot.
 * - Si no hay footer → se agrega
 * - Si hay footer → se reemplaza
 * Solo afecta el footer; el resto del embed no se modifica.
 */
import { EmbedBuilder } from 'discord.js';

export const BRAND_FOOTER_TEXT = 'Southwest Florida Comunidad 00Y4n ™';

let aplicado = false;

export function aplicarParcheFooterEmbed() {
  if (aplicado) return;
  aplicado = true;

  const originalSetFooter = EmbedBuilder.prototype.setFooter;
  const originalToJSON = EmbedBuilder.prototype.toJSON;

  EmbedBuilder.prototype.setFooter = function setFooterParcheado(_footerData) {
    return originalSetFooter.call(this, { text: BRAND_FOOTER_TEXT });
  };

  EmbedBuilder.prototype.toJSON = function toJSONConFooter(...args) {
    originalSetFooter.call(this, { text: BRAND_FOOTER_TEXT });
    return originalToJSON.apply(this, args);
  };
}

aplicarParcheFooterEmbed();

export default aplicarParcheFooterEmbed;
