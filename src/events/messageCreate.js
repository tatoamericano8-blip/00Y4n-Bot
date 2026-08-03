import { Events, EmbedBuilder, MessageType } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getFromDb, setInDb, db } from '../utils/database.js';
import { cachearMensaje } from '../utils/gestorSnipe.js';
import { anunciarBoostAutomatico } from './guildMemberUpdate.js';

const BOOST_MSG_TYPES = new Set([
  MessageType.UserPremiumGuildSubscription,
  MessageType.UserPremiumGuildSubscriptionTier1,
  MessageType.UserPremiumGuildSubscriptionTier2,
  MessageType.UserPremiumGuildSubscriptionTier3
]);

export default {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      if (message.guild && BOOST_MSG_TYPES.has(message.type)) {
        try {
          const veces = Math.max(1, parseInt(String(message.content || '1').trim(), 10) || 1);
          const dedupeKey = `boost_dedupe:${message.guild.id}:${message.author.id}`;
          await setInDb(dedupeKey, Date.now());
          await anunciarBoostAutomatico(message.author, message.guild, veces, message.client);
        } catch (e) {
          logger.error('Error procesando boost del sistema:', e);
        }
        return;
      }

      // Contar y procesar solo mensajes de usuarios en servidores (todos los canales)
      if (message.author.bot || !message.guild) return;

      try { cachearMensaje(message); } catch {}

      // Ciudadano del día
      const hoyStr = new Date().toISOString().split('T')[0];
      const clavePuntos = `puntos_dia:${hoyStr}:${message.author.id}`;
      const claveListaUsuarios = `usuarios_activos:${hoyStr}`;

      const puntosActuales = await getFromDb(clavePuntos, 0);
      await setInDb(clavePuntos, puntosActuales + 1);

      const listaUsuarios = await getFromDb(claveListaUsuarios, []);
      if (!listaUsuarios.includes(message.author.id)) {
        listaUsuarios.push(message.author.id);
        await setInDb(claveListaUsuarios, listaUsuarios);
      }

      // Contador permanente por servidor (todos los canales del guild)
      try {
        const claveTotal = `mensajes_totales:${message.guild.id}:${message.author.id}`;
        const totalActual = await getFromDb(claveTotal, 0);
        await setInDb(claveTotal, Number(totalActual) + 1);
      } catch (e) {
        logger.error('Error contando mensajes_totales:', e);
      }

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
            `<a:flota:1525562954983149768>\u2503 __**Cómo Unirse a una Sesión**__\n\n` +
            `<:pc:1523041347869868253> **Si jugás en PC**\n` +
            `1. Registra tu vehículo con \`/matricula_swfl registrar\` (patente de 6-7 caracteres).\n` +
            `2. Esperá a que el host lance la sesión y reaccioná al mensaje de inicio.\n` +
            `3. Cuando se publique el link, hacé clic y unite.\n\n` +
            `<:consola:1523041347869868253> **Si jugás en Consola**\n` +
            `1. Registra tu vehículo con \`/matricula_swfl registrar\` (mismas reglas que arriba).\n` +
            `2. Mantente atento a los canales de <#1452644461745148049> y <#1501739933495201925> para ver una sesión activa. Si no hay, esperá pacientemente a que un host tenga tiempo e inicie una.\n` +
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
            `<a:flota:1525562954983149768>\u2503 __**Cómo Registrar tu Vehículo**__\n\n` +
            `<:car:1523041347869868253> **Paso a Paso:**\n` +
            `1. Escribe el comando **\`/matricular registrar\`** en el canal <#1505615426305130657>.\n` +
            `2. En la opción **patente**, ingresa una combinación de **6 a 7 caracteres** (letras y números sin espacios ni símbolos).\n` +
            `3. Especifica la **marca y modelo** exacto de tu auto.\n\n` +
            `<:adv:1523041352714158240> **Importante:**\n` +
            `- Revisa el canal de reglas para asegurarte de que tu auto no esté en la lista de **vehículos restringidos o prohibidos**.\n` +
            `- Tu registro es obligatorio para poder ingresar a las sesiones de roleplay y **evitar multas** (No se permiten patentes iguales).`
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
