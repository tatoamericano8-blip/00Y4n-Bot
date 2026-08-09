/**
 * Cliente ligero de Bloxlink API (v4).
 * Usa BLOXLINK_API_KEY del entorno (Render).
 */
import { logger } from './logger.js';

const API_BASE = 'https://api.blox.link/v4/public';

function getApiKey() {
  return process.env.BLOXLINK_API_KEY || process.env.BLOXLINK_KEY || null;
}

/**
 * Discord → Roblox (scoped al guild).
 * @returns {{ ok: true, robloxId: string, raw: object } | { ok: false, reason: string, status?: number }}
 */
export async function discordToRoblox(guildId, discordUserId) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, reason: 'missing_api_key' };
  }

  const url = `${API_BASE}/guilds/${guildId}/discord-to-roblox/${discordUserId}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: apiKey }
    });

    if (res.status === 404) {
      return { ok: false, reason: 'not_linked', status: 404 };
    }

    if (res.status === 429) {
      return { ok: false, reason: 'rate_limited', status: 429 };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.warn(`[bloxlink] HTTP ${res.status} para ${discordUserId}: ${text.slice(0, 200)}`);
      return { ok: false, reason: 'api_error', status: res.status };
    }

    const data = await res.json();
    const robloxId = data.robloxID || data.robloxId || data.roblox_id || null;
    if (!robloxId) {
      return { ok: false, reason: 'not_linked', status: 200 };
    }

    return { ok: true, robloxId: String(robloxId), raw: data };
  } catch (err) {
    logger.error('[bloxlink] Error de red:', err?.message || err);
    return { ok: false, reason: 'network_error' };
  }
}

/**
 * Datos públicos de un usuario Roblox.
 * @returns {{ name: string, displayName: string, smartName: string } | null}
 */
export async function obtenerUsuarioRoblox(robloxId) {
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
    if (!res.ok) return null;
    const data = await res.json();
    const name = data.name || String(robloxId);
    const displayName = data.displayName || name;
    // smart-name ≈ displayName (como en Bloxlink)
    return { name, displayName, smartName: displayName };
  } catch {
    return null;
  }
}

export function tieneApiKeyBloxlink() {
  return Boolean(getApiKey());
}
