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

      if (message.author.bot || !message.guild) return;

      try { cachearMensaje(message); } catch {}

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
        'como me uno', 'como unirme', 'como se entra', 'como entro',
        'como entro a la sesion', 'como me uno a la sesion', 'link de la sesion',
        'link sesion', 'como juego', 'como se juega', 'pc o consola', 'como entrar'
      ];

      if (disparadoresUnirse.some(frase => textoNormalizado.includes(frase))) {
        const embedComoUnirse = new EmbedBuilder()
          .setColor('#74d4fc')
          .setDescription(
            `<a:flota:1534954466535674006>\u2503 __**Cómo Unirse a una Sesión**__\n\n` +
            `<:pc:1534938916057120839> **Si jugás en PC**\n` +
            `1. Registra tu vehículo con \`/matricula_swfl registrar\` (patente de 6-7 caracteres).\n` +
            `2. Esperá a que el host lance la sesión y reaccioná al mensaje de inicio.\n` +
            `3. Cuando se publique el link, hacé clic y unite.\n\n` +
            `<:consola:1534938916057120839> **Si jugás en Consola**\n` +
            `1. Registra tu vehículo con \`/matricula_swfl registrar\` (mismas reglas que arriba).\n` +
            `2. Mantente atento a los canales de <#1452644461745148049> y <#1501739933495201925>.\n` +
            `3. Los de consola **no pueden** usar links directos: pedile al **Host** que te agregue en Roblox.`
          )
          .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });
        try { return await message.reply({ embeds: [embedComoUnirse] }); }
        catch (error) { logger.error('Error auto-responder unirse:', error); }
      }

      const disparadoresRegistro = [
        'como registro', 'como se registra', 'como registrar', 'donde registro',
        'como matriculo', 'como matricular', 'donde matriculo', 'como registro mi auto',
        'registrar', 'matriculo', 'registro', 'como registro mi vehiculo'
      ];

      if (disparadoresRegistro.some(frase => textoNormalizado.includes(frase))) {
        const embedRegistro = new EmbedBuilder()
          .setColor('#74d4fc')
          .setDescription(
            `<a:flota:1534954466535674006>\u2503 __**Cómo Registrar tu Vehículo**__\n\n` +
            `1. \`/matricular registrar\` en <#1505615426305130657>.\n` +
            `2. Patente de **6 a 7 caracteres**.\n` +
            `3. Marca y modelo exactos.\n\n` +
            `Obligatorio para sesiones y evitar multas.`
          )
          .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });
        try { return await message.reply({ embeds: [embedRegistro] }); }
        catch (error) { logger.error('Error auto-responder registro:', error); }
      }

      const disparadoresLicencia = [
        'como obtengo mi licencia', 'como saco la licencia', 'como saco mi licencia',
        'como consigo la licencia', 'como consigo mi licencia', 'como hago la licencia',
        'como saco licencia', 'como obtener licencia', 'como obtengo licencia',
        'donde saco la licencia', 'donde saco licencia', 'licencia de conducir',
        'licencia conducir', 'examen de licencia', 'examen licencia',
        'como tramito la licencia', 'como tramitar licencia', 'necesito licencia',
        'quiero la licencia', 'quiero sacar licencia', 'sacar licencia',
        'obtener licencia', 'como recupero la licencia', 'licencia revocada', 'recuperar licencia'
      ];

      if (disparadoresLicencia.some(frase => textoNormalizado.includes(frase))) {
        const embedLicencia = new EmbedBuilder()
          .setColor('#fb8b66')
          .setDescription(
            `<a:flota:1534954466535674006>\u2503 __**Licencia de Conducir SWFL**__\n\n` +
            `No es **obligatoria**, pero **se recomienda**.\n\n` +
            `**A — Examen:** \`/licencia examen\` → \`/licencia tramitar\` ($5.000)\n` +
            `**B — Express:** \`/tienda abrir\` → Licencia Express **$75.000**\n` +
            `**Revocada:** \`/licencia recuperar\` (10 preg., min 7)\n\n` +
            `Reglamento: <#1540355602704764968> · \`/licencia info\``
          )
          .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });
        try { return await message.reply({ embeds: [embedLicencia] }); }
        catch (error) { logger.error('Error auto-responder licencia:', error); }
      }

      const disparadoresPolicia = [
        'como me hago policia', 'como ser policia', 'como me hago poli',
        'como entro a policia', 'como entro a la policia', 'quiero ser policia',
        'quiero ser poli', 'postularme a policia', 'postular policia',
        'solicitud policia', 'formulario policia', 'como ingreso a policia',
        'como unirme a policia', 'departamento de policia', 'servicios publicos',
        'como me hago sheriff', 'como ser oficial', 'aplicar a policia', 'aplicacion policia'
      ];

      if (disparadoresPolicia.some(frase => textoNormalizado.includes(frase))) {
        const embedPolicia = new EmbedBuilder()
          .setColor('#2c3e50')
          .setDescription(
            `<a:flota:1534954466535674006>\u2503 __**Cómo unirte al Departamento de Policía**__\n\n` +
            `El ingreso se gestiona por **Servicios Públicos** de 00Y4n.\n\n` +
            `<:dot:1534938142665084938> **Pasos**\n` +
            `1. Unite al servidor de **División de Servicios Públicos**.\n` +
            `2. Completá el **formulario general** cuando esté abierto.\n` +
            `3. Si te aceptan, postulá al **Departamento Policial del Condado de Sarasota**.\n` +
            `4. En SWFL: \`/solicitud-departamento\` → **Policía del Condado de Sarasota**.\n` +
            `5. Aprobá el **entrenamiento** con Alto Comando / instructores.\n\n` +
            `<:dot:1534938142665084938> **Importante**\n` +
            `• Hay proceso de selección; no se da el rol solo por pedir.\n` +
            `• Solo **un departamento** a la vez.\n` +
            `• Comandos como \`/multar\` y \`/mdt\` requieren el rol de policía.\n\n` +
            `Dudas: ticket en asistencia o el servidor de Servicios Públicos.`
          )
          .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });
        try { return await message.reply({ embeds: [embedPolicia] }); }
        catch (error) { logger.error('Error auto-responder policia:', error); }
      }
    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  }
};
