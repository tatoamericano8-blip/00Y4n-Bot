/**
 * Embed unificado para entregar enlaces de sesión (RP / Meet / re-invite / FastPass / staff).
 * Mismo copy, color #FFC28D y emojis keys del bot. Sin cambiar la lógica de cada comando.
 */
import { EmbedBuilder } from 'discord.js';
import { E } from '../config/emojis.js';

export const COLOR_ENLACE_SESION = '#FFC28D';

/** @typedef {'sesion'|'meet'|'reinvite'|'reinvite_meet'|'fastpass'|'staff'} TipoEnlaceSesion */

const INTROS = {
  sesion:
    'Tu acceso a la **sesión** está listo. Entrá con calma y respetá las indicaciones del staff.',
  meet:
    'Tu acceso al **Car Meet** está listo. Entrá con calma a la zona asignada y mantené el orden.',
  reinvite:
    '**Re-invitación aceptada.** Entrá con calma, respetá al staff y cuidá tu conducta en el servidor.',
  reinvite_meet:
    '**Re-invitación al Meet aceptada.** Entrá con calma a la zona asignada y mantené el orden.',
  fastpass:
    '**FastPass verificado.** Tenés entrada anticipada. Usalo solo vos; filtrar el link es sanción grave.',
  staff:
    '**Link de staff.** Solo para el equipo. No lo compartas en canales públicos ni con civiles.'
};

const ETIQUETAS = {
  sesion: 'Sesión',
  meet: 'Car Meet',
  reinvite: 'Re-invitación',
  reinvite_meet: 'Re-invitación · Meet',
  fastpass: 'FastPass',
  staff: 'Staff'
};

/**
 * @param {{ link: string, tipo?: TipoEnlaceSesion }} opts
 * @returns {EmbedBuilder}
 */
export function crearEmbedEnlaceSesion({ link, tipo = 'sesion' }) {
  const t = INTROS[tipo] ? tipo : 'sesion';
  const etiqueta = ETIQUETAS[t];
  const intro = INTROS[t];
  const linkStr = String(link || '').trim();

  return new EmbedBuilder()
    .setColor(COLOR_ENLACE_SESION)
    .setTitle(`${E.aalas} Southwest Florida · Enlace de la sesión ${E.aalas}`)
    .setDescription(
      `${E.dot} ${intro}\n\n` +
        `${E.hyperlink} **${etiqueta}:** [hacé clic acá para unirte](${linkStr})\n\n` +
        `${E.warn} No compartas este enlace fuera del servidor.`
    );
}

export default crearEmbedEnlaceSesion;
