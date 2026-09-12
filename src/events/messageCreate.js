import { Events, EmbedBuilder, MessageType } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getFromDb, setInDb, db } from '../utils/database.js';
import { cachearMensaje } from '../utils/gestorSnipe.js';
import { anunciarBoostAutomatico } from './guildMemberUpdate.js';
import { E } from '../config/emojis.js';

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
            `${E.acoraflotante}\u2503 __**Cómo Unirse a una Sesión**__\n\n` +
            `${E.auto} **Si jugás en PC**\n` +
            `1. Registra tu vehículo con \`/matricula_swfl registrar\` (patente de 6-7 caracteres).\n` +
            `2. Esperá a que el host lance la sesión y reaccioná al mensaje de inicio.\n` +
            `3. Cuando se publique el link, hacé clic y unite.\n\n` +
            `${E.auto} **Si jugás en Consola**\n` +
            `1. Registra tu vehículo con \`/matricula_swfl registrar\` (mismas reglas que arriba).\n` +
            `2. Mantente atento a los canales de <#1452644461745148049> y <#1501739933495201925> para ver una sesión activa. Si no hay, esperá pacientemente a que un host tenga tiempo e inicie una.\n` +
            `3. Los jugadores de consola **no pueden** hacer clic directamente en los enlaces de servidores privados.\n` +
            `${E.flechareplica} Menciona al **Host de la Sesión** en el chat de la sesión y pídele que te **agregue como amigo** en Roblox, luego únete a través de su perfil.`
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
            `${E.acoraflotante}\u2503 __**Cómo Registrar tu Vehículo**__\n\n` +
            `${E.auto} **Paso a Paso:**\n` +
            `1. Escribe el comando **\`/matricular registrar\`** en el canal <#1505615426305130657>.\n` +
            `2. En la opción **patente**, ingresa una combinación de **6 a 7 caracteres** (letras y números sin espacios ni símbolos).\n` +
            `3. Especifica la **marca y modelo** exacto de tu auto.\n\n` +
            `${E.alerta} **Importante:**\n` +
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

      const disparadoresLicencia = [
        'como obtengo mi licencia',
        'como saco la licencia',
        'como saco mi licencia',
        'como consigo la licencia',
        'como consigo mi licencia',
        'como hago la licencia',
        'como saco licencia',
        'como obtener licencia',
        'como obtengo licencia',
        'donde saco la licencia',
        'donde saco licencia',
        'licencia de conducir',
        'licencia conducir',
        'examen de licencia',
        'examen licencia',
        'como tramito la licencia',
        'como tramitar licencia',
        'necesito licencia',
        'quiero la licencia',
        'quiero sacar licencia',
        'sacar licencia',
        'obtener licencia',
        'como recupero la licencia',
        'licencia revocada',
        'recuperar licencia'
      ];

      const activarLicencia = disparadoresLicencia.some(frase => textoNormalizado.includes(frase));

      if (activarLicencia) {
        const embedLicencia = new EmbedBuilder()
          .setColor('#8ae6fa')
          .setDescription(
            `${E.acoraflotante}\u2503 __**Licencia de Conducir SWFL**__\n\n` +
            `No es **obligatoria** para entrar a sesiones, pero **se recomienda**: sin ella podés recibir **multas graves** o **arrestos**.\n\n` +
            `${E.dot} **Opción A — Examen (recomendado)**\n` +
            `1. Leé el reglamento en <#1540355602704764968>\n` +
            `2. \`/licencia examen\` — 8 preguntas (aprobás con 6+)\n` +
            `3. \`/licencia tramitar\` — pagás **$5.000** y recibís el rol\n\n` +
            `${E.dot} **Opción B — Express (tienda)**\n` +
            `• \`/tienda abrir\` en el canal de **#comandos** → **Licencia de Conducir (Express)** por **$75.000** (sin examen)\n\n` +
            `${E.dot} **Si está REVOCADA**\n` +
            `• \`/licencia recuperar\` — 10 preguntas, mínimo 7 correctas\n\n` +
            `Más info: \`/licencia info\` · Estado: \`/licencia estado\``
          )
          .setFooter({
            text: message.guild.name,
            iconURL: message.guild.iconURL({ dynamic: true })
          });

        try {
          return await message.reply({ embeds: [embedLicencia] });
        } catch (error) {
          logger.error('Error enviando auto-responder de licencia:', error);
        }
      }

      const disparadoresPolicia = [
        'como me hago policia',
        'como ser policia',
        'como me hago poli',
        'como entro a policia',
        'como entro a la policia',
        'quiero ser policia',
        'quiero ser poli',
        'postularme a policia',
        'postular policia',
        'solicitud policia',
        'formulario policia',
        'como ingreso a policia',
        'como unirme a policia',
        'departamento de policia',
        'servicios publicos',
        'como me hago sheriff',
        'como ser oficial',
        'aplicar a policia',
        'aplicacion policia'
      ];

      const activarPolicia = disparadoresPolicia.some(frase => textoNormalizado.includes(frase));

      if (activarPolicia) {
        const embedPolicia = new EmbedBuilder()
          .setColor('#2c3e50')
          .setDescription(
            `${E.acoraflotante}\u2503 __**Cómo unirte al Departamento de Policía**__\n\n` +
            `El ingreso se gestiona por **Servicios Públicos** de 00Y4n.\n\n` +
            `${E.dot} **Pasos**\n` +
            `1. Unite al servidor de **División de Servicios Públicos** (si todavía no estás).\n` +
            `2. Completá el **formulario general** de Servicios Públicos cuando esté abierto.\n` +
            `3. Si te aceptan, postulá al **Departamento Policial del Condado de Sarasota**.\n` +
            `4. En Discord SWFL usá \`/solicitud-departamento\` → **Policía del Condado de Sarasota**.\n` +
            `5. Aprobá el **entrenamiento** y las instrucciones de Alto Comando / instructores.\n\n` +
            `${E.dot} **Importante**\n` +
            `• No alcanza con solo querer el rol: hay proceso de selección.\n` +
            `• Solo podés estar en **un departamento** a la vez.\n` +
            `• Los comandos policiales (\`/multar\`, \`/mdt\`, etc.) solo se usan con el rol de policía asignado.\n\n` +
            `Si tenés dudas, abrí un **ticket** en asistencia o preguntá en el servidor de Servicios Públicos.`
          )
          .setFooter({
            text: message.guild.name,
            iconURL: message.guild.iconURL({ dynamic: true })
          });

        try {
          return await message.reply({ embeds: [embedPolicia] });
        } catch (error) {
          logger.error('Error enviando auto-responder de policía:', error);
        }
      }


      // Auto-respuesta: qué es 00Y4n
      const textoTrim = textoNormalizado.trim().replace(/[?!.,¡¿]+$/g, '').trim();
      const activar00y4n =
        textoTrim === '00y4n' ||
        textoTrim === '00yan' ||
        textoTrim === 'ooy4n' ||
        textoNormalizado.includes('que es 00y4n') ||
        textoNormalizado.includes('que es 00yan') ||
        textoNormalizado.includes('que es ooy4n') ||
        textoNormalizado.includes('que significa 00y4n') ||
        textoNormalizado.includes('que significa 00yan');

      if (activar00y4n) {
        const embed00y4n = new EmbedBuilder()
          .setColor('#8ae6fa')
          .setTitle('Southwest Florida Comunidad 00Y4n')
          .setDescription(
            `¡Bienvenidos a **Southwest Florida 00Y4n**!\n\n` +
            `Somos un servidor **independiente** de Southwest Florida centrado en el ámbito **civil**, ` +
            `con el objetivo de garantizar una experiencia fluida y profesional para los ciudadanos dentro de nuestra comunidad.\n\n` +
            `Nuestro servidor ofrece numerosas posibilidades, incluidas **sesiones especiales de Roleplay** y **Carmeets** frecuentes, ` +
            `¡lo que permite a los jugadores sumergirse por completo en el mundo de Southwest Florida!`
          )
          .setFooter({
            text: message.guild.name,
            iconURL: message.guild.iconURL({ dynamic: true })
          });

        try {
          return await message.reply({ embeds: [embed00y4n] });
        } catch (error) {
          logger.error('Error enviando auto-responder de 00Y4n:', error);
        }
      }


    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  }
};
