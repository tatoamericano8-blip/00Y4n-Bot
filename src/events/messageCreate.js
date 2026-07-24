import { Events, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      // 🔒 Si el mensaje es de un bot o no es en un servidor, lo ignoramos
      if (message.author.bot || !message.guild) return;

      // Normalizamos el texto (quita tildes y pasa todo a minúsculas)
      const textoNormalizado = message.content
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      // -------------------------------------------------------------
      // 1️⃣ AUTO-RESPONDER: "CÓMO UNIRSE"
      // -------------------------------------------------------------
      const disparadoresUnirse = [
        'como unirse',
        'como me uno',
        'como unirme',
        'como puedo entrar',
        'como se entra',
        'como juego'
      ];

      const activarUnirse = disparadoresUnirse.some(frase => textoNormalizado.includes(frase));

      if (activarUnirse) {
        const embedComoUnirse = new EmbedBuilder()
          .setColor('#74d4fc')
          .setDescription(
            `┃ __**Cómo Unirse a una Sesión**__\n\n` +
            `🖥️ **Jugadores de PC**\n` +
            `1. Registra tu vehículo con \`/matricula_swfl registrar\` — la patente debe tener **de 6 a 7 caracteres alfanuméricos**, sin vehículos restringidos.\n` +
            `2. Mantente atento a los canales de roleplay para ver el anuncio de una sesión activa.\n` +
            `3. Haz clic en el botón **Link de la Sesión** para obtener el enlace del servidor privado y unirte a través de Roblox.\n\n` +
            `🎮 **Jugadores de Consola**\n` +
            `1. Registra tu vehículo con \`/matricula_swfl registrar\` (mismas reglas que arriba).\n` +
            `2. Mantente atento a los canales de roleplay para ver una sesión activa.\n` +
            `3. Los jugadores de consola **no pueden** hacer clic directamente en los enlaces de servidores privados.\n` +
            `<:replica:1523028004983406787> Menciona al **Host de la Sesión** en el chat de la sesión y pídele que te **agregue como amigo** en Roblox, luego únete a través de su perfil.`
          )
          .setFooter({ 
            text: message.guild.name, 
            iconURL: message.guild.iconURL({ dynamic: true }) 
          });

        try {
          return await message.reply({ embeds: [embedComoUnirse] });
        } catch (error) {
          logger.error('Error enviando auto-responder de cómo unirse:', error);
        }
      }

      // -------------------------------------------------------------
      // 2️⃣ AUTO-RESPONDER: "CÓMO REGISTRAR VEHÍCULO"
      // -------------------------------------------------------------
      const disparadoresRegistro = [
        'como registro',
        'como se registra',
        'como registrar',
        'donde registro',
        'como matriculo',
        'como matricular',
        'donde matriculo',
        'como registro mi auto',
        'registrar',
        'matriculo',
        'registro',
        'como registro mi vehiculo'
      ];

      const activarRegistro = disparadoresRegistro.some(frase => textoNormalizado.includes(frase));

      if (activarRegistro) {
        const embedRegistro = new EmbedBuilder()
          .setColor('#74d4fc')
          .setDescription(
            `<a:flota:1525562954983149768>┃ __**Cómo Registrar tu Vehículo**__\n\n` +
            `<:car:1523041347869868253> **Paso a Paso:**\n` +
            `1. Escribe el comando **\`/matricular registrar\`** en el canal <#1505615426305130657>.\n` +
            `2. En la opción **patente**, ingresa una combinación de **6 a 7 caracteres** (letras y números sin espacios ni símbolos).\n` +
            `3. Especifica la **marca y modelo** exacto de tu auto.\n\n` +
            `<:adv:1523041352714158240> **Importante:**\n` +
            `- Revisa el canal de reglas para asegurarte de que tu auto no esté en la lista de **vehículos restringidos o prohibidos**.\n` +
            `- Tu registro es obligatorio para poder ingresar a las sesiones de roleplay y **evitar multas**.`
          )
          .setFooter({ 
            text: message.guild.name, 
            iconURL: message.guild.iconURL({ dynamic: true }) 
          });

        try {
          return await message.reply({ embeds: [embedRegistro] });
        } catch (error) {
          logger.error('Error enviando auto-responder de registro:', error);
        }
      }

    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  }
};
