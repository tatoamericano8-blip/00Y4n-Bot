import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';

// 🔒 ID del rol exclusivo con permiso para usar este comando
const ID_ROL_PERMITIDO = '1451956429345919008';

export default {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Envía un mensaje privado (DM) a los usuarios especificados.')
    .addStringOption(option =>
      option
        .setName('mensaje')
        .setDescription('Texto del mensaje (cuerpo del embed amarillo)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('destinatarios')
        .setDescription('A quién enviar: menciones de miembros, roles, IDs o "todos"')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      // -------------------------------------------------------------
      // 🔒 1. VERIFICACIÓN DE SEGURIDAD POR ROL
      // -------------------------------------------------------------
      const tieneRol = interaction.member.roles.cache.has(ID_ROL_PERMITIDO);

      if (!tieneRol) {
        return await interaction.reply({
          content: '❌ **Acceso denegado:** No tenés el rol necesario para ejecutar este comando.',
          ephemeral: true
        });
      }

      // Diferimos la respuesta porque enviar mensajes masivos lleva unos segundos
      await interaction.deferReply({ ephemeral: true });

      const textoMensaje = interaction.options.getString('mensaje');
      const entradaDestinatarios = interaction.options.getString('destinatarios');

      // -------------------------------------------------------------
      // 🎯 2. OBTENER LISTA DE USUARIOS OBJETIVO
      // -------------------------------------------------------------
      const usuariosObjetivo = new Set(); // Evita enviar duplicados al mismo usuario
      const guild = interaction.guild;

      // Asegurarnos de tener los miembros en caché
      await guild.members.fetch();

      const textoLimpio = entradaDestinatarios.toLowerCase().trim();

      if (textoLimpio === 'todos' || textoLimpio === '@everyone' || textoLimpio === '@here') {
        // Enviar a todos los miembros del servidor (excluyendo bots)
        guild.members.cache.forEach(member => {
          if (!member.user.bot) usuariosObjetivo.add(member.user);
        });
      } else {
        // Extraer IDs numéricas de la entrada (menciones <@id>, <@&rol_id> o números sueltos)
        const idsDetectadas = entradaDestinatarios.match(/\d+/g) || [];

        for (const id of idsDetectadas) {
          // A) ¿Es un rol?
          const rol = guild.roles.cache.get(id);
          if (rol) {
            rol.members.forEach(member => {
              if (!member.user.bot) usuariosObjetivo.add(member.user);
            });
            continue;
          }

          // B) ¿Es un usuario/miembro?
          const miembro = guild.members.cache.get(id);
          if (miembro && !miembro.user.bot) {
            usuariosObjetivo.add(miembro.user);
          }
        }
      }

      if (usuariosObjetivo.size === 0) {
        return await interaction.editReply({
          content: '❌ No se encontraron usuarios válidos a los cuales enviar el mensaje.'
        });
      }

      // -------------------------------------------------------------
      // 🎨 3. CONSTRUIR EL EMBED AMARILLO
      // -------------------------------------------------------------
      const embedDM = new EmbedBuilder()
        .setColor('#FFC107') // Color Amarillo / Dorado
        .setDescription(textoMensaje)
        .setFooter({
          text: `Mensaje enviado desde ${guild.name}`,
          iconURL: guild.iconURL({ dynamic: true })
        })
        .setTimestamp();

      // -------------------------------------------------------------
      // 🚀 4. ENVÍO MASIVO CON CONTROL DE ERRORES Y DELAY
      // -------------------------------------------------------------
      let enviadosConExito = 0;
      let fallidos = 0;

      await interaction.editReply({
        content: `⏳ Procesando envío masivo a **${usuariosObjetivo.size}** usuario(s)...`
      });

      for (const usuario of usuariosObjetivo) {
        try {
          await usuario.send({ embeds: [embedDM] });
          enviadosConExito++;
        } catch (error) {
          // Ocurre si el usuario tiene los DMs cerrados o bloqueó al bot
          fallidos++;
        }

        // Delay de 300ms entre envíos para evitar ser bloqueados por el Rate Limit de Discord
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // -------------------------------------------------------------
      // 📊 5. REPORTE FINAL
      // -------------------------------------------------------------
      await interaction.editReply({
        content: 
          `✅ **Proceso finalizado con éxito.**\n\n` +
          ` enviaron **${enviadosConExito}** mensajes correctamente.\n` +
          `❌ No se pudo enviar a **${fallidos}** usuarios (DMs cerrados o bloqueados).`
      });

    } catch (error) {
      logger.error('Error al ejecutar el comando /dm:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ Ocurrió un error al intentar enviar los mensajes.' });
      } else {
        await interaction.reply({ content: '❌ Ocurrió un error al intentar ejecutar el comando.', ephemeral: true });
      }
    }
  }
};
