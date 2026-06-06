import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

export default {
    data: {
        name: 'lanzar_swfl', 
        description: 'Lanza el botón de acceso para la sesión de SWFL vinculándolo al inicio.',
        options: [
            { name: 'mensaje', description: 'Copia el ID del mensaje de Startup original.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'tipo', description: '¿Roleplay o Car Meet?', type: ApplicationCommandOptionType.String, required: true, choices: [{ name: 'Roleplay', value: 'rp' }, { name: 'Car Meet', value: 'meet' }] },
            { name: 'acceso', description: 'Pegá acá el enlace del servidor privado de Roblox.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'imagen', description: 'Link de la foto/banner para la apertura (opcional).', type: ApplicationCommandOptionType.String, required: false }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Bloqueo para evitar que cualquiera tire links falsos
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ 
                content: '❌ **No tienes permisos:** Solo el Staff puede liberar los accesos de la sesión.', 
                ephemeral: true 
            });
        }

        const idInicio = interaction.options.getString('mensaje');
        const tipo = interaction.options.getString('tipo');
        const linkSesion = interaction.options.getString('acceso');
        const urlImagen = interaction.options.getString('imagen');

        const titulo = tipo === 'rp' ? '__🟠SWFL Roleplay Release🟠__' : '__🟠SWFL Meet Release🟠__';

        const embedRelease = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(`> **Anfitrión:** <@${interaction.user.id}>\n\nLa sesión fue oficialmente lanzada. Si aportaste tu reacción en el mensaje de inicio, toca el botón de abajo para obtener el acceso.\n\n⚠️ *Filtrar el enlace directo es motivo de ban.*`)
            .setColor('#ff6600');

        if (urlImagen) embedRelease.setImage(urlImagen);

        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_voto_swfl')
                .setLabel('Link de la Sesión')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: 'Lanzando sistema de accesos...', ephemeral: true });
        const msgRelease = await interaction.channel.send({ content: '@everyone', embeds: [embedRelease], components: [fila] });

        global.coleccionSesiones.set(msgRelease.id, { idInicio, linkSesion });
    }
};
