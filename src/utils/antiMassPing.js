import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { logger } from './logger.js';
import { PRIMARIO } from './colores.js';
import { E } from '../config/emojis.js';

/** Ventana de tiempo para contar pings masivos (ms) */
const VENTANA_MS = 30_000;
/** Más de 4 = kick (5.º en la ventana) */
const MAX_PINGS = 4;

/** guildId:userId → timestamps de mensajes con @everyone/@here */
const historial = new Map();

function clave(guildId, userId) {
  return `${guildId}:${userId}`;
}

function limpiarAntiguos(arr, ahora) {
  return arr.filter((t) => ahora - t < VENTANA_MS);
}

/**
 * Detecta spam de @everyone / @here.
 * Si supera el límite → kick + embed en el canal.
 * @returns {Promise<boolean>} true si se aplicó sanción (el caller puede return)
 */
export async function procesarAntiMassPing(message) {
  try {
    if (!message?.guild || !message.member || message.author?.bot) return false;

    const content = message.content || '';
    const tieneEveryone =
      message.mentions?.everyone === true ||
      /(^|[\s])@everyone\b/i.test(content) ||
      /(^|[\s])@here\b/i.test(content);

    if (!tieneEveryone) return false;

    // Staff / mods no se sanciona (pueden anunciar)
    const perms = message.member.permissions;
    if (
      perms?.has(PermissionFlagsBits.Administrator) ||
      perms?.has(PermissionFlagsBits.ManageGuild) ||
      perms?.has(PermissionFlagsBits.ManageMessages) ||
      perms?.has(PermissionFlagsBits.MentionEveryone)
    ) {
      return false;
    }

    const ahora = Date.now();
    const k = clave(message.guild.id, message.author.id);
    let arr = historial.get(k) || [];
    arr = limpiarAntiguos(arr, ahora);
    arr.push(ahora);
    historial.set(k, arr);

    if (arr.length <= MAX_PINGS) return false;

    // Superó el límite → kick
    historial.delete(k);

    const razon = 'Spam de menciones masivas (@everyone / @here)';
    let kickOk = false;
    try {
      const me = message.guild.members.me;
      if (!me?.permissions?.has(PermissionFlagsBits.KickMembers)) {
        logger.warn('[antiMassPing] Bot sin permiso KickMembers');
      } else if (message.member.roles.highest.position >= me.roles.highest.position) {
        logger.warn('[antiMassPing] No se puede kickear (jerarquía de roles)');
      } else {
        await message.member.kick(razon);
        kickOk = true;
      }
    } catch (e) {
      logger.warn(`[antiMassPing] Kick falló: ${e.message}`);
    }

    const embed = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.warn || '⚠️'} Moderación automática — menciones masivas`)
      .setDescription(
        `${E.dot || '•'} **Usuario:** ${message.author} (\`${message.author.tag}\`)\n` +
          `${E.dot || '•'} **Acción:** ${kickOk ? 'Expulsado (kick) del servidor' : 'Intento de kick (revisá permisos/jerarquía)'}\n` +
          `${E.dot || '•'} **Motivo:** Más de **${MAX_PINGS}** usos de \`@everyone\` / \`@here\` en menos de **${Math.round(VENTANA_MS / 1000)}s**.\n` +
          `${E.dot || '•'} **Canal:** ${message.channel}`
      )
      .setFooter({ text: '00Y4n • Anti spam de pings' })
      .setTimestamp();

    try {
      if (message.channel?.isTextBased?.()) {
        await message.channel.send({ embeds: [embed] });
      }
    } catch (e) {
      logger.warn(`[antiMassPing] No se pudo enviar embed: ${e.message}`);
    }

    try {
      if (message.deletable) await message.delete().catch(() => null);
    } catch {
      /* ignore */
    }

    return true;
  } catch (e) {
    logger.error('[antiMassPing] Error:', e);
    return false;
  }
}
