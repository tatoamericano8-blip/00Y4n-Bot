import { EmbedBuilder } from 'discord.js';

export default {
    name: 'enviar_feedback_swfl', // Vinculado al customId del modal

    async execute(interaction) {
        // Extraemos lo que escribió el usuario en cada cuadrito
        const hostEnviado = interaction.fields.getTextInputValue('feedback_host');
        const notaEnviada = interaction.fields.getTextInputValue('feedback_nota');
        const comentariosEnviados = interaction.fields.getTextInputValue('feedback_comentarios');

        // Creamos el diseño del reporte de feedback recibido
        const embedRespuesta = new EmbedBuilder()
            .setTitle('__SWFL | Nueva Opinión Recibida__')
            .setDescription(`¡Un miembro ha dejado su reseña sobre la última sesión jugada!`)
            .addFields(
                { name: '👤 Enviado por:', value: `<@${interaction.user.id}>`, inline: true },
                { name: '🚗 Anfitrión mencionado:', value: `${hostEnviado}`, inline: true },
                { name: '⭐ Calificación otorgada:', value: `**${notaEnviada} / 10**`, inline: true },
                { name: '💬 Comentarios y sugerencias:', value: `\`\`\`text\n${comentariosEnviados}\n\`\`\``, inline: false }
            )
            .setColor('#ff6600') // Tu color insignia
            .setTimestamp();

        // Le respondemos de forma oculta al usuario para confirmar que se envió
        await interaction.reply({ content: '✅ **¡Muchas gracias!** Tu opinión ha sido registrada correctamente.', ephemeral: true });

        // Mandamos la reseña en limpio al canal donde se interactuó
        await interaction.channel.send({ embeds: [embedRespuesta] });
    }
};
