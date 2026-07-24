import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

// 🖼️ URL DE LA IMAGEN PREDETERMINADA PARA CAR MEETS
const IMAGEN_MEET_DEFECTO = 'https://cdn.discordapp.com/attachments/1517331229303902432/1524843381740540034/Lanzamiento_CM_23NUEVO.png?ex=6a51e150&is=6a508fd0&hm=147ad177d52612dab13a5eeba74cec6be378cb6eeb1b19cd3df25492e7ab3d49&'; 

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

        // 📝 Obtenemos las opciones ingresadas por el usuario
        const idInicio = interaction.options.getString('mensaje_id');
        const linkSesion = interaction.options.getString('acceso');
        const tematica = interaction.options.getString('tematica');
        const ubicacion = interaction.options.getString('ubicacion');
        const spots = interaction.options.getString('spots_duracion');
        const urlImagen = interaction.options.getString('imagen');

        const infoDescripcion = 
            `> <:punto:1523041306836996156> <@${interaction.user.id}> **¡ha lanzado un Car Meet oficial!** Eres bienvenido a unirte utilizando el botón de abajo. Antes de ingresar al servidor, asegúrate de haber leído la información detallada a continuación.\n\n` +
            `**<:caram00y4nmov:1523041315187855470> Antes de Unirte**\n\n` +
            `> <a:si:1523027371735777503> Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
            `> <a:si:1523027371735777503> Lee la [información](https://discord.com/channels/1451939725308067842/1451942179877687399) & la [lista de vehículos baneados](https://discord.com/channels/1451939725308067842/1452644461745148049/1524916351733469305).\n\n` +
            `**<:caram00y4nmov:1523041315187855470> Información del Car Meet**\n\n` +
            `<:uno:1523028217592676464> **Temática del Meet:** ${tematica}\n` +
            `<:dos:1523027468385128568> **Lugar de Inicio:** ${ubicacion}\n` +
            `<:tres:1523027610479759561> **Spots / Duración:** ${spots}\n` +
            `<:flechareplica:1523028004983406787> Los vehículos deben ingresar __despacio__ al lugar actual del meet.\n\n` +
            `➴ *¡Cualquier miembro descubierto haciendo Choque de vehículos o saboteando el orden será __expulsado__ e ingresará directo a la blacklist!*`;

        const embedRelease = new EmbedBuilder()
            .setTitle('<a:confeti:1523026892981145600> Southwest Florida – ***__Car Meet Sesión Lanzada__*** <a:confeti:1523026892981145600>')
            .setDescription(infoDescripcion)
            .setColor('#74d4fc');

        if (urlImagen) {
            embedRelease.setImage(urlImagen);
        } else if (IMAGEN_MEET_DEFECTO !== '') {
            embedRelease.setImage(IMAGEN_MEET_DEFECTO);
        }

        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_voto_swfl')
                .setLabel('Link de la Sesión')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('1529995334883872909')
        );

        await interaction.reply({ content: 'Liberando accesos del Car Meet...', ephemeral: true });

        const msgRelease = await interaction.channel.send({ 
            content: '@everyone <@&1491458302993891358>', 
            embeds: [embedRelease], 
            components: [fila] 
        });

        // Guardamos los datos en la memoria vinculando la ID manual y seteando tipo 'meet'
        global.coleccionSesiones.set(msgRelease.id, { 
            idInicio, 
            linkSesion, 
            tematica,
            ubicacion,
            spots,
            guildId: interaction.guildId, 
            tipo: 'meet' 
        });
    }
};
