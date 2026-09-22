import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import Sesion from '../../../models/Session.js';

export default {
    name: 'abrir_feedback_swfl',

    /**
     * customId: abrir_feedback_swfl  OR  abrir_feedback_swfl:<idInicio>
     */
    async execute(interaction, client, args = []) {
        const idInicio = args[0] || null;

        let hostId = null;
        if (idInicio) {
            const sesion = await Sesion.findOne({ idInicio }).lean().catch(() => null);
            if (sesion?.hostId) hostId = String(sesion.hostId);
        }
        if (!hostId && interaction.guildId) {
            const ult = await Sesion.findOne({
                guildId: interaction.guildId,
                estado: 'cerrada'
            })
                .sort({ fechaCierre: -1 })
                .lean()
                .catch(() => null);
            if (ult?.hostId) hostId = String(ult.hostId);
        }

        if (!hostId) {
            return interaction.reply({
                content: '❌ No se pudo identificar al host de la sesión. Intentá de nuevo más tarde.',
                ephemeral: true
            });
        }

        const modal = new ModalBuilder()
            .setCustomId(`enviar_feedback_swfl:${hostId}:${idInicio || 'none'}`)
            .setTitle('Opinión de la Sesión');

        const inputNota = new TextInputBuilder()
            .setCustomId('feedback_nota')
            .setLabel('Calificá la sesión del 1 al 10')
            .setPlaceholder('Ej: 9')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(2);

        const inputComentarios = new TextInputBuilder()
            .setCustomId('feedback_comentarios')
            .setLabel('¿Qué fue lo bueno o malo de esta sesión?')
            .setPlaceholder('Ej: Excelente organización y ambiente.')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);

        modal.addComponents(
            new ActionRowBuilder().addComponents(inputNota),
            new ActionRowBuilder().addComponents(inputComentarios)
        );

        await interaction.showModal(modal);
    }
};
