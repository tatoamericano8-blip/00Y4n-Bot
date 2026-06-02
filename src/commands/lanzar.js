import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// Inicializamos una memoria segura para guardar los links de Roblox sin saturar el botón de Discord
global.coleccionSesiones = global.coleccionSesiones || new Map();

export default {
    data: {
        name: 'lanzar_swfl', 
        description: 'Lanza el botón de acceso para la sesión de SWFL vinculándolo al inicio.',
        options: [
            { 
                name: 'mensaje', 
                description: 'Copia el ID del mensaje de Startup original.', 
                type: ApplicationCommandOptionType.String, 
                required: true 
            },
            { 
                name: 'tipo', 
                description: '¿Roleplay o Car Meet?', 
                type: ApplicationCommandOptionType.String, 
                required: true, 
                choices: [{ name: 'Roleplay', value: 'rp' }, { name: 'Car Meet', value: 'meet' }] 
            },
            { 
                name: 'acceso', 
                description: 'Pegá acá el enlace del servidor privado de Roblox.', 
                type: ApplicationCommandOptionType.String, 
                required: true 
            },
            { 
                name: 'imagen', 
                description: 'Link de la foto/banner para la apertura (opcional).', 
                type: ApplicationCommandOptionType.String, 
                required: false 
            }
        ]
    },

    async execute(interaction) {
        const idInicio = interaction.options.getString('mensaje');
        const tipo = interaction.options.getString('tipo');
        const linkSesion = interaction.options.getString('acceso');
        const urlImagen = interaction.options.getString('imagen');

        // Guardamos el link larguísimo en la memoria global usando el ID del mensaje como llave
        global.coleccionSesiones.set(idInicio, linkSesion);

        const titulo = tipo === 'rp' ? '__SWFL Roleplay Release__' : '__SWFL Meet Release__';

        const embedRelease = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(`> **Anfitrión:** <@${interaction.user.id}>\n\nLa sesión fue oficialmente lanzada. Si aportaste tu reacción en el mensaje de inicio, toca el botón de abajo para obtener el acceso.\n\n⚠️ *Filtrar el enlace directo es motivo de ban.*`)
            .setColor('#ff6600');

        if (urlImagen) embedRelease.setImage(urlImagen);

        // Ahora el CustomId es ultra corto y seguro, evitando el error de "Invalid string length"
        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`verificar_voto_${idInicio}`)
                .setLabel('Link de la Sesión')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: 'Lanzando sistema de accesos...', ephemeral: true });
        await interaction.channel.send({ content: '@everyone', embeds: [embedRelease], components: [fila] });
    }
};
