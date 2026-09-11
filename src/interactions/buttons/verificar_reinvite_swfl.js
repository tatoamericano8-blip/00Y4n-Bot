import { EmbedBuilder } from 'discord.js';
import { E } from '../../config/emojis.js';

export default {
    name: 'verificar_reinvite_swfl',

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        global.coleccionReinvites = global.coleccionReinvites || new Map();
        
        const linkReal = global.coleccionReinvites.get(interaction.message.id);

        if (!linkReal) {
            const embedError = new EmbedBuilder()
                .setTitle('❌ Error de Sincronización')
                .setDescription('Las re-invitaciones para esta tanda han expirado o el bot se reinició.\n\n*Por favor, espera a que el Staff mande un nuevo aviso en este canal.*')
                .setColor('#ff4a4a');

            return await interaction.editReply({ embeds: [embedError] });
        }

        const embedExito = new EmbedBuilder()
            .setTitle(E.aalas + ' Southwest Florida - Enlace de Re-Invitación ' + E.aalas)
            .setDescription(E.dot + ' **¡Re-Invitación aceptada!** Recuerda respetar las indicaciones del Staff, ingresar despacio a los spots de estacionamiento y mantener una excelente conducta dentro del servidor.')
            .addFields({
                name: 'Enlace del Car Meet',
                value: `${E.hyperlink} Haz clic [aquí](${linkReal}) para unirte a la sesión actual.`,
                inline: false
            })
            .setFooter({ text: '⚠️ Recordá evitar pasarle el enlace a usuarios que no pertenezcan al servidor.' })
            .setColor('#74d4fc');

        await interaction.editReply({ embeds: [embedExito] });
    }
};
