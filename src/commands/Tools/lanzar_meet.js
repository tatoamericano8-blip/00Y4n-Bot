import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

// 🖼️ URL DE LA IMAGEN PREDETERMINADA PARA CAR MEETS
const IMAGEN_MEET_DEFECTO = 'https://cdn.discordapp.com/attachments/1505017301089652898/1515546632026849341/ChatGPT_Image_29_may_2026_22_32_14.png?ex=6a34038a&is=6a32b20a&hm=277638dc93cbde101233dc5ca54ac6e79b471cf82f4a4cc66f10905addec55c2&'; 

export default {
    data: {
        name: 'lanzar_meet_swfl',
        description: 'Libera los accesos para un Car Meet oficial.',
        options: [
            { name: 'mensaje_id', description: 'Pegá acá la ID del mensaje de Startup/Inicio de esta sesión.', type: ApplicationCommandOptionType.String, required: true },
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
                content: '<:cruz00y4n:1519476959606734998> **No tienes permisos:** Solo el Staff puede liberar los accesos de la sesión.',
                ephemeral: true
            });
        }

        // 📝 Obtenemos la ID de forma manual desde las opciones
        const idInicio = interaction.options.getString('mensaje_id');
        const linkSesion = interaction.options.getString('acceso');
        const tematica = interaction.options.getString('tematica');
        const ubicacion = interaction.options.getString('ubicacion');
        const spots = interaction.options.getString('spots_duracion');
        const urlImagen = interaction.options.getString('imagen');

        const infoDescripcion = 
            `> ▬ <@${interaction.user.id}> **¡ha lanzado un Car Meet oficial!** Eres bienvenido a unirte utilizando el botón de abajo. Antes de ingresar al servidor, asegúrate de haber leído la información detallada a continuación.\n\n` +
            `**<a:caram00y4nmov:1519474823309426699> Antes de Unirte**\n\n` +
            `> <:00y4ncirpunto:1519474782117171392> Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
            `> <:00y4ncirpunto:1519474782117171392> Lee la [información](https://discord.com/channels/1451939725308067842/1451942179877687399) & la [lista de vehículos baneados](https://discord.com/channels/1451939725308067842/1516833571883585627).\n\n` +
            `**<a:caram00y4nmov:1519474823309426699> Información del Car Meet**\n\n` +
            `• **Temática del Meet:** ${tematica}\n` +
            `• **Lugar de Inicio:** ${ubicacion}\n` +
            `• **Spots / Duración:** ${spots}\n` +
            `╰ Los vehículos deben ingresar __despacio__ al lugar actual del meet.\n\n` +
            `➴ *¡Cualquier miembro descubierto haciendo Choque de vehículos o saboteando el orden será __expulsado__ e ingresará directo a la blacklist!*`;

        const embedRelease = new EmbedBuilder()
            .setTitle('<a:caram00y4nmov:1519474823309426699> Southwest Florida – ***__Car Meet Sesión Lanzada__*** <a:caram00y4nmov:1519474823309426699>')
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
            content: '@everyone <@&1491458302993891358>', // ID del rol de anuncios
            embeds: [embedRelease], 
            components: [fila] 
        });

        // Guardamos los datos en la memoria vinculando la ID manual y seteando tipo 'meet'
        global.coleccionSesiones.set(msgRelease.id, { 
            idInicio, 
            linkSesion, 
            guildId: interaction.guildId, 
            tipo: 'meet' 
        });
    }
};
