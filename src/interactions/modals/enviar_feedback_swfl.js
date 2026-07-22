import { EmbedBuilder } from 'discord.js';

export default {
    name: 'enviar_feedback_swfl',

    async execute(interaction) {
        const hostEnviado = interaction.fields.getTextInputValue('feedback_host');
        const notaEnviada = interaction.fields.getTextInputValue('feedback_nota');
        const comentariosEnviados = interaction.fields.getTextInputValue('feedback_comentarios');

        const embedRespuesta = new EmbedBuilder()
            .setTitle('__SWFL | Nueva Opinión Recibida__')
            .setDescription(`¡Un miembro ha dejado su reseña sobre la última sesión jugada!`)
            .addFields(
                { name: '👤 Enviado por:', value: `<@${interaction.user.id}>`, inline: true },
                { name: '🚗 Anfitrión mencionado:', value: `${hostEnviado}`, inline: true },
                { name: '⭐ Calificación:', value: `**${notaEnviada} / 10**`, inline: true },
                { name: '💬 Comentarios y sugerencias:', value: `\`\`\`text\n${comentariosEnviados}\n\`\`\``, inline: false }
            )
            .setColor('#74d4fc')
            .setTimestamp();

        // Respuesta efímera (oculta) para el usuario que completó el formulario
        await interaction.reply({ content: '✅ **¡Muchas gracias!** Tu opinión ha sido registrada correctamente.', ephemeral: true });

        // 🆔 PONÉ ACÁ EL ID DEL CANAL DONDE QUERÉS QUE LLEGUEN LAS OPINIONES
        // (Dale click derecho al canal en Discord -> "Copiar ID del canal")
        const idCanalDestino = '1529286924362317974'; 

        const canalDestino = interaction.client.channels.cache.get(idCanalDestino);

        if (canalDestino) {
            // Si el bot encuentra el canal por ID, lo manda ahí (privado o específico)
            await canalDestino.send({ embeds: [embedRespuesta] });
        } else {
            // Si por alguna razón pusiste mal el ID o no lo encuentra, lo manda al canal actual para no perder la información
            await interaction.channel.send({ embeds: [embedRespuesta] });
        }
    }
};
