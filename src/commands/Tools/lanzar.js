import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();


export default {
    data: {
        name: 'lanzar_swfl',
        description: 'Lanza el botón de acceso para la sesión de SWFL vinculándolo al inicio.',
        options: [
            { name: 'mensaje', description: 'Copia el ID del mensaje de Startup original.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'tipo', description: '¿Roleplay o Car Meet?', type: ApplicationCommandOptionType.String, required: true, choices: [ { name: 'Roleplay', value: 'rp' }, { name: 'Car Meet', value: 'meet' } ] },
            { name: 'acceso', description: 'Pegá acá el enlace del servidor privado de Roblox.', type: ApplicationCommandOptionType.String, required: true },
            // 🔥 NUEVAS OPCIONES DINÁMICAS:
            { name: 'limite_o_tematica', description: 'Ej RP: 75 MPH | Ej Meet: JDM, Exóticos, etc.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'peacetime_o_ubicacion', description: 'Ej RP: On / Off | Ej Meet: Spawn, Puerto, etc.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'imagen', description: 'Link de la foto/banner para la apertura (opcional).', type: ApplicationCommandOptionType.String, required: false }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Bloqueo para evitar que cualquiera tire links falsos
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ **No tienes permisos:** Solo el Staff puede liberar los accesos de la sesión.',
                ephemeral: true
            });
        }

        const idInicio = interaction.options.getString('mensaje');
        const tipo = interaction.options.getString('tipo');
        const linkSesion = interaction.options.getString('acceso');
        const urlImagen = interaction.options.getString('imagen');
        
        // 📥 CAPTURA DE LOS DATOS QUE VOS ESCRIBAS
        // Estructura de títulos clonada de la imagen image_4554ae.jpg
        const titulo = tipo === 'rp' 
            ? '╰ Southwest Florida – *__Roleplay Sesión Lanzada__* ╮' 
            : '╰ Southwest Florida – *__Car Meet Sesión Lanzada__* ╮';

        // Contenido interno totalmente dinámico (Con Spots/Duración adaptado al estilo de la foto)
        const infoDescripcion = tipo === 'rp'
            ? `> ▬ <@${interaction.user.id}> ¡ha liberado su sesión! Eres bienvenido a unirte utilizando el botón de abajo. Antes de ingresar al servidor, asegúrate de haber leído la información detallada a continuación.\n\n` +
              `**Información del Roleplay**\n\n` +
              `• **Estado de Peacetime:** ${dato2}\n` +
              `• **Velocidad de Fail Roleplay:** ${dato1}\n` +
              `╰ Las velocidades de detención son **6+ MPH** sobre el límite de velocidad establecido.\n\n` +
              `➴ *¡Cualquier miembro descubierto haciendo Fail Roleplay de forma excesiva será expulsado inmediatamente de la sesión!*`
            : `> ▬ <@${interaction.user.id}> ¡ha liberado su car meet! Eres bienvenido a unirte utilizando el botón de abajo. Antes de ingresar al servidor, asegúrate de haber leído la información detallada a continuación.\n\n` +
              `**Información del Car Meet**\n\n` +
              `• **Temática del Meet:** ${dato1}\n` +
              `• **Lugar de Encuentro:** ${dato2}\n` +
              `• **Spots / Duración:** Según lo acordado en el Startup\n` +
              `╰ Los cupos en pista son limitados según la capacidad del servidor de Roblox.\n\n` +
              `➴ *¡Cualquier miembro descubierto haciendo Choques de Vehiculos o saboteando el orden será expulsado e ingresará directo a la blacklist!*`;

        const embedRelease = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(infoDescripcion)
            .setColor('#ff6600');
        // Lógica de Imagen Inteligente (Prioridad a la adjunta, si no usa la de defecto)
        if (urlImagen) {
            embedRelease.setImage(urlImagen);
        } else if (IMAGEN_POR_DEFECTO !== '') {
            embedRelease.setImage(IMAGEN_POR_DEFECTO);
        }

        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_voto_swfl')
                .setLabel('Link de la Sesión')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: 'Lanzando sistema de accesos...', ephemeral: true });
        
        // Pings automáticos integrados (@everyone + ID de tu Rol de Avisos)
        const msgRelease = await interaction.channel.send({ 
            content: '@everyone , // 👈 Acordate de cambiar esta ID por la de tu rol
            embeds: [embedRelease], 
            components: [fila] 
        });

        global.coleccionSesiones.set(msgRelease.id, { idInicio, linkSesion });
    }
};
