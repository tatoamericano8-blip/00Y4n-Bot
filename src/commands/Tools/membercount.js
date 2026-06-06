import { EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'membercount_swfl',
        description: 'Muestra la cantidad total de miembros actuales en el servidor.',
    },

    async execute(interaction) {
        // Obtenemos el número total de miembros del servidor actual
        const totalMiembros = interaction.guild.memberCount;

        // Formateamos el número para que use puntos de separación de miles (Ej: 21.718 en vez de 21718)
        const conteoFormateado = totalMiembros.toLocaleString('es-AR');

        // Clonamos la estructura exacta y minimalista de image_c9c4fd.png
        const embedCount = new EmbedBuilder()
            .setTitle('Miembros')
            .setDescription(conteoFormateado)
            .setColor('#ff6600') // Tu toque flama 00Y4n
            .setTimestamp(); // Clava la hora exacta abajo igual que en la foto

        // Respondemos de forma pública para que todo el mundo vea el contador
        await interaction.reply({ embeds: [embedCount] });
    }
};
