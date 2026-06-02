import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: {
        name: 'sesiones_00y4n',
        description: 'Gestión de sesiones de Roleplay y Car Meets',
        options: [
            {
                name: 'startup_rp',
                description: 'Lanza un inicio de sesión de Roleplay convencional.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'reacciones', description: 'Cantidad de reacciones necesarias.', type: ApplicationCommandOptionType.Integer, required: true },
                    { name: 'limite', description: 'Ejemplo: 80 MPH', type: ApplicationCommandOptionType.String, required: false },
                    { name: 'peacetime', description: '¿Peacetime activo? (On / Off)', type: ApplicationCommandOptionType.String, required: false },
                    { name: 'imagen', description: 'Link de la foto/banner para el Roleplay (opcional).', type: ApplicationCommandOptionType.String, required: false }
                ]
            },
            {
                name: 'startup_meet',
                description: 'Lanza un inicio de sesión para un Car Meet.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'reacciones', description: 'Cantidad de reacciones necesarias.', type: ApplicationCommandOptionType.Integer, required: true },
                    { name: 'tematica', description: 'Ejemplo: JDM, Exóticos', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'spots', description: 'Ejemplo: 2-3 SPOTS + BOTM', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'ubicacion', description: 'Lugar de inicio (Ej: Spawn)', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'imagen', description: 'Link de la foto/banner para el Car Meet (opcional).', type: ApplicationCommandOptionType.String, required: false }
                ]
            },
            {
                name: 'lanzar',
                description: 'Lanza el botón del link vinculándolo al inicio.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'id_inicio', description: 'Copia el ID del mensaje de Startup.', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'tipo', description: '¿RP o Meet?', type: ApplicationCommandOptionType.String, required: true, choices: [{ name: 'Roleplay', value: 'rp' }, { name: 'Car Meet', value: 'meet' }] },
                    { name: 'link', description: 'Pegá acá el link de Roblox de esta sesión.', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'imagen', description: 'Link de la foto/banner para la apertura (opcional).', type: ApplicationCommandOptionType.String, required: false }
                ]
            }
        ]
    },

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const urlImagen = interaction.options.getString('imagen');

        if (sub === 'startup_rp') {
            const reacciones = interaction.options.getInteger('reacciones');
            const limite = interaction.options.getString('limite') || '80 MPH';
            const peacetime = interaction.options.getString('peacetime') || 'Off';

            const embedRP = new EmbedBuilder()
                .setTitle('__SWFL RP Startup__')
                .setDescription(`> **Anfitrión:** <@${interaction.user.id}>\n\n*Asegúrate de haber leído las normativas en el canal correspondiente y tener tu vehículo registrado antes de ingresar a la sesión.*\n\n**¡Necesitamos ${reacciones} reacciones para iniciar!**`)
                .addFields(
                    { name: '› Límite de Velocidad (FRP)', value: `${limite}`, inline: true },
                    { name: '› Estado de Peacetime', value: `${peacetime}`, inline: true }
                )
                .setColor('#ff6600');

            if (urlImagen) embedRP.setImage(urlImagen);

            await interaction.reply({ content: 'Lanzando Startup...', ephemeral: true });
            await interaction.channel.send({ content: '@everyone', embeds: [embedRP] });
            // Dejamos que los usuarios usen el tilde nativo de Discord sin forzar reacciones por código si genera conflictos en la base
        }

        if (sub === 'startup_meet') {
            const reacciones = interaction.options.getInteger('reacciones');
            const tematica = interaction.options.getString('tematica');
            const spots = interaction.options.getString('spots');
            const ubicacion = interaction.options.getString('ubicacion');

            const embedMeet = new EmbedBuilder()
                .setTitle('__SWFL Meet Startup__')
                .setDescription(`> **Anfitrión:** <@${interaction.user.id}>\n\n*¡Atención amantes de los fierros! Se viene una juntada oficial.*\n\n**¡Necesitamos ${reacciones} reacciones para iniciar!**`)
                .addFields(
                    { name: '❗ Temática del Meet', value: `${tematica}`, inline: false },
                    { name: '❗ Duración / Spots', value: `${spots}`, inline: true },
                    { name: '❗ Lugar de Inicio', value: `${ubicacion}`, inline: true }
                )
                .setColor('#ff6600');

            if (urlImagen) embedMeet.setImage(urlImagen);

            await interaction.reply({ content: 'Lanzando Car Meet...', ephemeral: true });
            await interaction.channel.send({ content: '@everyone', embeds: [embedMeet] });
        }

        if (sub === 'lanzar') {
            const idInicio = interaction.options.getString('id_inicio');
            const tipo = interaction.options.getString('tipo');
            const linkSesion = interaction.options.getString('link');

            const titulo = tipo === 'rp' ? '__SWFL Roleplay Release__' : '__SWFL Meet Release__';

            const embedRelease = new EmbedBuilder()
                .setTitle(titulo)
                .setDescription(`> **Anfitrión:** <@${interaction.user.id}>\n\nLa sesión fue oficialmente lanzada. Si aportaste tu reacción en el mensaje de inicio, toca el botón de abajo para obtener el acceso.\n\n⚠️ *Filtrar el enlace directo es motivo de ban.*`)
                .setColor('#ff6600');

            if (urlImagen) embedRelease.setImage(urlImagen);

            // Almacenamos el ID y el link directo en el botón para saltear la memoria ram volatil
            const fila = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`link_session_${idInicio}*${linkSesion}`)
                    .setLabel('Link de la Sesión')
                    .setStyle(ButtonStyle.Primary)
            );

            await interaction.reply({ content: 'Lanzando release...', ephemeral: true });
            await interaction.channel.send({ content: '@everyone', embeds: [embedRelease], components: [fila] });
        }
    }
};
