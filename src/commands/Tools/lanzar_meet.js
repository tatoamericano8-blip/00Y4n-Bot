import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

// 🖼️ URL DE LA IMAGEN PREDETERMINADA PARA CAR MEETS
const IMAGEN_MEET_DEFECTO = 'https://cdn.discordapp.com/attachments/1505017301089652898/1515546632026849341/ChatGPT_Image_29_may_2026_22_32_14.png?ex=6a34038a&is=6a32b20a&hm=277638dc93cbde101233dc5ca54ac6e79b471cf82f4a4cc66f10905addec55c2&'; 

export default {
    data: {
        name: 'lanzar_meet_swfl',
        description: 'Libera los accesos para un Car Meet oficial.',
        options: [
            { name: 'mensaje', description: 'Copia el ID del mensaje de Startup original.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'acceso', description: 'Pegá acá el enlace del servidor privado de Roblox.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'tematica', description: 'Ejemplo: JDM, Exóticos, Camionetas', type: ApplicationCommandOptionType.String, required: true },
            { name: 'ubicacion', description: 'Lugar de concentración (Ej: Puerto, Aeropuerto)', type: ApplicationCommandOptionType.String, required: true },
            { name: 'spots_duracion', description: 'Ejemplo: 3 Spots / 45 Minutos', type: ApplicationCommandOptionType.String, required: true },
            { name: 'imagen', description: 'Link de la foto/banner para la apertura (opcional).', type: ApplicationCommandOptionType.String, required: false }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Bloqueo de Staff
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ **No tienes permisos:** Solo el Staff puede liberar los accesos de la sesión.',
                ephemeral: true
            });
        }

        const idInicio = interaction.options.getString('mensaje');
        const linkSesion = interaction.options.getString('acceso');
        const tematica = interaction.options.getString('tematica');
        const ubicacion = interaction.options.getString('ubicacion');
        const spots = interaction.options.getString('spots_duracion');
        const urlImagen = interaction.options.getString('imagen');

        // Modificado: Se eliminó el requisito de registrar vehículos para el meet
        const infoDescripcion = 
            `> ▬ <@${interaction.user.id}> ¡ha lanzado su car meet! Eres bienvenido a unirte utilizando el botón de abajo. Antes de ingresar al servidor, asegúrate de haber leído la información detallada a continuación.\n\n` +
            `**Antes de Unirte**\n\n` +
            `> ➔ Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
            `> ➔ Lee la [información](https://discord.com/channels/1451939725308067842/1451942179877687399) & la [lista de vehículos baneados](https://discord.com/channels/1451939725308067842/1516833571883585627).\n\n` +
            `**Información del Car Meet**\n\n` +
            `• **Temática del Meet:** ${tematica}\n` +
            `• **Lugar de Inicio:** ${ubicacion}\n` +
            `• **Spots / Duración:** ${spots}\n` +
            `╰ Los vehiculos deben ingresar __despacio__ al lugar actual del meet.\n\n` +
            `➴ *¡Cualquier miembro descubierto haciendo Choque de vehiculos o saboteando el orden será __expulsado__ e ingresará directo a la blacklist!*`;

        const embedRelease = new EmbedBuilder()
            .setTitle('╰ Southwest Florida – ***__Car Meet Sesión Lanzada__*** ╮')
            .setDescription(infoDescripcion)
            .setColor('#ff6600');

        if (urlImagen) {
            embedRelease.setImage(urlImagen);
        } else if (IMAGEN_MEET_DEFECTO !== '') {
            embedRelease.setImage(IMAGEN_MEET_DEFECTO);
        }

        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_voto_swfl')
                .setLabel('Link de la Sesión')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: 'Liberando accesos del Car Meet...', ephemeral: true });
        
        const msgRelease = await interaction.channel.send({ 
            content: '@everyone <@&1491458302993891358>', // Poné acá la ID de tu rol de anuncios
            embeds: [embedRelease], 
            components: [fila] 
        });

        global.coleccionSesiones.set(msgRelease.id, { idInicio, linkSesion });
    }
};
