import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

// Memoria global para guardar los links de FastPass en secreto
global.coleccionFastPass = global.coleccionFastPass || new Map();

// 🆔 CONFIGURACIÓN DE ROLES (Reemplazá estos números por las IDs reales de tus roles en Discord)
const ROLES_VIP_IDS = [
    '1484294519234105638', // ID del Rol: Nitro Contributor / Booster  
    '1512120103771050005', // ID del Rol: Equipo de Staff
    '1503769793474597027'  // ID del Rol: FastPass
];

export default {
    data: {
        name: 'fastpass_swfl',
        description: 'Lanza el anuncio de FastPass para los roles VIP y Staff.',
        options: [
            {
                name: 'acceso',
                description: 'Pegá acá el enlace del servidor privado de Roblox para el FastPass.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'imagen',
                description: 'Sube la foto o banner de FastPass (opcional).',
                type: ApplicationCommandOptionType.Attachment,
                required: false
            }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Solo el Staff con permiso de Gestionar Mensajes puede lanzar esto
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ 
                content: '❌ **No tienes permisos:** Solo el Staff puede habilitar el FastPass.', 
                ephemeral: true 
            });
        }

        const linkSesion = interaction.options.getString('acceso');
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        // Armamos la cadena de menciones de roles usando las IDs configuradas arriba
        const mencionesRoles = ROLES_VIP_IDS.map(id => `<@&${id}>`).join(' ');

        // Traducción y adaptación impecable al estilo 00Y4n
        const embedFastPass = new EmbedBuilder()
            .setTitle('🧡 FastPass de la Sesión 🧡')
            .setDescription(`▬ El FastPass ha sido **liberado para la sesión**. Los Colaboradores de Nitro, miembros con FastPass y el Equipo de Staff ya pueden unirse utilizando el botón de abajo.\n\n*Compartir este enlace resultará en la revocación permanente de tus permisos de FastPass.*\n\n➔ ¿Querés unirte al **FastPass**? ¡Convertite en Booster del servidor o adquirí el pase correspondiente en el canal de beneficios!`)
            .setColor('#ff6600'); // Tu naranja insignia

        if (fotoAdjunta) embedFastPass.setImage(fotoAdjunta.url);

        // Botón gris estático para TitanBot (Estilo idéntico a la imagen)
        const filaComponentes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_fastpass_swfl')
                .setLabel('FastPass')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: 'Lanzando el anuncio de FastPass...', ephemeral: true });

        // Enviamos las menciones de los roles juntas y abajo el Embed con el botón
        const msgFastPass = await interaction.channel.send({ 
            content: mencionesRoles, 
            embeds: [embedFastPass], 
            components: [filaComponentes] 
        });

        // Guardamos el link indexado por el ID de este mensaje
        global.coleccionFastPass.set(msgFastPass.id, linkSesion);
    }
};
