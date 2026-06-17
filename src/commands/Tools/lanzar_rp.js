import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

// 🖼️ URL DE LA IMAGEN PREDETERMINADA PARA ROLEPLAY
const IMAGEN_RP_DEFECTO = 'https://cdn.discordapp.com/attachments/1505017301089652898/1515546633440329869/ChatGPT_Image_31_may_2026_20_26_33.png?ex=6a34038a&is=6a32b20a&hm=c43e921cf0f60e70024509c7734fc6ff4539d2fa510bc509cf9a0209fc37cbb5&'; 

export default {
    data: {
        name: 'lanzar_rp_swfl',
        description: 'Libera los accesos para una sesión oficial de Roleplay.',
        options: [
            { name: 'mensaje', description: 'Copia el ID del mensaje de Startup original.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'acceso', description: 'Pegá acá el enlace del servidor privado de Roblox.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'limite_velocidad', description: 'Ejemplo: 75 MPH / 80 MPH', type: ApplicationCommandOptionType.String, required: true },
            { name: 'peacetime', description: 'Ejemplo: On / Off', type: ApplicationCommandOptionType.String, required: true },
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
        const limite = interaction.options.getString('limite_velocidad');
        const peacetime = interaction.options.getString('peacetime');
        const urlImagen = interaction.options.getString('imagen');

        // Estructura adaptada combinando image_44d5e2.png y el lanzamiento anterior
        const infoDescripcion = 
            `> ▬ <@${interaction.user.id}> ¡ha lanzado su sesión! Eres bienvenido a unirte utilizando el botón de abajo. Antes de ingresar al servidor, asegúrate de haber leído la información detallada a continuación.\n\n` +
            `**Antes de Unirte**\n\n` +
            `> ➔ Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
            `> ➔ Lee la [información](https://discord.com/channels/1451939725308067842/1516590524725989437) & la [lista de vehículos baneados](https://discord.com/channels/1451939725308067842/1516833571883585627).\n` +
            `> ➔ Registra tus vehículos en <#1516832509222981864>!\n\n` +
            `**Información del Roleplay**\n\n` +
            `• **Estado de Peacetime:** ${peacetime}\n` +
            `• **Velocidad de Fail Roleplay:** ${limite}\n` +
            `╰ Las velocidades de detención son **+6 MPH** sobre el límite de velocidad establecido.\n\n` +
            `➴ *¡Cualquier miembro descubierto haciendo Fail Roleplay de forma excesiva será expulsado inmediatamente de la sesión!*`;

        const embedRelease = new EmbedBuilder()
            .setTitle('╰ Southwest Florida – *__Roleplay Sesión Lanzada__* ╮')
            .setDescription(infoDescripcion)
            .setColor('#ff6600');

        if (urlImagen) {
            embedRelease.setImage(urlImagen);
        } else if (IMAGEN_RP_DEFECTO !== '') {
            embedRelease.setImage(IMAGEN_RP_DEFECTO);
        }

        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_voto_swfl')
                .setLabel('Link de la Sesión')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: 'Liberando accesos de Roleplay...', ephemeral: true });
        
        const msgRelease = await interaction.channel.send({ 
            content: '@everyone <@&1503763201274413056>', // Reemplazar por tu ID de rol de avisos
            embeds: [embedRelease], 
            components: [fila] 
        });

        global.coleccionSesiones.set(msgRelease.id, { idInicio, linkSesion });
    }
};
