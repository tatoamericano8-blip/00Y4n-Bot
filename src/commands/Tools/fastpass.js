import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

// --- DICCIONARIO DE EMOJIS ---
const EMOJIS = {
    flechaH: '<:FlechaHoriz00Y4n:1519474590370500608>',
    flechaV: '<:Flecha_00Y4n:1519473149845045400>',
    coraaMov: '<a:coraamov00y4n:1519475012283666554>'
};

// Memoria global para guardar los links de FastPass en secreto
global.coleccionFastPass = global.coleccionFastPass || new Map();

// 🆔 CONFIGURACIÓN DE ROLES (Poné acá las 2 IDs reales de tu servidor)
const ROLES_VIP_IDS = [
    '1512120103771050005', // ID del Rol: Equipo de Staff
    '1503769793474597027'  // ID del Rol: FastPass
];

export default {
    data: {
        name: 'fastpass_swfl',
        description: 'Lanza el anuncio de FastPass únicamente para los roles de FastPass y Staff.',
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

        // Armamos la cadena de menciones de roles usando las 2 IDs configuradas arriba
        const mencionesRoles = ROLES_VIP_IDS.map(id => `<@&${id}>`).join(' ');

        // Embed con estética 00Y4n
        const embedFastPass = new EmbedBuilder()
            .setTitle(`${EMOJIS.coraaMov} __FastPass de la Sesión__ ${EMOJIS.coraaMov}`)
            .setDescription(`${EMOJIS.flechaV} El FastPass ha sido **liberado para la sesión**. Los miembros que adquirieron su pase de FastPass y el Equipo de Staff ya pueden unirse utilizando el botón de abajo.\n\n*Compartir este enlace resultará en la revocación permanente de tus permisos de FastPass.*\n\n<a:si:1520905604720496843> ¿Quieres unirte antes que el resto? Adquiere tu pase de **FastPass** correspondiente en el canal de beneficios del servidor.`)
            .setColor('#ff6600'); // Tu naranja insignia

        // 🖼️ Imagen por defecto
        const urlPredeterminada = 'https://cdn.discordapp.com/attachments/1505017301089652898/1515546631360086107/ChatGPT_Image_4_jun_2026_13_02_43.png?ex=6a3fe10a&is=6a3e8f8a&hm=50583c5a9ed9c868a04078af82ac1135f50798218139bd1d05e25b48e2403b34&'; 
        embedFastPass.setImage(fotoAdjunta ? fotoAdjunta.url : urlPredeterminada);

        // Botón gris estático
        const filaComponentes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_fastpass_swfl')
                .setLabel('FastPass')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: 'Lanzando el anuncio de FastPass restringido...', ephemeral: true });

        // Enviamos las menciones y el embed
        const msgFastPass = await interaction.channel.send({ 
            content: mencionesRoles, 
            embeds: [embedFastPass], 
            components: [filaComponentes] 
        });

        // Guardamos el link indexado
        global.coleccionFastPass.set(msgFastPass.id, linkSesion);
    }
};
