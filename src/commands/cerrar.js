import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// --- DICCIONARIO DE EMOJIS ---
const EMOJIS = {
    flechaH: '<:FlechaHoriz00Y4n:1519474590370500608>',
    flechaV: '<:Flecha_00Y4n:1519473149845045400>',
    circMov: '<a:circmovim00y4n:1519476873959178380>',
    coraaMov: '<a:coraamov00y4n:1519475012283666554>'
};

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
        // --- PEGA AQUÍ EL LINK DE TU IMAGEN PREDETERMINADA ---
        const URL_IMAGEN_DEFAULT = 'https://cdn.discordapp.com/attachments/1505017301089652898/1515546634128457818/session_terminada_00y4n.png?ex=6a3fe10b&is=6a3e8f8b&hm=48d151b6e43796fbe3d66329f18bbab5fbd16c6e583158622c25a3cbe938e0a4&';

        const tipo = interaction.options.getString('tipo');
        const duracion = interaction.options.getString('duracion');
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        const titulo = tipo === 'rp' ? `${EMOJIS.coraaMov} SWFL Roleplay | Sesión Finalizada ${EMOJIS.coraaMov}` : `${EMOJIS.coraaMov} SWFL Meet | Sesión Finalizada ${EMOJIS.coraaMov}`;

        const embedCierre = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(`La sesión ha concluido oficialmente. ¡Muchísimas gracias a todos los que asistieron, respetaron las reglas y compartieron un buen rato con sus naves! 🚗💨\n\n${EMOJIS.flechaV} **Anfitrión:** <@${interaction.user.id}>\n${EMOJIS.flechaV} **Duración Total:** ${duracion}`)
            .setColor('#ff6600');

        // Lógica: Usa la foto subida, si no, usa la predeterminada
        if (fotoAdjunta) {
            embedCierre.setImage(fotoAdjunta.url);
        } else {
            embedCierre.setImage(URL_IMAGEN_DEFAULT);
        }

        // Creamos el botón de Feedback
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
