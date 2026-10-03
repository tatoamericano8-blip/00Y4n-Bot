import { Events } from 'discord.js';
import { logger, startupLog } from '../utils/logger.js';
import { registerCommands as registerSlashCommands } from '../handlers/commandLoader.js';

/**
 * Cuando el bot entra a un server nuevo, registra los slash commands ahí
 * (si no, /embed-send y el resto no aparecen hasta el próximo reinicio).
 */
export default {
  name: Events.GuildCreate,
  once: false,

  async execute(guild) {
    try {
      startupLog(`[guildCreate] Unido a: ${guild.name} (${guild.id}) — registrando slash...`);
      await registerSlashCommands(guild.client, guild.id);
      startupLog(`[guildCreate] Slash registrados en ${guild.name}`);
    } catch (e) {
      logger.error(`[guildCreate] Error registrando comandos en ${guild?.id}:`, e?.message || e);
    }
  }
};
