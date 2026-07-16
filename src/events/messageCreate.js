import { Events, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getLevelingConfig, getUserLevelData } from '../services/leveling.js';
import { addXp } from '../services/xpSystem.js';
import { checkRateLimit } from '../utils/rateLimiter.js';

const MESSAGE_XP_RATE_LIMIT_ATTEMPTS = 12;
const MESSAGE_XP_RATE_LIMIT_WINDOW_MS = 10000;

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      // 🔒 Si el mensaje es de un bot o no es en un servidor, lo ignoramos
      if (message.author.bot || !message.guild) return;

      // --- ⬇️ INICIO DEL SISTEMA AUTO-RESPONDER ("CÓMO UNIRSE") ⬇️ ---
      const textoNormalizado = message.content
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const disparadores = [
        'como unirse',
        'como me uno',
        'como unirme',
        'como puedo entrar',
        'como se entra',
        'como juego'
      ];

      const activarAutoResponder = disparadores.some(frase => textoNormalizado.includes(frase));

      if (activarAutoResponder) {
        const embedComoUnirse = new EmbedBuilder()
          .setColor('#74d4fc')
          .setDescription(
            `┃ __**Cómo Unirse a una Sesión**__\n\n` +
            `🖥️ **Jugadores de PC**\n` +
            `1. Registra tu vehículo con \`/registrar_vehiculo\` — la patente debe tener **de 6 a 7 caracteres alfanuméricos**, sin vehículos restringidos.\n` +
            `2. Mantente atento a los canales de roleplay para ver el anuncio de una sesión activa.\n` +
            `3. Haz clic en el botón **Link de la Sesión** para obtener el enlace del servidor privado y unirte a través de Roblox.\n\n` +
            `🎮 **Jugadores de Consola**\n` +
            `1. Registra tu vehículo con \`/registrar_vehiculo\` (mismas reglas que arriba).\n` +
            `2. Mantente atento a los canales de roleplay para ver una sesión activa.\n` +
            `3. Los jugadores de consola **no pueden** hacer clic directamente en los enlaces de servidores privados.\n` +
            `➡️ Menciona al **Host de la Sesión** en el chat de la sesión y pídele que te **agregue como amigo** en Roblox, luego únete a través de su perfil.`
          )
          .setFooter({ 
            text: message.guild.name, 
            iconURL: message.guild.iconURL({ dynamic: true }) 
          });

        try {
          await message.reply({ embeds: [embedComoUnirse] });
        } catch (errorResponder) {
          logger.error('Error enviando el auto-responder:', errorResponder);
        }
      }
      // --- ⬆️ FIN DEL SISTEMA AUTO-RESPONDER ⬆️ ---

      // ⚙️ Ejecución de tu sistema original de niveles
      await handleLeveling(message, client);
    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  }
};

// --- ⚙️ FUNCIÓN ORIGINAL DE NIVELES (Sigue intacta aquí abajo) ---
async function handleLeveling(message, client) {
  try {
    const rateLimitKey = `xp-event:${message.guild.id}:${message.author.id}`;
    const canProcess = await checkRateLimit(rateLimitKey, MESSAGE_XP_RATE_LIMIT_ATTEMPTS, MESSAGE_XP_RATE_LIMIT_WINDOW_MS);
    if (!canProcess) {
      return;
    }

    const levelingConfig = await getLevelingConfig(client, message.guild.id);
    
    if (!levelingConfig?.enabled) {
      return;
    }

    if (levelingConfig.ignoredChannels?.includes(message.channel.id)) {
      return;
    }

    if (levelingConfig.ignoredRoles?.length > 0) {
      const member = await message.guild.members.fetch(message.author.id).catch(() => {
        return null;
      });
      if (member && member.roles.cache.some(role => levelingConfig.ignoredRoles.includes(role.id))) {
        return;
      }
    }

    if (levelingConfig.blacklistedUsers?.includes(message.author.id)) {
      return;
    }

    if (!message.content || message.content.trim().length === 0) {
      return;
    }

    const userData = await getUserLevelData(client, message.guild.id, message.author.id);
    
    const cooldownTime = levelingConfig.xpCooldown || 60;
    const now = Date.now();
    const timeSinceLastMessage = now - (userData.lastMessage || 0);
    
    if (timeSinceLastMessage < cooldownTime * 1000) {
      return;
    }

    const minXP = levelingConfig.xpRange?.min || levelingConfig.xpPerMessage?.min || 15;
    const maxXP = levelingConfig.xpRange?.max || levelingConfig.xpPerMessage?.max || 25;

    const safeMinXP = Math.max(1, minXP);
    const safeMaxXP = Math.max(safeMinXP, maxXP);

    const xpToGive = Math.floor(Math.random() * (safeMaxXP - safeMinXP + 1)) + safeMinXP;

    let finalXP = xpToGive;
    if (levelingConfig.xpMultiplier && levelingConfig.xpMultiplier > 1) {
      finalXP = Math.floor(finalXP * levelingConfig.xpMultiplier);
    }

    const result = await addXp(client, message.guild, message.member, finalXP);
    
    if (result.success && result.leveledUp) {
      logger.info(
        `${message.author.tag} leveled up to level ${result.level} in ${message.guild.name}`
      );
    }
  } catch (error) {
    logger.error('Error handling leveling for message:', error);
  }
}
