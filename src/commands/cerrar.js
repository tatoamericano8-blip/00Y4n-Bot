import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'cerrar_swfl',
        description: 'Cierra oficialmente la sesión de SWFL y muestra el resumen de la juntada.',
        options: [
            {
                name: 'tipo',
                description: '¿Qué sesión estás cerrando?',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'Roleplay', value: 'rp' },
                    { name: 'Car Meet', value: 'meet' }
                ]
            },
            {
                name: 'duracion',
                description: '¿Cuánto tiempo duró la sesión? (Ej: 1 hora y 15 minutos)',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'imagen',
                description: 'Link de la foto/banner de "Sesión Finalizada" (opcional).',
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    },

    async execute(interaction) {
        const tipo = interaction.options.getString('tipo');
        const duracion = interaction.options.getString('duracion');
        const urlImagen = interaction.options.getString('imagen');

        const titulo = tipo === 'rp' ? '__SWFL Roleplay | Sesión Finalizada__' : '__SWFL Meet | Sesión Finalizada__';

        const embedCierre = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(`La sesión ha concluido oficialmente. ¡Muchísimas gracias a todos los que asistieron, respetaron las reglas y compartieron un buen rato con sus naves! 🚗💨\n\n> 👤 **Anfitrión:** <@${interaction.user.id}>\n> ⏱️ **Duración Total:** ${duracion}`)
            .setColor('#ff6600');

        if (urlImagen) embedCierre.setImage(urlImagen);

        // Mensaje oculto de confirmación solo para vos
        await interaction.reply({ content: 'Cerrando la sesión y generando el anuncio...', ephemeral: true });

        // Mensaje público: Envía SOLO el embed limpio, sin menciones a @everyone ni roles
        await interaction.channel.send({ embeds: [embedCierre] });
    }
};
