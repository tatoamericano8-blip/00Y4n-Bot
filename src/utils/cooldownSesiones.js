/**
 * Cooldown de comandos de sesión (anti-spam de pings/@everyone).
 * Alcance: por servidor + por comando.
 * Bypass: rol Equipo de Propietarios.
 */
import { MessageFlags } from 'discord.js';

export const ROLE_EQUIPO_PROPIETARIOS = '1528877296977711256';
export const COOLDOWN_SESIONES_MS = 60 * 60 * 1000; // 1 hora

/** @type {Map<string, number>} key guildId:commandName -> timestamp ms hasta cuándo está bloqueado */
const cooldowns = new Map();

function key(guildId, commandName) {
  return `${guildId}:${commandName}`;
}

export function esEquipoPropietarios(member) {
  return Boolean(member?.roles?.cache?.has?.(ROLE_EQUIPO_PROPIETARIOS));
}

/**
 * @returns {{ ok: true } | { ok: false, until: number, remainingMs: number }}
 */
export function checkCooldownSesion(guildId, commandName, member) {
  if (esEquipoPropietarios(member)) return { ok: true };

  const k = key(guildId, commandName);
  const until = cooldowns.get(k) || 0;
  const now = Date.now();
  if (until > now) {
    return { ok: false, until, remainingMs: until - now };
  }
  return { ok: true };
}

/** Activa el cooldown (no aplica a Equipo de Propietarios). */
export function setCooldownSesion(guildId, commandName, member) {
  if (esEquipoPropietarios(member)) return;
  cooldowns.set(key(guildId, commandName), Date.now() + COOLDOWN_SESIONES_MS);
}

/**
 * Si está en cooldown, responde efímero y retorna true (hay que abortar).
 * Si no, retorna false.
 */
export async function bloquearSiCooldown(interaction, commandName) {
  const r = checkCooldownSesion(interaction.guildId, commandName, interaction.member);
  if (r.ok) return false;

  const ts = Math.floor(r.until / 1000);
  const msg =
    `⏳ **Cooldown activo** en \`/${commandName}\`.\n` +
    `Podrás usarlo de nuevo <t:${ts}:R> (<t:${ts}:t>).\n` +
    `> *Solo **Equipo de Propietarios** puede saltear este límite.*`;

  const payload = { content: msg, flags: MessageFlags.Ephemeral };
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch {
    try {
      await interaction.followUp(payload);
    } catch {}
  }
  return true;
}
