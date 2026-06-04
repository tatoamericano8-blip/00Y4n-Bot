import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

// Memoria global para almacenar los links de las re-invitaciones en curso
global.coleccionReinvites = global.coleccionReinvites || new Map();

// 🆔 CONFIGURACIÓN DEL ROL ADICIONAL 
// (Pegá acá la ID del rol que querés mencionar junto a @everyone, ej: Civiles, Rol de Avisos, etc.)
const ROL_ADICIONAL_ID = '1503763201274413056'; 

export default {
    data: {
        name: 'reinvitar_swfl',
        description: 'Lanza una re-invitación a la sesión actualizando el estado del servidor.',
        options: [
            {
                name: 'peacetime',
                description: 'Estado actual del Peacetime (Ej: Activo / Inactivo / Estricto)',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'frp',
                description: 'Límite de velocidad para evitar Fail Roleplay (Ej: 65 MPH / 80 MPH)',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'ley',
                description: 'Estado de las Fuerzas Policiales / Aplicación de la ley (Ej: Activa / Alerta)',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'acceso',
                description: 'Pegá acá el enlace del servidor privado de Roblox.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'imagen',
                description: 'Sube la foto o banner de Re-Invitaciones (opcional).',
                type: ApplicationCommandOptionType.Attachment,
                required: false
            }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Solo el Staff autorizado puede re-invitar
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ 
                content: '❌ **No tienes permisos:** Solo el Staff puede lanzar re-invitaciones.', 
                ephemeral: true 
            });
        }

        const peacetime = interaction.options.getString('peacetime');
        const frp = interaction.options.getString('frp');
        const ley = interaction.options.getString('ley');
        const linkSesion = interaction.options.getString('acceso');
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        // Armamos el texto de mención combinando @everyone con la ID de tu rol
        const mencionCompleta = `@everyone <@&${ROL_ADICIONAL_ID}>`;

        // Embed adaptado al español con estilo 00Y4n y color naranja
        const embedReinvite = new EmbedBuilder()
            .setTitle(' SWFL Roleplay | Re-Invitación a la Sesión ')
            .setDescription(`▬ ¡<@${interaction.user.id}> ha liberado las **re-invitaciones** para su sesión! Son más que bienvenidos a unirse utilizando el botón de abajo.\n\n*Antes de ingresar a la sesión, asegúrense de haber leído la información detallada aquí abajo respecto al estado del juego.*`)
            .addFields(
                { name: '📋 Información del Roleplay', value: `• **Estado del Peacetime:** ${peacetime}\n• **Velocidad de Fail Roleplay (FRP):** ${frp}\n• **Aplicación de la Ley (L.E.O):** ${ley}`, inline: false }
            )
            .setFooter({ text: '🚗 Las paradas de tránsito se ejecutan superando el límite establecido.' })
            .setColor('#ff6600');

        if (fotoAdjunta) embedReinvite.setImage(fotoAdjunta.url);

        // Botón gris estático idéntico al de image_30577e.png
        const filaComponentes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_reinvite_swfl')
                .setLabel('Link de Re-Invitación')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: 'Generando anuncio de re-invitación...', ephemeral: true });

        // Mandamos el ping doble (@everyone + tu rol) y abajo el cuadro naranja con el botón
        const msgReinvite = await interaction.channel.send({ 
            content: mencionCompleta, 
            embeds: [embedReinvite], 
            components: [filaComponentes] 
        });

        // Guardamos el link en la memoria enlazado a este mensaje
        global.coleccionReinvites.set(msgReinvite.id, linkSesion);
    }
};
