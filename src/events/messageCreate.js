import { Events, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
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
            `1. Registra tu vehículo con \`/matricula_swfl registrar\` — la patente debe tener **de 6 a 7 caracteres alfanuméricos**, sin vehículos restringidos.\n` +
            `2. Mantente atento a los canales de roleplay para ver el anuncio de una sesión activa.\n` +
            `3. Haz clic en el botón **Link de la Sesión** para obtener el enlace del servidor privado y unirte a través de Roblox.\n\n` +
            `🎮 **Jugadores de Consola**\n` +
            `1. Registra tu vehículo con \`/registrar_vehiculo\` (mismas reglas que arriba).\n` +
            `2. Mantente atento a los canales de roleplay para ver una sesión activa.\n` +
            `3. Los jugadores de consola **no pueden** hacer clic directamente en los enlaces de servidores privados.\n` +
            `<:replica:1523028004983406787> Menciona al **Host de la Sesión** en el chat de la sesión y pídele que te **agregue como amigo** en Roblox, luego únete a través de su perfil.`
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

    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  }
};
