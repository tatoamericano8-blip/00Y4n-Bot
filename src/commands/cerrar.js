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
                name: 'notas',
                description: 'Añade un comentario final o nota sobre la sesión (opcional).',
                type: ApplicationCommandOptionType.String,
                required: false
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
        const URL_IMAGEN_DEFAULT = 'https://cdn.discordapp.com/attachments/1517331229303902432/1524843452494381146/Sesion_Concluida_NUEVO2_1.png?ex=6a51e161&is=6a508fe1&hm=3393d2fe56fe1b5bacafa4f3f227096598fa915b8c1976c7994e49c4ca5c2760&';

        const tipo = interaction.options.getString('tipo');
        const duracion = interaction.options.getString('duracion');
        const notasHost = interaction.options.getString('notas') || 'Sin notas adicionales.';
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        const titulo = tipo === 'rp' ? `<a:cadenacora:1523026520740724859> SWFL Roleplay | Sesión Concluida <a:cadenacora:1523026520740724859>` : `<a:cadenacora:1523026520740724859> SWFL Meet | Sesión Concluida <a:cadenacora:1523026520740724859>`;

        const embedCierre = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(`<:puntderecha:1523027978123087922> La sesión ha concluido oficialmente. ¡Muchísimas gracias a todos los que asistieron, respetaron las reglas y compartieron un buen rato con sus naves! <:vehiculos:1525172179279282326>\n\n<:fle:1523041359441952970> **Anfitrión:** <@${interaction.user.id}>\n<:fle:1523041359441952970> **Duración Total:** ${duracion}\n<:fle:1523041359441952970> **Notas:** ${notasHost}`)
            .setColor('#74d4fc');

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
