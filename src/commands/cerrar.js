import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

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
                description: 'Sube la foto o banner de la sesión finalizada (opcional).',
                type: ApplicationCommandOptionType.Attachment,
                required: false
            }
        ]
    },

    async execute(interaction) {
        const tipo = interaction.options.getString('tipo');
        const duracion = interaction.options.getString('duracion');
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        const titulo = tipo === 'rp' ? '__SWFL Roleplay | Sesión Finalizada__' : '__SWFL Meet | Sesión Finalizada__';

        const embedCierre = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(`La sesión ha concluido oficialmente. ¡Muchísimas gracias a todos los que asistieron, respetaron las reglas y compartieron un buen rato con sus naves! 🚗💨\n\n> 👤 **Anfitrión:** <@${interaction.user.id}>\n> ⏱️ **Duración Total:** ${duracion}`)
            .setColor('#ff6600');

        if (fotoAdjunta) embedCierre.setImage(fotoAdjunta.url);

        // Creamos el botón de Feedback (Estilo gris como en la imagen)
        const filaComponentes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('abrir_feedback_swfl')
                .setLabel('Opinión de la Sesión')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: 'Cerrando la sesión y generando el anuncio...', ephemeral: true });

        // Enviamos el embed junto con el botón al canal
        await interaction.channel.send({ embeds: [embedCierre], components: [filaComponentes] });
    }
};
