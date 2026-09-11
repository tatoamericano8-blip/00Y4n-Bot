import { EmbedBuilder } from 'discord.js';
import { E } from '../../config/emojis.js';

export default {
    name: 'verificar_reinvite_swfl', // Mismo customId que el botón

    async execute(interaction) {
        // Frenamos los 3 segundos de Discord al instante
        await interaction.deferReply({ ephemeral: true });

        global.coleccionReinvites = global.coleccionReinvites || new Map();
        
        // Buscamos el link de Roblox guardado en este mensaje
        const linkReal = global.coleccionReinvites.get(interaction.message.id);

        // ❌ CASO DE ERROR: Si el bot se reinició o expiró
        if (!linkReal) {
            const embedError = new EmbedBuilder()
                .setTitle('❌ Error de Sincronización')
                .setDescription('Las re-invitaciones para esta tanda han expirado o el bot se reinició.\n\n*Por favor, espera a que el Staff mande un nuevo aviso en este canal.*')
                .setColor('#ff4a4a'); // Rojo para alertas de error

            return await interaction.editReply({ embeds: [embedError] });
        }

        // 🎉 CASO DE ÉXITO: Estructura de Embed limpia con tu nuevo color celestito
        const embedExito = new EmbedBuilder()
            .setTitle(E.aalas + ' Southwest Florida - Enlace de Re-Invitación ' + E.aalas)
            .setDescription(E.dot + ' **¡Re-Invitación aceptada!** Recuerda respetar las indicaciones del Staff, ingresar despacio a los spots de estacionamiento y mantener una excelente conducta dentro del servidor.')
            .addFields({
                name: 'Enlace del Car Meet',
                value: `${E.hyperlink} Haz clic [aquí](${linkReal}) para unirte a la sesión actual.`,
                inline: false
            })
            .setFooter({ text: '⚠️ Recordá evitar pasarle el enlace a usuarios que no pertenezcan al servidor.' })
            .setColor('#74d4fc'); // Tu nuevo color principal celestito

        // Le entregamos el link en un hermoso embed privado
        await interaction.editReply({ embeds: [embedExito] });
    }
};
