import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

// Memoria global separada para almacenar los links de re-invitaciones de Car Meets
global.coleccionReinvitesMeet = global.coleccionReinvitesMeet || new Map();

// 🆔 CONFIGURACIÓN DEL ROL ADICIONAL 
const ROL_ADICIONAL_ID = '1491458302993891358'; 

export default {
    data: {
        name: 'reinvitar_meet_swfl',
        description: 'Lanza una re-invitación para el Car Meet actualizando la ubicación y temática.',
        options: [
            {
                name: 'tematica',
                description: 'Temática actual del Car Meet (Ej: JDM, Exóticos, Camionetas...)',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'ubicacion',
                description: 'Ubicación actual de la junta en el mapa (Ej: Puerto / Aeropuerto / Concesionario)',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'estado',
                description: 'Estado de los cupos / spots (Ej: ¡Últimos spots! / Servidor semi-vacío)',
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
                description: 'Sube la foto o banner de Re-Invitaciones para el Meet (opcional).',
                type: ApplicationCommandOptionType.Attachment,
                required: false
            }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Solo el Staff autorizado puede lanzar esto
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ 
                content: '❌ **No tienes permisos:** Solo el Staff puede lanzar re-invitaciones.', 
                ephemeral: true 
            });
        }

        const tematica = interaction.options.getString('tematica');
        const ubicacion = interaction.options.getString('ubicacion');
        const estado = interaction.options.getString('estado');
        const linkSesion = interaction.options.getString('acceso');
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        // Armamos el texto de mención combinando @everyone con la ID de tu rol
        const mencionCompleta = `@everyone <@&${ROL_ADICIONAL_ID}>`;

        // Embed adaptado al español con estilo 00Y4n enfocado en Car Meets
        const embedReinviteMeet = new EmbedBuilder()
            .setTitle('__<a:estrellasduo:1523026735719776388> SWFL Car Meet | Re-Invitación al Meet <a:estrellasduo:1523026735719776388>__')
            .setDescription(`<:punto:1523041306836996156> ¡<@${interaction.user.id}> ha liberado las **re-invitaciones** para el Car Meet! Son más que bienvenidos a unirse utilizando el botón de abajo.\n\n*Asegúrense de traer vehículos que cumplan con la temática actual y respeten las zonas de estacionamiento fijadas.*`)
            .addFields(
                { name: '<:info:1523041319046479964> Información de la Juntada', value: `<:fle:1523041359441952970> **Temática del Meet:** ${tematica}\n<:fel:1523041359441952970> **Ubicación Actual:** ${ubicacion}\n<:fele:1523041359441952970> **Estado del Servidor:** ${estado}`, inline: false }
            )
            .setFooter({ text: '🚗 Eviten hacer un car crash o molestar con el claxon para no ser expulsados.' })
            .setColor('#74d4fc'); // Tu nuevo color principal celestito

        // 🖼️ LÓGICA DE IMAGEN: Si suben foto usa esa, sino, clava la predeterminada "Reinvitaciones_NUEVO23.png"
        if (fotoAdjunta) {
            embedReinviteMeet.setImage(fotoAdjunta.url);
        } else {
            embedReinviteMeet.setImage('https://cdn.discordapp.com/attachments/1517331229303902432/1525334293155414168/Reinvitaciones_NUEVO23.png?ex=6a5301c2&is=6a51b042&hm=249f0eb4d460911059290ea5519b694da82d349400a99846334ab892f90943ad');
        }

        // Botón gris estático para obtener el link
        const filaComponentes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_reinvite_meet_swfl')
                .setLabel('Link de Re-Invitación')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: 'Generando anuncio de re-invitación para el Meet...', ephemeral: true });

        // Mandamos el ping doble y abajo el embed celestito con el botón
        const msgReinviteMeet = await interaction.channel.send({ 
            content: mencionCompleta, 
            embeds: [embedReinviteMeet], 
            components: [filaComponentes] 
        });

        // Guardamos el link en la memoria enlazado a este mensaje específico
        global.coleccionReinvitesMeet.set(msgReinviteMeet.id, linkSesion);
    }
};
