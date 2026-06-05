import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

// Memoria global separada para almacenar los links de re-invitaciones de Car Meets
global.coleccionReinvitesMeet = global.coleccionReinvitesMeet || new Map();

// 🆔 CONFIGURACIÓN DEL ROL ADICIONAL 
// (Pegá acá la ID del rol que querés mencionar junto a @everyone, ej: Civiles, Rol de Avisos, etc.)
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
            .setTitle('__🟠 SWFL Car Meet | Re-Invitación al Meet 🟠__')
            .setDescription(`▬ ¡<@${interaction.user.id}> ha liberado las **re-invitaciones** para el Car Meet! Son más que bienvenidos a unirse utilizando el botón de abajo.\n\n*Asegúrense de traer vehículos que cumplan con la temática actual y respeten las zonas de estacionamiento fijadas.*`)
            .addFields(
                { name: '📋 Información de la Juntada', value: `• **Temática del Meet:** ${tematica}\n• **Ubicación Actual:** ${ubicacion}\n• **Estado del Servidor:** ${estado}`, inline: false }
            )
            .setFooter({ text: '🚗 Eviten hacer un car crash o molestar con el claxon para no ser expulsados.' })
            .setColor('#ff6600'); // Tu naranja flama

        if (fotoAdjunta) embedReinviteMeet.setImage(fotoAdjunta.url);

        // Botón gris estático clonado de la imagen
        const filaComponentes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_reinvite_meet_swfl')
                .setLabel('Link de Re-Invitación')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: 'Generando anuncio de re-invitación para el Meet...', ephemeral: true });

        // Mandamos el ping doble y abajo el embed naranja con el botón
        const msgReinviteMeet = await interaction.channel.send({ 
            content: mencionCompleta, 
            embeds: [embedReinviteMeet], 
            components: [filaComponentes] 
        });

        // Guardamos el link en la memoria enlazado a este mensaje específico
        global.coleccionReinvitesMeet.set(msgReinviteMeet.id, linkSesion);
    }
};
