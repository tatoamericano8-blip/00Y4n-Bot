import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    // Registramos la estructura de manera plana para evitar bloqueos del Handler
    data: {
        name: 'sesiones_00y4n', 
        description: 'Manejo de sesiones de SWFL para la comunidad',
        options: [
            {
                name: 'rp',
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
                name: 'meet',
                description: 'Lanza un inicio de sesión para un Car Meet.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'reacciones', description: 'Cantidad de reacciones necesarias.', type: ApplicationCommandOptionType.Integer, required: true },
                    { name: 'tematica', description: 'Ejemplo: JDM, Exóticos', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'spots', description: 'Ejemplo: 2-3 SPOTS + BOTM', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'ubicacion', description: 'Lugar de inicio (Ej: Spawn)', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'imagen', description: 'Link de la foto/banner para el Car Meet (opcional).', type: ApplicationCommandOptionType.String, required: false }
                ]
            }
        ]
    },

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const urlImagen = interaction.options.getString('imagen');

        if (sub === 'rp') {
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
            const msg = await interaction.channel.send({ content: '@everyone', embeds: [embedRP] });
            await msg.react('✅');
        }

        if (sub === 'meet') {
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
            const msg = await interaction.channel.send({ content: '@everyone', embeds: [embedMeet] });
            await msg.react('✅');
        }
    }
};
