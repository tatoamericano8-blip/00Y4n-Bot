import { Events, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getFromDb, setInDb, db } from '../utils/database.js';
import { cachearMensaje } from '../utils/gestorSnipe.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      // 🔒 Si el mensaje es de un bot o no es en un servidor, lo ignoramos
      if (message.author.bot || !message.guild) return;

      // Cache para /snipe
      try { cachearMensaje(message); } catch {}

      // -------------------------------------------------------------
      // 📊 1. REGISTRO DE ACTIVIDAD (CIUDADANO DEL DÍA)
      // -------------------------------------------------------------
      const hoyStr = new Date().toISOString().split('T')[0];
      const clavePuntos = `puntos_dia:${hoyStr}:${message.author.id}`;
      const claveListaUsuarios = `usuarios_activos:${hoyStr}`;

      // Sumar +1 mensaje al contador del usuario hoy
      const puntosActuales = await getFromDb(clavePuntos, 0);
      await setInDb(clavePuntos, puntosActuales + 1);

      // Registrar la ID del usuario en la lista de activos de hoy si no está
      const listaUsuarios = await getFromDb(claveListaUsuarios, []);
      if (!listaUsuarios.includes(message.author.id)) {
        listaUsuarios.push(message.author.id);
        await setInDb(claveListaUsuarios, listaUsuarios);
      }

      // -------------------------------------------------------------
      // 🏆 1.1 CONTADOR TOTAL DE MENSAJES (PARA LEADERBOARD)
      // -------------------------------------------------------------
      try {
        const claveTotal = `mensajes_totales:${message.author.id}`;
        const totalActual = await getFromDb(claveTotal, 0);
        await setInDb(claveTotal, totalActual + 1);
      } catch (e) {}

      // -------------------------------------------------------------
      // 🤖 2. AUTO-RESPONDER: "CÓMO UNIRSE"
      // -------------------------------------------------------------
      const textoNormalizado = message.content.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const disparadoresUnirse = [
        'como me uno',
        'como unirme',
        'como se entra',
        'como entro',
        'como entro a la sesion',
        'como me uno a la sesion',
        'link de la sesion',
        'link sesion',
        'como juego',
        'como se juega',
        'pc o consola',
        'como entrar'
      ];

      const activarUnirse = disparadoresUnirse.some(frase => textoNormalizado.includes(frase));

      if (activarUnirse) {
        const embedComoUnirse = new EmbedBuilder()
          .setColor('#74d4fc')
          .setDescription(
            `<a:flota:1525562954983149768>┃ __**Cómo Unirse a una Sesión**__\n\n` +
            `<:pc:1523041347869868253> **Si jugás en PC**\n` +
            `1. Registra tu vehículo con \`/matricula_swfl registrar\` (patente de 6-7 caracteres).\n` +
            `2. Esperá a que el host lance la sesión y reaccioná al mensaje de inicio.\n` +
            `3. Cuando se publique el link, hacé clic y unite.\n\n` +
            `<:consola:1523041347869868253> **Si jugás en Consola**\n` +
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
      // 🤖 3. AUTO-RESPONDER: "CÓMO REGISTRAR VEHÍCULO"
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
