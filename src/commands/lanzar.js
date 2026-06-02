import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: {
        name: 'lanzar_00y4n', // Comando completamente independiente
        description: 'Lanza el botón de acceso para la sesión de SWFL vinculándolo al inicio.',
        options: [
            { name: 'id_inicio', description: 'Copia el ID del mensaje de Startup original.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'tipo', description: '¿Roleplay o Car Meet?', type: ApplicationCommandOptionType.String, required: true, choices: [{ name: 'Roleplay', value: 'rp' }, { name: 'Car Meet', value: 'meet' }] },
            { name: 'link', description: 'Pegá acá el link del servidor privado de Roblox para esta tanda.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'imagen', description: 'Link de la foto/banner para la apertura (opcional).', type: ApplicationCommandOptionType.String, required: false }
        ]
    },

    async execute(interaction) {
        const idInicio = interaction.options.getString('id_inicio');
        const tipo = interaction.options.getString('tipo');
        const linkSesion = interaction.options.getString('link');
        const urlImagen = interaction.options.getString('imagen');

        const titulo = tipo === 'rp' ? '__SWFL Roleplay Release__' : '__SWFL Meet Release__';

        const embedRelease = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(`> **Anfitrión:** <@${interaction.user.id}>\n\nLa sesión fue oficialmente lanzada. Si aportaste tu reacción en el mensaje de inicio, toca el botón de abajo para obtener el acceso.\n\n⚠️ *Filtrar el enlace directo es motivo de ban.*`)
            .setColor('#ff6600');

        if (urlImagen) embedRelease.setImage(urlImagen);

        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`link_session_${idInicio}*${linkSesion}`)
                .setLabel('Link de la Sesión')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: 'Lanzando sistema de accesos...', ephemeral: true });
        await interaction.channel.send({ content: '@everyone', embeds: [embedRelease], components: [fila] });
    }
};
