import { EmbedBuilder } from 'discord.js';
import { E } from '../../config/emojis.js';

export default {
    name: 'verificar_reinvite_meet_swfl', // Mismo customId que el botón del Meet

    async execute(interaction) {
        // Frenamos los 3 segundos de Discord de una
        await interaction.deferReply({ ephemeral: true });

        global.coleccionReinvitesMeet = global.coleccionReinvitesMeet || new Map();
        
        // Buscamos el link de Roblox guardado en este mensaje de Car Meet
        const linkReal = global.coleccionReinvitesMeet.get(interaction.message.id);

        // ❌ CASO DE ERROR: Si las re-invitaciones expiraron o el bot se reinició
        if (!linkReal) {
            const embedError = new EmbedBuilder()
                .setTitle('❌ Error de Sincronización')
                .setDescription('Las re-invitaciones para esta tanda de Car Meet han expirado o el bot se reinició.\n\n*Espera a que el Staff mande un nuevo aviso.*')
                .setColor('#ff4a4a'); // Rojo para alertas de error

            return await interaction.editReply({ embeds: [embedError] });
        }

        // 🎉 CASO DE ÉXITO: Estructura de Embed para el Car Meet con color celestito
        const embedExito = new EmbedBuilder()
            .setTitle(E.aalas + ' Southwest Florida - Enlace de Car Meet ' + E.aalas)
            .setDescription(E.dot + ' **¡Re-Invitación al Meet Aceptada!** Recuerda respetar las indicaciones de los organizadores, ingresar despacio a la zona asignada y mantener el orden.')
            .addFields({
                name: 'Enlace del Car Meet',
                value: `${E.hyperlink} Haz clic [aquí](${linkReal}) para unirte a las naves.`,
                inline: false
            })
            .setFooter({ text: '🚗 Recordá respetar la temática y lucir tu auto sin armar lío.' })
            .setColor('#74d4fc'); // Tu nuevo color principal celestito

        // Le entregamos el link de Roblox de forma privada en su pantalla
        await interaction.editReply({ embeds: [embedExito] });
    }
};
