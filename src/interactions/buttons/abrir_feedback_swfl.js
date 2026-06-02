import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export default {
    name: 'abrir_feedback_swfl',

    async execute(interaction) {
        // Creamos el diseño del cuadro emergente (Modal)
        const modal = new ModalBuilder()
            .setCustomId('enviar_feedback_swfl')
            .setTitle('Opinión de la Sesión');

        // Campo 1: Anfitrión (Corto)
        const inputHost = new TextInputBuilder()
            .setCustomId('feedback_host')
            .setLabel('¿Quién fue el anfitrión? *')
            .setPlaceholder('Ej: 00Y4n')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // Campo 2: Calificación (Corto)
        const inputNota = new TextInputBuilder()
            .setCustomId('feedback_nota')
            .setLabel('Calificá la sesión del 1 al 10. *')
            .setPlaceholder('Ej: 9')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // Campo 3: Reseña (Largo/Párrafo)
        const inputComentarios = new TextInputBuilder()
            .setCustomId('feedback_comentarios')
            .setLabel('¿Qué fue lo bueno o malo de esta sesión? *')
            .setPlaceholder('Ej: Excelente organización, se podrían hacer las sesiones un poco más largas.')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        // Metemos cada campo en su propia fila obligatoria de Discord
        const fila1 = new ActionRowBuilder().addComponents(inputHost);
        const fila2 = new ActionRowBuilder().addComponents(inputNota);
        const fila3 = new ActionRowBuilder().addComponents(inputComentarios);

        modal.addComponents(fila1, fila2, fila3);

        // Le mostramos la ventana emergente al usuario en su pantalla
        await interaction.showModal(modal);
    }
};
